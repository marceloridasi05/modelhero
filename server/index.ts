import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "path";
import fs from "fs";

import { pool } from "./db";
import { registerRoutes } from "./routes";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION:", err?.stack || err?.message || err);
});
process.on("unhandledRejection", (reason) => {
  console.error("💥 UNHANDLED REJECTION:", reason);
});

const app = express();
app.disable("x-powered-by");

const isProduction =
  process.env.NODE_ENV === "production";

if (isProduction) {
  app.set("trust proxy", 1);
}

/* =========================
   SAFE ASYNC WRAPPER (evita crash por handler async)
========================= */
function wrapAsync<T extends (...args: any[]) => any>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const ROUTE_METHODS = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "options",
  "head",
  "all",
] as const;
for (const m of ROUTE_METHODS) {
  const orig = (app as any)[m].bind(app);
  (app as any)[m] = (...args: any[]) => {
    const wrapped = args.map((a: any) =>
      typeof a === "function" ? wrapAsync(a) : a,
    );
    return orig(...wrapped);
  };
}

/* =========================
   REQUEST LOG (focado em /api)
========================= */
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (req.path.startsWith("/api") && !req.path.includes("/gamification")) {
      const ms = Date.now() - start;
      const sessionInfo = req.session
        ? `sid=${req.sessionID?.substring(0, 8)} uid=${req.session.userId || "none"}`
        : "no-session";
      const cookiePresent = req.headers.cookie ? "cookie=yes" : "cookie=no";
      console.log(
        `[${res.statusCode}] ${req.method} ${req.originalUrl} ${ms}ms [${sessionInfo}] [${cookiePresent}]`,
      );
    }
  });
  next();
});

/* =========================
   STRIPE WEBHOOK (must be before express.json())
========================= */
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature)
      return res.status(400).json({ error: "Missing stripe-signature" });

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        console.error("STRIPE WEBHOOK ERROR: req.body is not a Buffer");
        return res.status(500).json({ error: "Webhook processing error" });
      }

      const { WebhookHandlers } = await import("./webhookHandlers");
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);

      return res.status(200).json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error?.message || error);
      return res.status(400).json({ error: "Webhook processing error" });
    }
  },
);

/* =========================
   BODY
========================= */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

/* =========================
   SESSION (robusta + sem dependência de CREATE via lib)
========================= */
const PgSession = connectPgSimple(session);

async function ensureSessionTable() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS user_sessions (
      sid varchar NOT NULL PRIMARY KEY,
      sess json NOT NULL,
      expire timestamp(6) NOT NULL
    )`,
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON user_sessions (expire)`,
  );
}

async function buildSessionStore() {
  try {
    await pool.query("SELECT 1");
  } catch (err) {
    console.error(
      "🔥 DB not reachable for sessions. Falling back to MemoryStore:",
      err,
    );
    return new session.MemoryStore();
  }

  try {
    await ensureSessionTable();
    const store = new PgSession({
      pool,
      tableName: "user_sessions",
    });

    store.on?.("error", (e: unknown) =>
      console.error("🔥 Session store error:", e),
    );
    return store;
  } catch (err) {
    console.error(
      "🔥 Failed to init PG session store. Falling back to MemoryStore:",
      err,
    );
    return new session.MemoryStore();
  }
}

const sessionSecret =
  process.env.SESSION_SECRET ||
  "modelhero-secret";

const server = createServer(app);

/* =========================
   HEALTH (before session — isolates DB from session issues)
========================= */
app.get("/health", (_req, res) => res.status(200).send("OK"));

app.get("/api/health", async (_req, res) => {
  try {
    const r = await pool.query("SELECT 1 AS ok");
    res.json({ ok: true, db: r.rows[0]?.ok === 1, timestamp: new Date().toISOString() });
  } catch (e: any) {
    console.error("🔥 /api/health DB error:", e?.stack || e);
    res.status(500).json({ ok: false, db: false, error: e?.message, timestamp: new Date().toISOString() });
  }
});

/* =========================
   VITE DEV (must be set up before start for HMR)
========================= */
if (!isProduction) {
  import("./vite").then(({ setupVite }) => {
    setupVite(server, app);
  });
}


process.on("unhandledRejection", (reason) =>
  console.error("🔥 UnhandledRejection:", reason),
);
process.on("uncaughtException", (error) =>
  console.error("🔥 UncaughtException:", error),
);

/* =========================
   STRIPE INITIALIZATION
========================= */
let stripeInitialized = false;

async function initStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.log("STRIPE_SECRET_KEY not found, skipping Stripe initialization");
    return;
  }

  try {
    console.log("Stripe secret key found, Stripe features enabled.");
    stripeInitialized = true;
  } catch (error: any) {
    console.error("Failed to initialize Stripe:", error);
  }
}

export function isStripeInitialized() {
  return stripeInitialized;
}

/* =========================
   FOLLOW-UP EMAILS JOB
========================= */
async function processFollowUpEmails() {
  try {
    const { storage } = await import("./storage");
    const { sendFollowUp24hEmail, sendFollowUp4dEmail, sendFollowUp10dEmail, sendFollowUp30dInactiveEmail } =
      await import("./resendClient");

    const { email24h, email4d, email10d } =
      await storage.getUsersForFollowUpEmails();

    let sent = 0;

    for (const user of email24h) {
      try {
        const language =
          user.preferredLanguage || user.registrationLanguage || "pt";
        const result = await sendFollowUp24hEmail(user.email, language);
        if (result.success) {
          await storage.markFollowUpEmailSent(user.id, "24h");
          sent++;
        }
      } catch (err) {
        console.error(
          `[Follow-up Job] Error sending 24h email to ${user.email}:`,
          err,
        );
      }
    }

    for (const user of email4d) {
      try {
        const language =
          user.preferredLanguage || user.registrationLanguage || "pt";
        const result = await sendFollowUp4dEmail(user.email, language);
        if (result.success) {
          await storage.markFollowUpEmailSent(user.id, "4d");
          sent++;
        }
      } catch (err) {
        console.error(
          `[Follow-up Job] Error sending 4d email to ${user.email}:`,
          err,
        );
      }
    }

    for (const user of email10d) {
      try {
        const language =
          user.preferredLanguage || user.registrationLanguage || "pt";
        const result = await sendFollowUp10dEmail(user.email, language);
        if (result.success) {
          await storage.markFollowUpEmailSent(user.id, "10d");
          sent++;
        }
      } catch (err) {
        console.error(
          `[Follow-up Job] Error sending 10d email to ${user.email}:`,
          err,
        );
      }
    }

    const email30dInactive = await storage.getUsersFor30dInactivityEmail();
    for (const user of email30dInactive) {
      try {
        const language =
          user.preferredLanguage || user.registrationLanguage || "pt";
        const result = await sendFollowUp30dInactiveEmail(user.email, user.name, language);
        if (result.success) {
          await storage.mark30dInactivityEmailSent(user.id);
          sent++;
        }
      } catch (err) {
        console.error(
          `[Follow-up Job] Error sending 30d inactive email to ${user.email}:`,
          err,
        );
      }
    }

    if (sent > 0) {
      console.log(
        `[Follow-up Job] Sent ${sent} follow-up emails (24h: ${email24h.length}, 4d: ${email4d.length}, 10d: ${email10d.length}, 30d-inactive: ${email30dInactive.length})`,
      );
    }
  } catch (err) {
    console.error("[Follow-up Job] Error processing follow-up emails:", err);
  }
}

/* =========================
   TEST EMAIL (lazy import)
========================= */
app.get("/api/test-email", async (_req: Request, res: Response) => {
  try {
    const { sendEmail } = await import("./lib/email.js");
    await sendEmail({
      to: "marceloribeiro05@gmail.com",
      subject: "Teste Resend OK",
      html: `
        <h1>Email funcionando 🎉</h1>
        <p>Resend + Replit + Express integrados com sucesso.</p>
      `,
    });
    res.send("Email enviado com sucesso");
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao enviar email");
  }
});

/* =========================
   START
========================= */
async function start() {
  console.log(`[STARTUP] Building session store...`);
  const store = await buildSessionStore();
  console.log(`[STARTUP] Session store type: ${store.constructor?.name || "unknown"}`);
  console.log(`[STARTUP] isProduction=${isProduction}, PORT=${process.env.PORT}`);

  const sessionMiddleware = session({
    name: "modelhero.sid",
    store,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    proxy: isProduction,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    sessionMiddleware(req, res, (err?: any) => {
      if (err) {
        console.error("🔥 SESSION MIDDLEWARE ERROR:", err?.stack || err?.message || err);
        if (req.path.startsWith("/api")) {
          return res.status(500).json({
            error: "Session error",
            message: String(err?.message || "Session middleware failed"),
          });
        }
      }
      next(err);
    });
  });

  /* =========================
     DIAGNOSTIC ENDPOINTS (after session middleware)
  ========================= */
  app.get("/api/debug/status", async (req: Request, res: Response) => {
    try {
      const dbOk = await pool.query("SELECT 1").then(() => true).catch(() => false);

      let userSessionCount = 0;
      try {
        const result = await pool.query("SELECT COUNT(*) FROM user_sessions");
        userSessionCount = parseInt(result.rows[0].count, 10);
      } catch {}

      const requiredTables = ["users", "kits", "materials", "wishlist_items", "user_sessions", "ia_actions", "user_badges", "user_events"];
      const tableStatus: Record<string, boolean> = {};
      for (const table of requiredTables) {
        try {
          await pool.query(`SELECT 1 FROM "${table}" LIMIT 1`);
          tableStatus[table] = true;
        } catch {
          tableStatus[table] = false;
        }
      }

      const missingTables = Object.entries(tableStatus).filter(([, ok]) => !ok).map(([name]) => name);

      res.json({
        server: {
          nodeEnv: process.env.NODE_ENV,
          isProduction,
          port: process.env.PORT,
          uptime: process.uptime(),
          memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
        },
        database: {
          connected: dbOk,
          tables: tableStatus,
          missingTables,
        },
        session: {
          exists: !!req.session,
          storeType: req.sessionStore?.constructor?.name || "unknown",
          hasUserId: !!req.session?.userId,
          sessionId: req.sessionID ? req.sessionID.substring(0, 8) + "..." : null,
          totalStoredSessions: userSessionCount,
        },
        cookie: {
          secure: isProduction,
          sameSite: "lax",
          httpOnly: true,
          hasCookie: !!req.headers.cookie,
        },
      });
    } catch (e: any) {
      console.error("🔥 /api/debug/status error:", e?.stack || e);
      res.status(500).json({ error: "Debug endpoint failed", message: e?.message });
    }
  });

  app.get("/api/debug/test-kits", async (req: Request, res: Response) => {
    const steps: Record<string, any> = {};
    try {
      steps.sessionExists = !!req.session;
      steps.userId = req.session?.userId || null;
      steps.hasCookie = !!req.headers.cookie;

      if (!req.session?.userId) {
        return res.json({ steps, error: "No userId in session" });
      }

      steps.dbTest = await pool.query("SELECT 1").then(() => "ok").catch((e: any) => e.message);

      const result = await pool.query("SELECT id, name, brand, scale FROM kits WHERE user_id = $1 LIMIT 3", [req.session.userId]);
      steps.queryResult = { rowCount: result.rowCount, sample: result.rows };

      const { storage } = await import("./storage");
      const kits = await storage.getKitsByUser(req.session.userId);
      steps.storageResult = { count: kits.length, firstKit: kits[0] ? { id: kits[0].id, name: kits[0].name } : null };

      steps.jsonSerialize = "testing...";
      const payload = { kits, kitsForSale: kits.filter((k: any) => (k.isForSale || k.destino === "a_venda") && k.destino !== "vendido") };
      const serialized = JSON.stringify(payload);
      steps.jsonSerialize = `ok (${serialized.length} bytes)`;

      return res.json({ steps, success: true });
    } catch (e: any) {
      steps.error = { message: e.message, stack: e.stack?.split("\n").slice(0, 5) };
      return res.status(500).json({ steps });
    }
  });

  /* =========================
     API ROUTES + OBJECT STORAGE (after session middleware)
  ========================= */
  console.log(`[STARTUP] Registering API routes...`);
  registerRoutes(server, app);
  registerObjectStorageRoutes(app);
  console.log(`[STARTUP] API routes registered successfully`);

  /* =========================
     FRONTEND (production static, after API routes)
  ========================= */
  if (isProduction) {
    const publicDir = path.resolve(process.cwd(), "dist/public");
    const indexFile = path.join(publicDir, "index.html");

    if (!fs.existsSync(publicDir) || !fs.existsSync(indexFile)) {
      console.error("🔥 Frontend build not found. Expected:", publicDir);
    }

    // Serve uploaded files
    const uploadsDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), "uploads");
    app.use('/objects', express.static(uploadsDir));

    app.use(express.static(publicDir, { index: false }));

    app.get("*", (req, res) => {
      if (req.path.startsWith("/api"))
        return res.status(404).json({ error: "Not found" });
      if (!fs.existsSync(indexFile))
        return res.status(500).send("Frontend build missing");
      return res.sendFile(indexFile);
    });
  }

  /* =========================
     ERROR HANDLERS (must be last)
  ========================= */
  app.use("/api", (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("🔥 API ERROR:", err?.stack || err?.message || err);
    if (res.headersSent) return next(err);
    return res.status(500).json({
      error: "Internal API Error",
      message: String(err?.message || "Unknown error"),
      path: req.originalUrl,
    });
  });

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    console.error("🔥 UNHANDLED ERROR:", err?.stack || err?.message || err);
    if (res.headersSent) return;
    res.status(500).json({
      error: "Internal Server Error",
      message: String(err?.message || "Unknown error"),
      path: req.originalUrl,
    });
  });

  const port = Number(process.env.PORT ?? 5000);

  server.listen(port, "0.0.0.0", async () => {
    console.log(`🚀 Server running on port ${port} (prod=${isProduction})`);
    await initStripe();

    setInterval(processFollowUpEmails, 60 * 60 * 1000);
    setTimeout(processFollowUpEmails, 5 * 60 * 1000);
  });
}

start().catch((err) => {
  console.error("🔥 Fatal startup error:", err);
  process.exit(1);
});
