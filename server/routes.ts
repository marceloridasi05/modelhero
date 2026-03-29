import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import bcrypt from "bcryptjs";
import OpenAI from "openai";
import { randomUUID } from "crypto";
import { eq, lt } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import {
  loginSchema,
  registerSchema,
  insertKitSchema,
  insertWishlistItemSchema,
  ADMIN_EMAILS,
} from "@shared/schema";
import { validateImageFile, logUploadValidationFailure } from "./utils/upload-validator";
import { objectStorageClient } from "./replit_integrations/object_storage/objectStorage";
import {
  getUncachableStripeClient,
  getStripePublishableKey,
} from "./stripeClient";
import {
  sendWelcomeEmail,
  sendFollowUp24hEmail,
  sendFollowUp4dEmail,
  sendFollowUp10dEmail,
  sendFollowUp30dInactiveEmail,
  sendLimitReachedEmail,
  sendCorrectionEmail24h,
  sendCorrectionEmail4d,
  sendCorrectionEmail10d,
} from "./resendClient";

function sanitizeKitArrayFields(kit: any): any {
  if (!kit) return kit;
  const arrayJsonbFields = ['paints', 'referencePhotos', 'referenceDocuments', 'buildPhotos', 'usefulLinks', 'instructionImages', 'aftermarkets', 'saleListingLinks'];
  const sanitized = { ...kit };
  for (const field of arrayJsonbFields) {
    if (sanitized[field] !== undefined && sanitized[field] !== null && !Array.isArray(sanitized[field])) {
      sanitized[field] = [];
    }
  }
  return sanitized;
}

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw Object.assign(new Error("OpenAI API key not configured"), {
        code: "OPENAI_NOT_CONFIGURED",
      });
    }

    openai = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL,
    });
  }

  return openai;
}

/* =========================
   AUTH & AUTHORIZATION
========================= */
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Nao autenticado" });
  }
  next();
};

/**
 * SECURITY: Validar que kit pertence ao usuário autenticado
 * Previne IDOR (Insecure Direct Object Reference)
 */
const validateKitOwnership = async (
  kitId: string,
  userId: string,
): Promise<boolean> => {
  const kit = await storage.getKit(kitId, userId);
  return !!kit;
};

const FREE_ITEM_LIMIT = 10;

async function checkFreeUserLimit(
  userId: string,
): Promise<{ canAdd: boolean; totalItems: number; limit: number }> {
  const user = await storage.getUser(userId);
  if (!user) {
    return { canAdd: false, totalItems: 0, limit: FREE_ITEM_LIMIT };
  }

  const hasUnlimitedAccess =
    user.isAdmin || user.status === "pago" || user.status === "tester";
  if (hasUnlimitedAccess) {
    return { canAdd: true, totalItems: 0, limit: Infinity };
  }

  const totalItems = await storage.getTotalItemCount(userId);
  return {
    canAdd: totalItems < FREE_ITEM_LIMIT,
    totalItems,
    limit: FREE_ITEM_LIMIT,
  };
}

export function registerRoutes(_server: Server, app: Express): void {
  /* =========================
     DEBUG
  ========================= */
  app.get("/api/debug/kits-info", requireAuth, async (req, res) => {
    const kits = await storage.getKitsListByUser(req.session.userId!);
    res.json({
      userId: req.session.userId,
      kitCount: kits.length,
      kitNames: kits.map((k) => k.name),
    });
  });

  /* =========================
     IMAGE PROXY
  ========================= */
  app.get("/api/proxy-image", async (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return res
          .status(response.status)
          .json({ error: "Failed to fetch image" });
      }

      const contentType = response.headers.get("content-type") || "image/jpeg";
      const buffer = await response.arrayBuffer();

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("Error proxying image:", error);
      res.status(500).json({ error: "Failed to proxy image" });
    }
  });

  /* =========================
     RATE LIMITING
  ========================= */
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per windowMs
    message: "Muitas tentativas de login. Tente novamente em 15 minutos.",
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skip: (req: Request) => {
      // Skip rate limiting for successful login attempts
      return false; // We'll handle this with store reset on success
    },
    store: new (require("express-rate-limit").MemoryStore)(),
    keyGenerator: (req: Request) => {
      // Rate limit by IP address for login attempts
      return req.ip || req.socket.remoteAddress || "unknown";
    },
  });

  /* =========================
     CSRF PROTECTION
  ========================= */
  // Custom CSRF middleware - protects against Cross-Site Request Forgery
  // Validates token from request headers against session-stored token
  const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF check for safe methods
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      return next();
    }

    // Get token from header
    const tokenFromHeader = req.headers["csrf-token"] as string || req.body?.csrfToken;

    if (!tokenFromHeader) {
      console.warn(`[CSRF] Missing token from ${req.method} ${req.path}`);
      return res.status(403).json({ error: "CSRF token missing" });
    }

    // Get token from session
    const tokenFromSession = (req.session as any)?.csrfToken;

    if (!tokenFromSession) {
      console.warn(`[CSRF] No token in session for ${req.method} ${req.path}`);
      return res.status(403).json({ error: "CSRF token not found in session" });
    }

    // Validate tokens match
    if (tokenFromHeader !== tokenFromSession) {
      console.warn(`[CSRF] Token mismatch for ${req.method} ${req.path} from IP ${req.ip}`);
      return res.status(403).json({ error: "CSRF token invalid" });
    }

    next();
  };

  // Endpoint to get CSRF token (called before form submission)
  // Using crypto to generate tokens instead of csurf for GET requests
  app.get("/api/auth/csrf-token", (req, res) => {
    // Generate a CSRF token using crypto
    const crypto = require("crypto");
    const token = crypto.randomBytes(32).toString("hex");

    // Store in session for validation
    if (!req.session) {
      return res.status(500).json({ error: "Session not available" });
    }

    (req.session as any).csrfToken = token;
    req.session.save((err) => {
      if (err) {
        console.error("[CSRF Token Save Error]", err);
        return res.status(500).json({ error: "Failed to save CSRF token" });
      }
      res.json({ csrfToken: token });
    });
  });

  /* =========================
     AUTH
  ========================= */
  app.post("/api/auth/login", loginLimiter, csrfProtection, async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    const user = await storage.getUserByEmail(parsed.data.email.toLowerCase());
    if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    await storage.updateLastLogin(user.id);

    // Update gamification level retroactively for existing users
    await storage.updateGamificationLevelRetroactive(user.id);

    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) {
        console.error("[POST /api/auth/login] Session save error:", err);
        return res.status(500).json({ error: "Erro ao salvar sessao" });
      }
      console.log(
        "[POST /api/auth/login] Session saved for user:",
        user.email,
        "sessionID:",
        req.sessionID,
      );
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto,
        isAdmin: user.isAdmin,
        status: user.status,
        preferredCurrency: user.preferredCurrency,
        preferredLanguage: user.preferredLanguage,
      });
    });
  });

  app.post("/api/auth/register", csrfProtection, async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    const registrationLanguage = req.body.registrationLanguage || "pt";

    // Capture locale from Accept-Language header (data collection only)
    const acceptLanguage = req.headers["accept-language"] || "";
    const locale = acceptLanguage.split(",")[0]?.trim() || "en-US";

    // Infer country from locale (data collection only)
    const inferCountry = (loc: string): string => {
      const lower = loc.toLowerCase();
      // Extract country code from locale (e.g., pt-BR -> BR, en-US -> US)
      const parts = lower.split(/[-_]/);
      if (parts.length >= 2) {
        const countryCode = parts[1].toUpperCase();
        // Common country codes
        const validCountries = [
          "BR",
          "PT",
          "US",
          "GB",
          "ES",
          "AR",
          "MX",
          "CL",
          "CO",
          "PE",
          "FR",
          "DE",
          "IT",
          "RU",
          "JP",
          "AU",
          "CA",
        ];
        if (validCountries.includes(countryCode)) {
          return countryCode;
        }
      }
      // Fallback based on language only
      if (lower.startsWith("pt")) return "BR";
      if (lower.startsWith("es")) return "ES";
      if (lower.startsWith("en")) return "US";
      if (lower.startsWith("fr")) return "FR";
      if (lower.startsWith("de")) return "DE";
      if (lower.startsWith("it")) return "IT";
      if (lower.startsWith("ru")) return "RU";
      if (lower.startsWith("ja")) return "JP";
      return "US";
    };
    const country = inferCountry(locale);

    const hashed = await bcrypt.hash(parsed.data.password, 10);
    const user = await storage.createUser({
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashed,
      acceptedTerms: parsed.data.acceptedTerms,
      acceptedTermsAt: parsed.data.acceptedTerms ? new Date() : null,
      registrationLanguage: registrationLanguage,
      preferredLanguage: registrationLanguage,
      country: country,
      locale: locale,
    });

    sendWelcomeEmail(
      user.email,
      user.name || user.email.split("@")[0],
      registrationLanguage,
    )
      .then((result) => {
        if (result.success) {
          console.log("[Register] Welcome email sent successfully");
        } else {
          console.error(
            "[Register] Failed to send welcome email:",
            result.error,
          );
        }
      })
      .catch((err) =>
        console.error("[Register] Error sending welcome email:", err),
      );

    storage
      .logUserEvent(user.id, "sign_up")
      .catch((err) =>
        console.error("[Register] Failed to log sign_up event:", err),
      );

    req.session.userId = user.id;
    req.session.save(() => {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto,
        isAdmin: user.isAdmin,
        status: user.status,
        preferredCurrency: user.preferredCurrency,
        preferredLanguage: user.preferredLanguage,
      });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    console.log("[GET /api/auth/me] Session:", {
      hasSession: !!req.session,
      userId: req.session?.userId,
      sessionID: req.sessionID,
    });

    if (!req.session || !req.session.userId) {
      console.log("[GET /api/auth/me] No session or userId");
      return res.status(401).json({ error: "Nao autenticado" });
    }

    let user = await storage.getUser(req.session.userId);
    if (!user) {
      console.log(
        "[GET /api/auth/me] User not found for userId:",
        req.session.userId,
      );
      return res.status(401).json({ error: "Usuario nao encontrado" });
    }

    const shouldBeAdmin = ADMIN_EMAILS.includes(user.email);
    if (shouldBeAdmin && !user.isAdmin) {
      console.log("[GET /api/auth/me] Updating isAdmin for user:", user.email);
      const updatedUser = await storage.updateUserAdmin(user.id, true);
      if (updatedUser) {
        user = updatedUser;
      }
    }

    console.log("[GET /api/auth/me] Returning user:", user.email);
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      profilePhoto: user.profilePhoto,
      isAdmin: user.isAdmin,
      status: user.status,
      preferredCurrency: user.preferredCurrency,
      preferredLanguage: user.preferredLanguage,
    });
  });

  app.patch("/api/auth/profile", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { profilePhoto } = req.body;

      if (profilePhoto !== undefined && typeof profilePhoto !== "string") {
        return res.status(400).json({ error: "Foto inválida" });
      }

      const updated = await storage.updateUserProfile(userId, { profilePhoto });
      if (!updated) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json({
        id: updated.id,
        profilePhoto: updated.profilePhoto,
      });
    } catch (err) {
      console.error("Error updating profile:", err);
      res.status(500).json({ error: "Erro ao atualizar perfil" });
    }
  });

  app.patch("/api/user/preferred-currency", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { currency } = req.body;

      if (!currency || typeof currency !== "string") {
        return res.status(400).json({ error: "Moeda invalida" });
      }

      const updated = await storage.updateUserPreferredCurrency(
        userId,
        currency,
      );
      if (!updated) {
        return res.status(404).json({ error: "Usuario nao encontrado" });
      }

      res.json({ preferredCurrency: updated.preferredCurrency });
    } catch (err) {
      console.error("Error updating preferred currency:", err);
      res.status(500).json({ error: "Erro ao atualizar moeda" });
    }
  });

  app.patch("/api/user/preferred-language", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { language } = req.body;

      if (!language || typeof language !== "string") {
        return res.status(400).json({ error: "Idioma invalido" });
      }

      const updated = await storage.updateUserPreferredLanguage(
        userId,
        language,
      );
      if (!updated) {
        return res.status(404).json({ error: "Usuario nao encontrado" });
      }

      res.json({ preferredLanguage: updated.preferredLanguage });
    } catch (err) {
      console.error("Error updating preferred language:", err);
      res.status(500).json({ error: "Erro ao atualizar idioma" });
    }
  });

  app.post("/api/user/upgrade-click", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      await storage.incrementUpgradeClickCount(userId);
      await storage.logUserEvent(userId, "upgrade_button_click");
      res.json({ success: true });
    } catch (err) {
      console.error("Error tracking upgrade click:", err);
      res.status(500).json({ error: "Erro ao registrar clique" });
    }
  });

  app.post("/api/auth/logout", csrfProtection, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Erro ao fazer logout" });
      }
      res.clearCookie("modelhero.sid");
      res.json({ success: true });
    });
  });

  /* =========================
     STRIPE PAYMENTS
  ========================= */
  app.get("/api/stripe/publishable-key", async (_req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error: any) {
      // Handle case where Stripe is not configured
      if (error?.message?.includes("connection not found")) {
        console.warn("[Stripe] Not configured for this environment");
        return res
          .status(503)
          .json({ error: "Stripe not configured", notConfigured: true });
      }
      console.error("Error getting Stripe publishable key:", error);
      res.status(500).json({ error: "Stripe not configured" });
    }
  });

  app.post(
    "/api/stripe/create-checkout-session",
    requireAuth,
    async (req, res) => {
      try {
        const userId = req.session.userId!;
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(401).json({ error: "User not found" });
        }

        let stripe;
        try {
          stripe = await getUncachableStripeClient();
        } catch (error: any) {
          if (error?.message?.includes("connection not found")) {
            console.warn(
              "[Stripe] Not configured - cannot create checkout session",
            );
            return res
              .status(503)
              .json({ error: "Stripe not configured", notConfigured: true });
          }
          throw error;
        }

        const ALLOWED_PRICE_IDS = [
          "price_1SidA7Dw4LupjPaOS8tpT2OP",
        ];

        const { priceId } = req.body;

        if (!priceId || !ALLOWED_PRICE_IDS.includes(priceId)) {
          return res.status(400).json({ error: "Invalid price ID" });
        }

        let customerId = user.stripeCustomerId;
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            metadata: { userId: user.id },
          });
          await storage.updateUserStripeCustomerId(user.id, customer.id);
          customerId = customer.id;
        }

        const baseUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;

        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ["card"],
          line_items: [{ price: priceId, quantity: 1 }],
          mode: "subscription",
          success_url: `${baseUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/upgrade/cancel`,
          metadata: { userId: user.id },
        });

        res.json({ url: session.url });
      } catch (error: any) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({
          error: error.message || "Failed to create checkout session",
        });
      }
    },
  );

  app.post(
    "/api/stripe/create-portal-session",
    requireAuth,
    async (req, res) => {
      try {
        const userId = req.session.userId!;
        const user = await storage.getUser(userId);
        if (!user || !user.stripeCustomerId) {
          return res.status(400).json({ error: "No Stripe customer found" });
        }

        let stripe;
        try {
          stripe = await getUncachableStripeClient();
        } catch (error: any) {
          if (error?.message?.includes("connection not found")) {
            console.warn(
              "[Stripe] Not configured - cannot create portal session",
            );
            return res
              .status(503)
              .json({ error: "Stripe not configured", notConfigured: true });
          }
          throw error;
        }

        const baseUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;

        const session = await stripe.billingPortal.sessions.create({
          customer: user.stripeCustomerId,
          return_url: `${baseUrl}/settings`,
        });

        res.json({ url: session.url });
      } catch (error: any) {
        console.error("Error creating portal session:", error);
        res
          .status(500)
          .json({ error: error.message || "Failed to create portal session" });
      }
    },
  );

  app.get("/api/stripe/subscription-status", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({
        hasSubscription: !!user.stripeSubscriptionId,
        subscriptionId: user.stripeSubscriptionId,
        status: user.status,
      });
    } catch (error: any) {
      console.error("Error getting subscription status:", error);
      res.status(500).json({ error: "Failed to get subscription status" });
    }
  });

  /* =========================
     KITS
  ========================= */
  app.get("/api/kits/recent-global", requireAuth, async (req, res) => {
    try {
      const allKits = await storage.getRecentGlobalKits(30);

      // Shuffle and pick 6 random kits
      const shuffled = [...allKits].sort(() => Math.random() - 0.5);
      const selectedKits = shuffled.slice(0, 6);

      res.json({ kits: selectedKits });
    } catch (error: any) {
      console.error("[GET /api/kits/recent-global] Error:", error);
      res.status(500).json({ error: "Failed to fetch recent kits" });
    }
  });

  app.get("/api/kits/global-stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getGlobalStats();
      res.json(stats);
    } catch (error: any) {
      console.error("[GET /api/kits/global-stats] Error:", error);
      res.status(500).json({ error: "Failed to fetch global stats" });
    }
  });

  app.get("/api/kits", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const rawKits = await storage.getKitsListByUser(userId);
      const kits = rawKits.map(sanitizeKitArrayFields);

      res.json({
        kits,
        kitsForSale: kits.filter(
          (k) =>
            (k.isForSale || k.destino === "a_venda") && k.destino !== "vendido",
        ),
      });
    } catch (error: any) {
      console.error("[GET /api/kits] Error:", error?.message, error?.stack);
      res.status(500).json({ error: "Failed to fetch kits" });
    }
  });

  app.post("/api/kits", requireAuth, csrfProtection, async (req, res) => {
    const userId = req.session.userId!;
    console.log(
      "[POST /api/kits] Request body:",
      JSON.stringify(req.body, null, 2),
    );

    const { canAdd, totalItems, limit } = await checkFreeUserLimit(userId);
    if (!canAdd) {
      return res.status(403).json({
        error: "LIMIT_EXCEEDED",
        message: `Limite de ${limit} itens atingido (${totalItems}/${limit}). Faça upgrade para adicionar mais.`,
        totalItems,
        limit,
      });
    }

    const kitData = { ...req.body };
    if (kitData.startDate && typeof kitData.startDate === "string") {
      kitData.startDate = new Date(kitData.startDate);
    }
    if (kitData.endDate && typeof kitData.endDate === "string") {
      kitData.endDate = new Date(kitData.endDate);
    }
    if (kitData.soldDate && typeof kitData.soldDate === "string") {
      kitData.soldDate = new Date(kitData.soldDate);
    }

    const parsed = insertKitSchema.safeParse(kitData);
    if (!parsed.success) {
      console.error(
        "[POST /api/kits] Validation error:",
        JSON.stringify(parsed.error.errors, null, 2),
      );
      return res
        .status(400)
        .json({ error: "Dados inválidos", details: parsed.error.errors });
    }

    const kit = await storage.createKit(userId, parsed.data);

    // Track kit creation milestones for funnel
    const newTotalItems = await storage.getTotalItemCount(userId);
    const milestones = [1, 3, 5, 7, 10];
    for (const m of milestones) {
      if (newTotalItems >= m) {
        const eventName = `kit_created_${m}`;
        const legacyEventName = `item_created_${m}`;
        const hasNewEvent = await storage.hasUserEvent(userId, eventName);
        const hasLegacyEvent = await storage.hasUserEvent(
          userId,
          legacyEventName,
        );
        if (!hasNewEvent && !hasLegacyEvent) {
          storage
            .logUserEvent(userId, eventName)
            .catch((err) =>
              console.error(
                `[POST /api/kits] Failed to log ${eventName} event:`,
                err,
              ),
            );
        }
      }
    }

    // Check if user just reached the limit (now has exactly 10 items)
    if (newTotalItems === FREE_ITEM_LIMIT) {
      const user = await storage.getUser(userId);
      if (user && !user.limitReachedEmailSent) {
        sendLimitReachedEmail(user.email, user.preferredLanguage || "pt")
          .then(() => {
            storage.markLimitReachedEmailSent(userId);
          })
          .catch((err) =>
            console.error(
              "[POST /api/kits] Failed to send limit reached email:",
              err,
            ),
          );
      }
    }

    res.json(sanitizeKitArrayFields(kit));
  });

  app.get("/api/kits/:id", requireAuth, async (req, res) => {
    const kitId = req.params.id;
    const userId = req.session.userId!;

    // SECURITY: Validar ownership antes de retornar dados
    const kit = await storage.getKit(kitId, userId);
    if (!kit) {
      // Log sem expor detalhes
      console.warn(
        `[SECURITY] Unauthorized access attempt to kit ${kitId} by user ${userId}`
      );
      return res.status(404).json({ error: "Kit não encontrado" });
    }

    res.json(sanitizeKitArrayFields(kit));
  });

  app.patch("/api/kits/:id", requireAuth, csrfProtection, async (req, res) => {
    const kitId = req.params.id;
    const userId = req.session.userId!;
    const kitData = { ...req.body };

    // SECURITY: Validar ownership antes de atualizar
    const existingKit = await storage.getKit(kitId, userId);
    if (!existingKit) {
      console.warn(
        `[SECURITY] Unauthorized update attempt to kit ${kitId} by user ${userId}`
      );
      return res.status(404).json({ error: "Kit não encontrado" });
    }

    if (kitData.startDate && typeof kitData.startDate === "string") {
      kitData.startDate = new Date(kitData.startDate);
    }
    if (kitData.endDate && typeof kitData.endDate === "string") {
      kitData.endDate = new Date(kitData.endDate);
    }
    if (kitData.soldDate && typeof kitData.soldDate === "string") {
      kitData.soldDate = new Date(kitData.soldDate);
    }
    if (
      kitData.timerStartedAt !== undefined &&
      kitData.timerStartedAt !== null
    ) {
      kitData.timerStartedAt = String(kitData.timerStartedAt);
    }

    const kit = await storage.updateKit(kitId, userId, kitData);

    if (!kit) {
      return res.status(404).json({ error: "Kit não encontrado" });
    }

    // Log auditoria
    console.info(`[AUDIT] Kit ${kitId} updated by user ${userId}`);

    res.json(sanitizeKitArrayFields(kit));
  });

  app.delete("/api/kits/:id", requireAuth, csrfProtection, async (req, res) => {
    const kitId = req.params.id;
    const userId = req.session.userId!;

    // SECURITY: Validar ownership antes de deletar
    const existingKit = await storage.getKit(kitId, userId);
    if (!existingKit) {
      console.warn(
        `[SECURITY] Unauthorized delete attempt to kit ${kitId} by user ${userId}`
      );
      return res.status(404).json({ error: "Kit não encontrado" });
    }

    const ok = await storage.deleteKit(kitId, userId);

    if (!ok) {
      return res.status(404).json({ error: "Kit não encontrado" });
    }

    // Log auditoria
    console.info(`[AUDIT] Kit ${kitId} deleted by user ${userId}`);

    res.json({ success: true });
  });

  app.post("/api/kits/:id/duplicate", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;

      const { canAdd, totalItems, limit } = await checkFreeUserLimit(userId);
      if (!canAdd) {
        return res.status(403).json({
          error: "LIMIT_EXCEEDED",
          message: `Limite de ${limit} itens atingido (${totalItems}/${limit}). Faça upgrade para adicionar mais.`,
          totalItems,
          limit,
        });
      }

      const kit = await storage.duplicateKit(req.params.id, userId);

      if (!kit) {
        return res.status(404).json({ error: "Kit não encontrado" });
      }

      // Check if user just reached the limit (now has exactly 10 items)
      const newTotalItems = await storage.getTotalItemCount(userId);
      if (newTotalItems === FREE_ITEM_LIMIT) {
        const user = await storage.getUser(userId);
        if (user && !user.limitReachedEmailSent) {
          sendLimitReachedEmail(user.email, user.preferredLanguage || "pt")
            .then(() => {
              storage.markLimitReachedEmailSent(userId);
            })
            .catch((err) =>
              console.error(
                "[POST /api/kits/:id/duplicate] Failed to send limit reached email:",
                err,
              ),
            );
        }
      }

      res.json(sanitizeKitArrayFields(kit));
    } catch (err) {
      console.error("[POST /api/kits/:id/duplicate] Error:", err);
      res.status(500).json({ error: "Erro ao duplicar kit" });
    }
  });

  /* =========================
     USAGE / LIMITS
  ========================= */
  app.get("/api/usage", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "Usuario nao encontrado" });
      }

      const totalItems = await storage.getTotalItemCount(userId);
      const FREE_LIMIT = 10;

      const hasUnlimitedAccess =
        user.isAdmin || user.status === "pago" || user.status === "tester";
      const limit = hasUnlimitedAccess ? null : FREE_LIMIT;
      const canAddItem = hasUnlimitedAccess || totalItems < FREE_LIMIT;

      console.log("[GET /api/usage]", {
        userId,
        email: user.email,
        status: user.status,
        isAdmin: user.isAdmin,
        totalItems,
        hasUnlimitedAccess,
        canAddItem,
      });

      res.json({
        totalItems,
        limit,
        canAddItem,
        hasUnlimitedAccess,
        userStatus: user.status,
        isAdmin: user.isAdmin,
        canExport: hasUnlimitedAccess,
      });
    } catch (err) {
      console.error("Error fetching usage:", err);
      res.status(500).json({ error: "Erro ao buscar uso" });
    }
  });

  /* =========================
     GAMIFICATION
  ========================= */
  app.get("/api/gamification", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const status = await storage.getGamificationStatus(userId);
      res.json(status);
    } catch (err) {
      console.error("Error fetching gamification status:", err);
      res.status(500).json({ error: "Erro ao buscar status de gamificação" });
    }
  });

  app.post("/api/gamification/ack", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { level } = req.body;
      if (!level || typeof level !== "number") {
        return res.status(400).json({ error: "Level is required" });
      }
      await storage.acknowledgeLevelUp(userId, level);
      res.json({ success: true });
    } catch (err) {
      console.error("Error acknowledging level up:", err);
      res.status(500).json({ error: "Erro ao registrar nível" });
    }
  });

  app.post("/api/user/first-kit-status", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const isFirstKit = !user.hasCompletedFirstKit;

      if (isFirstKit) {
        await storage.markFirstKitCompleted(userId);
      }

      res.json({ isFirstKit });
    } catch (err) {
      console.error("Error checking first kit status:", err);
      res.status(500).json({ error: "Erro ao verificar status" });
    }
  });

  app.post(
    "/api/user/mark-workbench-session",
    requireAuth,
    async (req, res) => {
      try {
        const userId = req.session.userId!;
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        const today = new Date().toISOString().split("T")[0];

        if (user.lastWorkbenchSessionDate === today) {
          return res.json({
            workbenchDays: user.workbenchDays,
            alreadyMarked: true,
          });
        }

        const newCount = (user.workbenchDays || 0) + 1;
        await storage.updateWorkbenchSession(userId, newCount, today);

        res.json({
          workbenchDays: newCount,
          alreadyMarked: false,
        });
      } catch (err) {
        console.error("Error marking workbench session:", err);
        res.status(500).json({ error: "Erro ao marcar sessão" });
      }
    },
  );

  app.get("/api/user/workbench-days", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        workbenchDays: user.workbenchDays || 0,
        lastSessionDate: user.lastWorkbenchSessionDate,
      });
    } catch (err) {
      console.error("Error getting workbench days:", err);
      res.status(500).json({ error: "Erro ao buscar dias" });
    }
  });

  /* =========================
     STATISTICS
  ========================= */
  app.get("/api/statistics", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const kits = await storage.getKitsListByUser(userId);

      const kitsByStatus: Record<string, number> = {};
      const kitsByScale: Record<string, number> = {};
      const kitsByCategory: Record<string, number> = {};
      const brandCounts: Record<string, number> = {};
      const investmentByCategory: Record<string, number> = {};
      const soldByMonth: Record<string, number> = {};
      const forSaleByMonth: Record<string, number> = {};

      let soldKitsCount = 0;
      let totalSoldKitsValue = 0;
      let kitsForSaleCount = 0;
      let totalForSaleValue = 0;

      for (const kit of kits) {
        const status = kit.status || "na_caixa";
        const scale = kit.scale || "Desconhecido";
        const category = kit.type || "Outros";
        const brand = kit.brand || "Desconhecido";
        const paidValue = kit.paidValue || 0;

        kitsByStatus[status] = (kitsByStatus[status] || 0) + 1;
        kitsByScale[scale] = (kitsByScale[scale] || 0) + 1;
        kitsByCategory[category] = (kitsByCategory[category] || 0) + 1;
        brandCounts[brand] = (brandCounts[brand] || 0) + 1;
        investmentByCategory[category] =
          (investmentByCategory[category] || 0) + paidValue;

        if (kit.destino === "vendido" || kit.soldDate) {
          soldKitsCount++;
          totalSoldKitsValue += kit.salePrice || paidValue;
          const monthKey = kit.soldDate
            ? new Date(kit.soldDate).toISOString().slice(0, 7)
            : "unknown";
          soldByMonth[monthKey] =
            (soldByMonth[monthKey] || 0) + (kit.salePrice || paidValue);
        }

        if (kit.isForSale || kit.destino === "a_venda") {
          kitsForSaleCount++;
          const forSalePrice = kit.salePrice || 0;
          totalForSaleValue += forSalePrice;
          const monthKey = kit.createdAt
            ? new Date(kit.createdAt).toISOString().slice(0, 7)
            : "unknown";
          forSaleByMonth[monthKey] =
            (forSaleByMonth[monthKey] || 0) + forSalePrice;
        }
      }

      const allMonths = new Set([
        ...Object.keys(soldByMonth),
        ...Object.keys(forSaleByMonth),
      ]);
      const forSaleVsSoldByMonth = Array.from(allMonths)
        .sort()
        .map((month) => ({
          month,
          forSale: forSaleByMonth[month] || 0,
          sold: soldByMonth[month] || 0,
        }));

      res.json({
        kitsByStatus: Object.entries(kitsByStatus).map(([status, count]) => ({
          status,
          count,
        })),
        kitsByScale: Object.entries(kitsByScale).map(([scale, count]) => ({
          scale,
          count,
        })),
        kitsByCategory: Object.entries(kitsByCategory).map(
          ([category, count]) => ({ category, count }),
        ),
        topBrands: Object.entries(brandCounts)
          .map(([brand, count]) => ({ brand, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        soldKitsCount,
        soldKitsValueByMonth: Object.entries(soldByMonth).map(
          ([month, value]) => ({ month, value }),
        ),
        totalSoldKitsValue,
        investmentByCategory: Object.entries(investmentByCategory).map(
          ([category, investment]) => ({ category, investment }),
        ),
        kitsForSaleCount,
        totalForSaleValue,
        forSaleVsSoldByMonth,
      });
    } catch (err) {
      console.error("Error fetching statistics:", err);
      res.status(500).json({ error: "Erro ao buscar estatísticas" });
    }
  });

  /* =========================
     AI URL EXTRACTION
  ========================= */
  const BLOCKED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "metadata.google.internal",
  ];

  const extractAmazonInfo = (
    url: string,
  ): { asin?: string; titleFromUrl?: string } => {
    const asinMatch = url.match(/\/(?:dp|gp\/product|ASIN)\/([A-Z0-9]{10})/i);
    const asin = asinMatch ? asinMatch[1] : undefined;
    const pathMatch = url.match(/amazon\.[^/]+\/([^/]+)\/(?:dp|gp)/i);
    let titleFromUrl = pathMatch
      ? decodeURIComponent(pathMatch[1].replace(/-/g, " "))
      : undefined;
    return { asin, titleFromUrl };
  };

  const isAmazonUrl = (hostname: string): boolean => {
    return hostname.includes("amazon.") || hostname.includes("amzn.");
  };

  app.post("/api/ai/extract-from-url", requireAuth, async (req, res) => {
    console.log("[extract-from-url] Request received");
    const { url, formType } = req.body;
    console.log("[extract-from-url] URL:", url, "formType:", formType);

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL obrigatoria" });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return res.status(400).json({ error: "URL deve ser http ou https" });
      }
      const hostname = parsedUrl.hostname.toLowerCase();
      if (BLOCKED_HOSTS.includes(hostname)) {
        return res.status(400).json({ error: "URL nao permitida" });
      }
    } catch {
      return res.status(400).json({ error: "URL invalida" });
    }

    try {
      const hostname = parsedUrl.hostname.toLowerCase();
      let contentToAnalyze = "";
      let isBlocked = false;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
            "Accept-Encoding": "gzip, deflate, br",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          redirect: "follow",
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const html = await response.text();
          if (
            html.includes("captcha") ||
            html.includes("robot") ||
            html.includes("blocked") ||
            html.length < 5000
          ) {
            console.log("[extract-from-url] Detected blocked/captcha page");
            isBlocked = true;
          } else {
            contentToAnalyze = html.substring(0, 20000);
          }
        } else {
          isBlocked = true;
        }
      } catch (fetchErr) {
        console.log(
          "[extract-from-url] Fetch failed, using URL-based extraction",
        );
        isBlocked = true;
        clearTimeout(timeoutId);
      }

      if (isBlocked || !contentToAnalyze) {
        if (isAmazonUrl(hostname)) {
          const amazonInfo = extractAmazonInfo(url);
          console.log("[extract-from-url] Amazon fallback:", amazonInfo);
          contentToAnalyze = `URL: ${url}\nASIN: ${amazonInfo.asin || "unknown"}\nProduct from URL: ${amazonInfo.titleFromUrl || "unknown"}`;
        } else {
          contentToAnalyze = `URL: ${url}\nPath: ${parsedUrl.pathname}`;
        }
      }

      console.log(
        "[extract-from-url] Content length:",
        contentToAnalyze.length,
      );

      let prompt = "";
      const isUrlOnly = contentToAnalyze.startsWith("URL:");

      if (formType === "kit") {
        if (isUrlOnly) {
          prompt = `Based on this product URL/info, identify the plastic model kit. Use your knowledge to fill in details. Return JSON with:
- name: full product name (use your knowledge of this ASIN/product)
- brand: manufacturer (Kinetic, Tamiya, Revell, Hasegawa, Eduard, Trumpeter, etc)
- scale: scale like "1/48", "1/72", "1/35"
- type: category (Avião, Tanque, Carro, Navio, Helicóptero, Moto, Figura, Diorama, Sci-Fi, Outro)
- kitNumber: product number/code (often in the ASIN or URL)`;
        } else {
          prompt = `Extract plastic model kit info from this HTML page. Return JSON with these fields (only include fields you find):
- name: full product name
- brand: manufacturer (Tamiya, Revell, Hasegawa, etc)
- scale: scale like "1/72", "1/48", "1/35"
- type: category (Avião, Tanque, Carro, Navio, Helicóptero, Moto, Figura, Diorama, Sci-Fi, Outro)
- kitNumber: product number/code`;
        }
      } else if (formType === "material") {
        prompt = `Extract model paint/material info. Return JSON with: name, brand, paintLine, paintCode, paintColor, paintHexColor (only include found fields)`;
      } else if (formType === "wishlist") {
        if (isUrlOnly) {
          prompt = `Based on this product URL/info, identify the plastic model kit for a wishlist. Return JSON with: name, brand, scale (only include known fields)`;
        } else {
          prompt = `Extract plastic model kit info for a wishlist. Return JSON with: name, brand, scale, currentPrice (number only)`;
        }
      }

      const aiResponse = await getOpenAIClient().chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an expert in plastic model kits (plastimodelismo). Extract or identify product data. Return valid JSON only, no markdown or code blocks. Use your knowledge of model kit manufacturers and products.",
          },
          {
            role: "user",
            content: `${prompt}\n\n${isUrlOnly ? "Info" : "HTML"}:\n${contentToAnalyze}`,
          },
        ],
        max_completion_tokens: 500,
      });

      const content = aiResponse.choices[0]?.message?.content || "{}";
      console.log("[extract-from-url] AI response:", content);

      let data: Record<string, unknown> = {};
      try {
        const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
        data = JSON.parse(cleanContent);
      } catch (parseErr) {
        console.error("[extract-from-url] JSON parse error:", parseErr);
        data = {};
      }

      // Log IA action
      await storage.logIaAction(req.session.userId!, "extract_from_url", {
        formType,
        url,
      });

      res.json(data);
    } catch (err: any) {
      if (err?.code === "OPENAI_NOT_CONFIGURED") {
        return res.status(503).json({
          error: "IA não configurada no servidor",
          notConfigured: true,
        });
      }

      console.error("[AI] Error:", err);
      res.status(500).json({ error: "Erro ao processar IA" });
    }
  });

  app.post("/api/ai/extract-kit-from-photo", requireAuth, async (req, res) => {
    console.log(
      "[extract-kit-from-photo] Request received, image length:",
      req.body?.imageBase64?.length || 0,
    );
    const { imageBase64 } = req.body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      console.log("[extract-kit-from-photo] Missing imageBase64");
      return res.status(400).json({ error: "Imagem obrigatoria" });
    }

    // Check free plan limit (10 uses for photo AI)
    const photoAILimit = 10;
    const user = await storage.getUser(req.session.userId!);
    const isFreeUser = user?.status === "free";
    const hasUnlimitedAccess =
      user?.isAdmin || user?.status === "pago" || user?.status === "tester";

    if (
      isFreeUser &&
      !hasUnlimitedAccess &&
      (user?.photoAIUsageCount || 0) >= photoAILimit
    ) {
      return res.status(403).json({
        error: "Limite do plano gratuito atingido",
        limitReached: true,
        usageCount: user?.photoAIUsageCount || 0,
        limit: photoAILimit,
      });
    }

    try {
      console.log(
        "[extract-kit-from-photo] Processing image, base64 starts with:",
        imageBase64.substring(0, 30),
      );
      let imageUrl: string;
      if (imageBase64.startsWith("data:")) {
        imageUrl = imageBase64;
      } else {
        let mimeType = "image/jpeg";
        if (imageBase64.startsWith("/9j/")) {
          mimeType = "image/jpeg";
        } else if (imageBase64.startsWith("iVBOR")) {
          mimeType = "image/png";
        } else if (imageBase64.startsWith("R0lGOD")) {
          mimeType = "image/gif";
        } else if (imageBase64.startsWith("UklGR")) {
          mimeType = "image/webp";
        }
        imageUrl = `data:${mimeType};base64,${imageBase64}`;
      }

      const aiResponse = await getOpenAIClient().chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are analyzing a plastic model kit box photo. Extract product information and return valid JSON only, no markdown.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the plastic model kit information from this box photo. Return JSON with: kitNumber (product number/code), name (full kit name), brand (manufacturer like Tamiya, Revell, etc), scale (like 1/72, 1/48, etc), type (Avião, Tanque, Carro, Navio, Helicóptero, etc). Only include fields you can clearly identify.",
              },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_completion_tokens: 500,
      });

      const content = aiResponse.choices[0]?.message?.content || "{}";
      console.log("[extract-kit-from-photo] AI response content:", content);
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
      } catch (parseErr) {
        console.error("[extract-kit-from-photo] JSON parse error:", parseErr);
        data = {};
      }

      console.log("[extract-kit-from-photo] Parsed data:", data);

      // Increment usage counter for free users
      if (isFreeUser && !hasUnlimitedAccess) {
        await storage.incrementPhotoAIUsage(req.session.userId!);
      }

      // Log IA action
      await storage.logIaAction(req.session.userId!, "extract_kit_from_photo");

      res.json(data);
    } catch (err: any) {
      if (err?.code === "OPENAI_NOT_CONFIGURED") {
        return res.status(503).json({
          error: "IA não configurada no servidor",
          notConfigured: true,
        });
      }

      console.error("[AI] Error:", err);
      res.status(500).json({ error: "Erro ao processar IA" });
    }
  });

  app.post("/api/ai/scan-box", requireAuth, async (req, res) => {
    console.log("[scan-box] Request received");
    const { photoUrl, image } = req.body;
    const photo = photoUrl || image;

    if (!photo || typeof photo !== "string") {
      return res.status(400).json({ error: "Foto obrigatoria" });
    }

    // Check free plan limit (10 uses for photo AI)
    const photoAILimit = 10;
    const user = await storage.getUser(req.session.userId!);
    const isFreeUser = user?.status === "free";
    const hasUnlimitedAccess =
      user?.isAdmin || user?.status === "pago" || user?.status === "tester";

    if (
      isFreeUser &&
      !hasUnlimitedAccess &&
      (user?.photoAIUsageCount || 0) >= photoAILimit
    ) {
      return res.status(403).json({
        error: "Limite do plano gratuito atingido",
        limitReached: true,
        usageCount: user?.photoAIUsageCount || 0,
        limit: photoAILimit,
      });
    }

    try {
      const base64Data = photo.includes(",") ? photo.split(",")[1] : photo;

      const aiResponse = await getOpenAIClient().chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You analyze plastic model kit box photos. Extract all kit information visible. Return valid JSON only.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this plastic model kit box photo. Identify ALL kits visible. Return JSON: { kits: [{ name, brand, scale, type }], notes: 'any observations' }. Types: Avião, Tanque, Carro, Navio, Helicóptero, Moto, Figura, Diorama, Outro.",
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${base64Data}` },
              },
            ],
          },
        ],
        max_completion_tokens: 1000,
      });

      const content = aiResponse.choices[0]?.message?.content || "{}";
      console.log("[scan-box] AI response:", content);
      let data: {
        kits?: Array<{
          name?: string;
          brand?: string;
          scale?: string;
          type?: string;
        }>;
        notes?: string;
      } = {};
      try {
        data = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
      } catch {
        data = {
          kits: [],
          notes: "Não foi possível identificar kits na imagem",
        };
      }

      let boxImagePath: string | null = null;

      try {
          const imageBuffer = Buffer.from(base64Data, "base64");
          const fileName = `box-scans/${randomUUID()}.jpg`;
          const bucket = objectStorageClient.bucket('uploads');
          const file = bucket.file(fileName);
          await file.save(imageBuffer, {
            contentType: "image/jpeg",
            metadata: { uploadedBy: req.session.userId },
          });
          boxImagePath = `/objects/${fileName}`;
      } catch (uploadErr) {
        console.error("[scan-box] Error uploading box image:", uploadErr);
      }

      const createdKits = [];
      if (data.kits && Array.isArray(data.kits)) {
        for (const kitData of data.kits) {
          try {
            const newKit = await storage.createKit(req.session.userId!, {
              name: kitData.name || "Kit sem nome",
              brand: kitData.brand || "",
              scale: kitData.scale || "1/72",
              type: kitData.type || "Avião",
              status: "na_caixa",
              progress: 0,
              hoursWorked: 0,
              paidValue: 0,
              currentValue: 0,
              rating: 0,
              boxImage: boxImagePath,
            });
            createdKits.push(newKit);
          } catch (err) {
            console.error("[scan-box] Error creating kit:", err);
          }
        }
      }

      // Increment usage counter for free users
      if (isFreeUser && !hasUnlimitedAccess) {
        await storage.incrementPhotoAIUsage(req.session.userId!);
      }

      // Log IA action
      await storage.logIaAction(req.session.userId!, "scan_box");

      res.json({ createdKits, notes: data.notes || "" });
    } catch (err: any) {
      if (err?.code === "OPENAI_NOT_CONFIGURED") {
        return res.status(503).json({
          error: "IA não configurada no servidor",
          notConfigured: true,
        });
      }

      console.error("[AI] Error:", err);
      res.status(500).json({ error: "Erro ao processar IA" });
    }
  });

  app.post("/api/ai/extract-kit-from-box", requireAuth, async (req, res) => {
    const { photoUrl } = req.body;

    if (!photoUrl || typeof photoUrl !== "string") {
      return res.status(400).json({ error: "Foto obrigatoria" });
    }

    // Check free plan limit (10 uses for photo AI)
    const photoAILimit = 10;
    const user = await storage.getUser(req.session.userId!);
    const isFreeUser = user?.status === "free";
    const hasUnlimitedAccess =
      user?.isAdmin || user?.status === "pago" || user?.status === "tester";

    if (
      isFreeUser &&
      !hasUnlimitedAccess &&
      (user?.photoAIUsageCount || 0) >= photoAILimit
    ) {
      return res.status(403).json({
        error: "Limite do plano gratuito atingido",
        limitReached: true,
        usageCount: user?.photoAIUsageCount || 0,
        limit: photoAILimit,
      });
    }

    try {
      const base64Data = photoUrl.includes(",")
        ? photoUrl.split(",")[1]
        : photoUrl;

      const aiResponse = await getOpenAIClient().chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You analyze plastic model kit box photos. Extract all kit information visible. Return valid JSON only.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this plastic model kit box photo. Identify ALL kits visible. Return JSON: { kits: [{ name, brand, scale, type }], notes: 'any observations' }. Types: Avião, Tanque, Carro, Navio, Helicóptero, Moto, Figura, Diorama, Outro.",
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${base64Data}` },
              },
            ],
          },
        ],
        max_completion_tokens: 1000,
      });

      const content = aiResponse.choices[0]?.message?.content || "{}";
      let data: {
        kits?: Array<{
          name?: string;
          brand?: string;
          scale?: string;
          type?: string;
        }>;
        notes?: string;
      } = {};
      try {
        data = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
      } catch {
        data = {
          kits: [],
          notes: "Não foi possível identificar kits na imagem",
        };
      }

      let boxImagePath: string | null = null;

      try {
          const imageBuffer = Buffer.from(base64Data, "base64");
          const fileName = `box-scans/${randomUUID()}.jpg`;
          const bucket = objectStorageClient.bucket('uploads');
          const file = bucket.file(fileName);
          await file.save(imageBuffer, {
            contentType: "image/jpeg",
            metadata: { uploadedBy: req.session.userId },
          });
          boxImagePath = `/objects/${fileName}`;
      } catch (uploadErr) {
        console.error("Error uploading box image:", uploadErr);
      }

      const createdKits = [];
      if (data.kits && Array.isArray(data.kits)) {
        for (const kitData of data.kits) {
          try {
            const newKit = await storage.createKit(req.session.userId!, {
              name: kitData.name || "Kit sem nome",
              brand: kitData.brand || "",
              scale: kitData.scale || "1/72",
              type: kitData.type || "Avião",
              status: "na_caixa",
              progress: 0,
              hoursWorked: 0,
              paidValue: 0,
              currentValue: 0,
              rating: 0,
              boxImage: boxImagePath,
            });
            createdKits.push(newKit);
          } catch (err) {
            console.error("Error creating kit:", err);
          }
        }
      }

      // Increment usage counter for free users
      if (isFreeUser && !hasUnlimitedAccess) {
        await storage.incrementPhotoAIUsage(req.session.userId!);
      }

      // Log IA action
      await storage.logIaAction(req.session.userId!, "extract_kit_from_box");

      res.json({ createdKits, notes: data.notes || "" });
    } catch (err: any) {
      if (err?.code === "OPENAI_NOT_CONFIGURED") {
        return res.status(503).json({
          error: "IA não configurada no servidor",
          notConfigured: true,
        });
      }

      console.error("[AI] Error:", err);
      res.status(500).json({ error: "Erro ao processar IA" });
    }
  });

  app.post(
    "/api/ai/extract-paint-from-photo",
    requireAuth,
    async (req, res) => {
      console.log("[extract-paint-from-photo] Request received");
      const { photoUrl } = req.body;

      if (!photoUrl || typeof photoUrl !== "string") {
        return res.status(400).json({ error: "Foto obrigatoria" });
      }

      // Check free plan limit (10 uses for photo AI)
      const photoAILimit = 10;
      const user = await storage.getUser(req.session.userId!);
      const isFreeUser = user?.status === "free";
      const hasUnlimitedAccess =
        user?.isAdmin || user?.status === "pago" || user?.status === "tester";

      if (
        isFreeUser &&
        !hasUnlimitedAccess &&
        (user?.photoAIUsageCount || 0) >= photoAILimit
      ) {
        return res.status(403).json({
          error: "Limite do plano gratuito atingido",
          limitReached: true,
          usageCount: user?.photoAIUsageCount || 0,
          limit: photoAILimit,
        });
      }

      try {
        const base64Data = photoUrl.includes(",")
          ? photoUrl.split(",")[1]
          : photoUrl;

        const aiResponse = await getOpenAIClient().chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You analyze photos of model paint bottles/jars. Extract all visible paint information from the label. Return valid JSON only.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this model paint bottle/jar photo. Extract all visible information from the label.
                
Return JSON in this exact format:
{
  "paint": {
    "brand": "brand name (e.g., Tamiya, Vallejo, Mr.Color, Humbrol, Revell, AK Interactive, Ammo MIG, Citadel, Model Master)",
    "line": "product line (e.g., Acryl, Air, Model Color, XF, X, H, C, Aqueous Hobby Color)",
    "colorName": "color name in Portuguese or original language",
    "manufacturerCode": "manufacturer code (e.g., XF-1, 70.951, H1, 32102)",
    "hexColor": "approximate hex color code based on the paint color visible",
    "fsCode": "Federal Standard code if visible or known (e.g., FS36375)",
    "ralCode": "RAL code if visible or known",
    "rlmCode": "RLM code if visible or known (for Luftwaffe colors)",
    "paintType": "type: acrilica, esmalte, or laca",
    "paintFinish": "finish: fosco, satin, brilho, or metalico"
  },
  "confidence": 0.0 to 1.0 based on how clearly you could read the label
}

If you cannot identify the paint, return: { "paint": null, "confidence": 0 }`,
                },
                {
                  type: "image_url",
                  image_url: { url: `data:image/jpeg;base64,${base64Data}` },
                },
              ],
            },
          ],
          max_completion_tokens: 500,
        });

        const content = aiResponse.choices[0]?.message?.content || "{}";
        console.log("[extract-paint-from-photo] AI response:", content);

        let data: {
          paint?: Record<string, unknown> | null;
          confidence?: number;
        } = {};
        try {
          data = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
        } catch {
          data = { paint: null, confidence: 0 };
        }

        // Increment usage counter for free users
        if (isFreeUser && !hasUnlimitedAccess) {
          await storage.incrementPhotoAIUsage(req.session.userId!);
        }

        // Log IA action
        await storage.logIaAction(
          req.session.userId!,
          "extract_paint_from_photo",
        );

        res.json(data);
      } catch (err: any) {
        if (err?.code === "OPENAI_NOT_CONFIGURED") {
          return res.status(503).json({
            error: "IA não configurada no servidor",
            notConfigured: true,
          });
        }

        console.error("[AI] Error:", err);
        res.status(500).json({ error: "Erro ao processar IA" });
      }
    },
  );

  app.post("/api/ai/check-duplicate", requireAuth, async (req, res) => {
    console.log("[check-duplicate] Request received");
    const { photoUrl, textQuery, productUrl, language } = req.body;

    if (!photoUrl && !textQuery && !productUrl) {
      return res.status(400).json({ error: "Foto, texto ou URL obrigatório" });
    }

    // Check free plan limit (3 uses)
    const duplicateCheckLimit = 3;
    const user = await storage.getUser(req.session.userId!);
    const isFreeUser = user?.status === "free";
    const hasUnlimitedAccess =
      user?.isAdmin || user?.status === "pago" || user?.status === "tester";

    if (
      isFreeUser &&
      !hasUnlimitedAccess &&
      (user?.duplicateCheckUsageCount || 0) >= duplicateCheckLimit
    ) {
      return res.status(403).json({
        error: "Limite do plano gratuito atingido",
        limitReached: true,
        usageCount: user?.duplicateCheckUsageCount || 0,
        limit: duplicateCheckLimit,
      });
    }

    const languageNames: Record<string, string> = {
      pt: "Portuguese (Brazilian)",
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      ru: "Russian",
      ja: "Japanese",
    };
    const targetLanguage = languageNames[language] || "Portuguese (Brazilian)";

    try {
      const [userKits, userMaterials] = await Promise.all([
        storage.getKitsListByUser(req.session.userId!),
        storage.getMaterials(req.session.userId!),
      ]);

      if (userKits.length === 0 && userMaterials.length === 0) {
        return res.json({
          duplicates: [],
          extractedInfo: null,
          message: "Nenhum item na coleção para comparar",
        });
      }

      const existingKitsSummary = userKits.map((k) => ({
        id: k.id,
        itemType: "kit",
        name: k.name,
        brand: k.brand,
        scale: k.scale,
        type: k.type,
        kitNumber: k.kitNumber,
      }));

      const existingMaterialsSummary = userMaterials.map((m) => ({
        id: m.id,
        itemType: m.type,
        name: m.name,
        brand: m.brand,
        category: m.category,
        paintLine: m.paintLine,
        paintCode: m.paintCode,
        paintColor: m.paintColor,
        paintReference: m.paintReference,
        decalScale: m.decalScale,
        decalForKit: m.decalForKit,
      }));

      const allItemsSummary = [
        ...existingKitsSummary,
        ...existingMaterialsSummary,
      ];

      let aiMessages: any[] = [
        {
          role: "system",
          content: `You are a duplicate purchase detection system for plastic model kits and hobby supplies.
Your task is to identify if a product the user wants to buy already exists in their collection.
YOU MUST RESPOND ENTIRELY IN ${targetLanguage}.

The user's current collection has these items:

KITS (plastic model kits):
${JSON.stringify(existingKitsSummary, null, 2)}

MATERIALS (paints, supplies, tools, decals):
${JSON.stringify(existingMaterialsSummary, null, 2)}

Analyze the input (photo/text/URL) and:
1. First identify the product TYPE: Kit, Tinta (paint), Insumo (supply), Ferramenta (tool), or Decal
2. Extract product information (name, brand, code, scale if applicable)
3. Compare with the user's collection - match against the appropriate category
4. Find potential duplicates (exact matches or very similar items)

For PAINTS (Tintas): Match by brand + code, or brand + color name
For KITS: Match by name, brand, scale, or kit number
For SUPPLIES/TOOLS: Match by name and brand
For DECALS: Match by brand, scale, and target kit

Return valid JSON only in this format:
{
  "extractedInfo": {
    "name": "extracted product name",
    "brand": "brand if identified",
    "scale": "scale if identified (for kits/decals)",
    "kitNumber": "kit number if visible (for kits)",
    "code": "product code if visible (for paints)",
    "type": "product type: Kit, Tinta, Insumo, Ferramenta, or Decal"
  },
  "duplicates": [
    {
      "kitId": "id of matching item from collection",
      "kitName": "name of matching item",
      "itemType": "kit, tintas, insumos, ferramentas, or decais",
      "matchConfidence": 0.0 to 1.0,
      "matchReason": "why this is a duplicate (same name, same code, etc.) - IN ${targetLanguage}"
    }
  ],
  "recommendation": "text explaining if this is likely a duplicate purchase - IN ${targetLanguage}"
}`,
        },
      ];

      if (photoUrl) {
        const base64Data = photoUrl.includes(",")
          ? photoUrl.split(",")[1]
          : photoUrl;
        aiMessages.push({
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this product photo and check if it already exists in my collection. Identify the product and find any duplicates.",
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Data}` },
            },
          ],
        });
      } else if (productUrl) {
        aiMessages.push({
          role: "user",
          content: `Check if this product URL is a duplicate purchase: ${productUrl}
          
Based on the URL structure and any product identifiers visible, compare with my collection.`,
        });
      } else if (textQuery) {
        aiMessages.push({
          role: "user",
          content: `Check if this product is a duplicate purchase: "${textQuery}"
          
Search my collection for matching or similar items.`,
        });
      }

      const aiResponse = await getOpenAIClient().chat.completions.create({
        model: "gpt-4o",
        messages: aiMessages,
        max_completion_tokens: 1000,
      });

      const content = aiResponse.choices[0]?.message?.content || "{}";
      console.log("[check-duplicate] AI response:", content);

      let data: {
        extractedInfo?: Record<string, unknown> | null;
        duplicates?: Array<{
          kitId: string;
          kitName: string;
          matchConfidence: number;
          matchReason: string;
        }>;
        recommendation?: string;
      } = {};

      try {
        data = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
      } catch {
        data = {
          extractedInfo: null,
          duplicates: [],
          recommendation: "Não foi possível analisar o produto",
        };
      }

      // Increment usage counter for free users
      if (isFreeUser && !hasUnlimitedAccess) {
        await storage.incrementDuplicateCheckUsage(req.session.userId!);
      }

      // Log IA action
      await storage.logIaAction(req.session.userId!, "check_duplicate", {
        hasPhoto: !!photoUrl,
        hasText: !!textQuery,
        hasUrl: !!productUrl,
      });

      res.json(data);
    } catch (err: any) {
      if (err?.code === "OPENAI_NOT_CONFIGURED") {
        return res.status(503).json({
          error: "IA não configurada no servidor",
          notConfigured: true,
        });
      }

      console.error("[AI] Error:", err);
      res.status(500).json({ error: "Erro ao processar IA" });
    }
  });

  app.post("/api/ai/copilot", requireAuth, async (req, res) => {
    console.log("[copilot] Request received");
    const userId = req.session.userId!;
    const {
      kitName,
      kitType,
      scale,
      brand,
      status,
      etapa,
      progress,
      hoursWorked,
      paints,
      aftermarkets,
      language,
    } = req.body;

    if (!kitName) {
      return res.status(400).json({ error: "Nome do kit obrigatório" });
    }

    // Check copilot usage limits for free users
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    const isFreeUser = user.status === "free";
    const copilotLimit = 3;

    if (isFreeUser && (user.copilotUsageCount || 0) >= copilotLimit) {
      return res.status(403).json({
        error: "COPILOT_LIMIT_REACHED",
        message: "Limite de consultas do Copiloto atingido",
      });
    }

    const languageNames: Record<string, string> = {
      pt: "Portuguese (Brazilian)",
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      ru: "Russian",
      ja: "Japanese",
    };
    const targetLanguage = languageNames[language] || "Portuguese (Brazilian)";

    try {
      const systemPrompt = `You are an expert plastic model kit building assistant (Copilot).
Your task is to analyze the current state of a kit project and provide helpful guidance.

IMPORTANT: You MUST respond entirely in ${targetLanguage}. All text including checklist items, tips, risks, materials, and time estimates must be in ${targetLanguage}.

Analyze the following kit information and provide:
1. A checklist of next steps for the current build stage
2. Estimated time to complete
3. Potential risks or issues to watch out for
4. Materials or tools that might be needed
5. Helpful tips specific to this kit type

Kit Information:
- Name: ${kitName || "Unknown"}
- Type: ${kitType || "Unknown"}
- Scale: ${scale || "Unknown"}
- Brand: ${brand || "Unknown"}
- Status: ${status || "Unknown"}
- Current Stage (Etapa): ${etapa || "Not specified"}
- Progress: ${progress || 0}%
- Hours Worked: ${hoursWorked || 0}
- Paints Used: ${paints || "None specified"}
- Aftermarket Parts: ${aftermarkets || "None"}

Return your response in valid JSON format only (but all text values MUST be in ${targetLanguage}):
{
  "checklist": [
    { "item": "description of step in ${targetLanguage}", "done": false }
  ],
  "estimatedTime": "X hours/days in ${targetLanguage}",
  "risks": ["risk 1 in ${targetLanguage}", "risk 2 in ${targetLanguage}"],
  "materials": ["material 1 in ${targetLanguage}", "material 2 in ${targetLanguage}"],
  "tips": "general advice in ${targetLanguage}"
}

Consider the kit type and scale when making recommendations. For aircraft, mention seam lines and panel lines. For armor, mention weathering techniques. For ships, mention rigging and small parts.`;

      const aiResponse = await getOpenAIClient().chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: "Analyze this kit and provide next steps guidance.",
          },
        ],
        max_completion_tokens: 1500,
      });

      const content = aiResponse.choices[0]?.message?.content || "{}";
      console.log("[copilot] AI response:", content);

      let data: {
        checklist?: Array<{ item: string; done: boolean }>;
        estimatedTime?: string;
        risks?: string[];
        materials?: string[];
        tips?: string;
      } = {};

      try {
        data = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
      } catch {
        data = {
          checklist: [{ item: "Continue building your kit", done: false }],
          estimatedTime: "Unknown",
          risks: [],
          materials: [],
          tips: "Keep working on your project step by step.",
        };
      }

      // Increment copilot usage count for free users
      if (isFreeUser) {
        await storage.incrementCopilotUsage(userId);
      }

      // Log IA action
      await storage.logIaAction(userId, "copilot", { kitName, kitType, scale });

      // Include usage info in response for free users
      const updatedUser = await storage.getUser(userId);
      const currentUsage = updatedUser?.copilotUsageCount || 0;
      const isLastFreeUse = isFreeUser && currentUsage >= copilotLimit;

      res.json({
        ...data,
        isLastFreeUse,
        usageCount: currentUsage,
        limit: copilotLimit,
      });
    } catch (err: any) {
      if (err?.code === "OPENAI_NOT_CONFIGURED") {
        return res.status(503).json({
          error: "IA não configurada no servidor",
          notConfigured: true,
        });
      }

      console.error("[AI] Error:", err);
      res.status(500).json({ error: "Erro ao processar IA" });
    }
  });

  app.post("/api/ai/analyze-photo", requireAuth, async (req, res) => {
    console.log("[analyze-photo] Request received");
    const { photoUrl, kitName, kitType, scale, etapa, language } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ error: "Foto obrigatória" });
    }

    const languageNames: Record<string, string> = {
      pt: "Portuguese (Brazilian)",
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      ru: "Russian",
      ja: "Japanese",
    };
    const targetLanguage = languageNames[language] || "Portuguese (Brazilian)";

    try {
      const base64Data = photoUrl.includes(",")
        ? photoUrl.split(",")[1]
        : photoUrl;

      const systemPrompt = `You are an expert plastic model kit quality inspector.
Analyze this photo of a model kit build in progress and identify any issues or areas for improvement.

IMPORTANT: You MUST respond entirely in ${targetLanguage}. All text including assessments, issue descriptions, and instructions must be in ${targetLanguage}.

Kit Information:
- Name: ${kitName || "Unknown"}
- Type: ${kitType || "Unknown"}  
- Scale: ${scale || "Unknown"}
- Current Stage: ${etapa || "Unknown"}

Look for:
- Visible seam lines that need filling
- Paint issues (orange peel, runs, dust particles, uneven coverage)
- Assembly problems (gaps, misalignment, glue marks)
- Decal issues (silvering, misalignment, wrinkles)
- Surface preparation problems
- Weathering issues (if applicable)

Return your response in valid JSON format only (but all text values MUST be in ${targetLanguage}):
{
  "overallAssessment": "Brief overall assessment in ${targetLanguage}",
  "issues": [
    {
      "type": "Issue category in ${targetLanguage}",
      "description": "What the issue is in ${targetLanguage}",
      "howToFix": "Step by step instructions in ${targetLanguage}",
      "howToPrevent": "Prevention tips in ${targetLanguage}"
    }
  ]
}

Be constructive and helpful. If the build looks good, still provide tips for further improvement.`;

      const aiResponse = await getOpenAIClient().chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this model kit photo and identify any issues or areas for improvement.",
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${base64Data}` },
              },
            ],
          },
        ],
        max_completion_tokens: 1500,
      });

      const content = aiResponse.choices[0]?.message?.content || "{}";
      console.log("[analyze-photo] AI response:", content);

      let data: {
        overallAssessment?: string;
        issues?: Array<{
          type: string;
          description: string;
          howToFix: string;
          howToPrevent: string;
        }>;
      } = {};

      try {
        data = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
      } catch {
        data = {
          overallAssessment: "Unable to analyze the photo. Please try again.",
          issues: [],
        };
      }

      // Log IA action
      await storage.logIaAction(req.session.userId!, "analyze_photo", {
        kitName,
        kitType,
        scale,
        etapa,
      });

      res.json(data);
    } catch (err: any) {
      if (err?.code === "OPENAI_NOT_CONFIGURED") {
        return res.status(503).json({
          error: "IA não configurada no servidor",
          notConfigured: true,
        });
      }

      console.error("[AI] Error:", err);
      res.status(500).json({ error: "Erro ao processar IA" });
    }
  });

  /* =========================
     ADMIN
  ========================= */
  const requireAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Nao autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || !user.isAdmin) {
      // SECURITY: Log unauthorized admin access attempts
      console.warn(
        `[SECURITY_ALERT] Unauthorized admin access attempt | User: ${req.session.userId} | Path: ${req.path} | Method: ${req.method}`
      );

      // Log para detecção de abuso
      console.info({
        type: "SECURITY_INCIDENT",
        incident: "UNAUTHORIZED_ADMIN_ACCESS",
        userId: req.session.userId,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
      });

      return res.status(403).json({ error: "Acesso negado" });
    }

    // Log successful admin access
    console.info(
      `[AUDIT] Admin access by ${req.session.userId} | ${req.method} ${req.path}`
    );

    next();
  };

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query as {
        startDate?: string;
        endDate?: string;
      };
      const users = await storage.getAllUsers(startDate, endDate);
      res.json(users);
    } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ error: "Erro ao buscar usuarios" });
    }
  });

  app.patch(
    "/api/admin/users/:userId/status",
    requireAdmin,
    async (req, res) => {
      try {
        const { userId } = req.params;
        const { status } = req.body;
        const updated = await storage.updateUserStatus(userId, status);
        if (!updated) {
          return res.status(404).json({ error: "Usuario nao encontrado" });
        }

        if (status === "pago") {
          const hasEvent = await storage.hasUserEvent(userId, "upgrade_pro");
          if (!hasEvent) {
            storage
              .logUserEvent(userId, "upgrade_pro")
              .catch((err) =>
                console.error("[Admin] Failed to log upgrade_pro event:", err),
              );
          }
        }

        res.json(updated);
      } catch (err) {
        console.error("Error updating user status:", err);
        res.status(500).json({ error: "Erro ao atualizar status" });
      }
    },
  );

  app.patch(
    "/api/admin/users/:userId/pause",
    requireAdmin,
    async (req, res) => {
      try {
        const { userId } = req.params;
        const { isPaused } = req.body;
        const updated = await storage.updateUserPaused(userId, isPaused);
        if (!updated) {
          return res.status(404).json({ error: "Usuario nao encontrado" });
        }
        res.json(updated);
      } catch (err) {
        console.error("Error updating user pause:", err);
        res.status(500).json({ error: "Erro ao pausar usuario" });
      }
    },
  );

  app.patch(
    "/api/admin/users/:userId/admin",
    requireAdmin,
    async (req, res) => {
      try {
        const { userId } = req.params;
        const { isAdmin } = req.body;
        const updated = await storage.updateUserAdmin(userId, isAdmin);
        if (!updated) {
          return res.status(404).json({ error: "Usuario nao encontrado" });
        }
        res.json(updated);
      } catch (err) {
        console.error("Error updating user admin:", err);
        res.status(500).json({ error: "Erro ao atualizar admin" });
      }
    },
  );

  app.patch(
    "/api/admin/users/:userId/reset-password",
    requireAdmin,
    async (req, res) => {
      try {
        const { userId } = req.params;
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
          return res
            .status(400)
            .json({ error: "Senha deve ter pelo menos 6 caracteres" });
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        const updated = await storage.resetUserPassword(userId, hashed);
        if (!updated) {
          return res.status(404).json({ error: "Usuario nao encontrado" });
        }
        res.json({ success: true });
      } catch (err) {
        console.error("Error resetting password:", err);
        res.status(500).json({ error: "Erro ao resetar senha" });
      }
    },
  );

  app.delete("/api/admin/users/:userId", requireAdmin, csrfProtection, async (req, res) => {
    try {
      const { userId } = req.params;
      const adminId = req.session.userId;

      // SECURITY: Log critical admin operation
      console.warn(
        `[AUDIT_CRITICAL] User deletion initiated | Admin: ${adminId} | Target user: ${userId}`
      );

      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ error: "Usuario nao encontrado" });
      }

      // SECURITY: Log successful deletion
      console.info({
        type: "AUDIT_CRITICAL",
        action: "USER_DELETION",
        adminId,
        targetUserId: userId,
        timestamp: new Date().toISOString(),
      });

      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting user:", err);
      res.status(500).json({ error: "Erro ao deletar usuario" });
    }
  });

  app.patch(
    "/api/admin/users/:userId/exclude-metrics",
    requireAdmin,
    async (req, res) => {
      try {
        const { userId } = req.params;
        const { excludeFromMetrics } = req.body;
        if (typeof excludeFromMetrics !== "boolean") {
          return res
            .status(400)
            .json({ error: "Campo excludeFromMetrics obrigatorio (boolean)" });
        }
        const updated = await storage.updateUserExcludeFromMetrics(
          userId,
          excludeFromMetrics,
        );
        if (!updated) {
          return res.status(404).json({ error: "Usuario nao encontrado" });
        }
        res.json(updated);
      } catch (err) {
        console.error("Error updating exclude from metrics:", err);
        res
          .status(500)
          .json({ error: "Erro ao atualizar exclusao de metricas" });
      }
    },
  );

  app.get("/api/messages/unread", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const unread = await storage.getUnreadMessages(userId);
      res.json(unread);
    } catch (err) {
      console.error("Error fetching unread messages:", err);
      res.status(500).json({ error: "Error fetching messages" });
    }
  });

  app.post("/api/messages/:messageId/read", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { messageId } = req.params;
      await storage.markMessageAsRead(messageId, userId);
      res.json({ success: true });
    } catch (err) {
      console.error("Error marking message as read:", err);
      res.status(500).json({ error: "Error marking message as read" });
    }
  });

  app.get("/api/admin/messages", requireAdmin, async (_req, res) => {
    try {
      const messages = await storage.getAllMessages();
      res.json(messages);
    } catch (err) {
      console.error("Error fetching messages:", err);
      res.status(500).json({ error: "Erro ao buscar mensagens" });
    }
  });

  app.post("/api/admin/messages", requireAdmin, async (req, res) => {
    try {
      const message = await storage.createMessage(req.body);
      res.status(201).json(message);
    } catch (err) {
      console.error("Error creating message:", err);
      res.status(500).json({ error: "Erro ao criar mensagem" });
    }
  });

  app.patch(
    "/api/admin/messages/:messageId",
    requireAdmin,
    async (req, res) => {
      try {
        const { messageId } = req.params;
        const { title, content } = req.body;
        const updated = await storage.updateMessage(messageId, {
          title,
          content,
        });
        if (!updated) {
          return res.status(404).json({ error: "Mensagem nao encontrada" });
        }
        res.json(updated);
      } catch (err) {
        console.error("Error updating message:", err);
        res.status(500).json({ error: "Erro ao atualizar mensagem" });
      }
    },
  );

  app.delete(
    "/api/admin/messages/:messageId",
    requireAdmin,
    async (req, res) => {
      try {
        const { messageId } = req.params;
        const deleted = await storage.deleteMessage(messageId);
        if (!deleted) {
          return res.status(404).json({ error: "Mensagem nao encontrada" });
        }
        res.json({ success: true });
      } catch (err) {
        console.error("Error deleting message:", err);
        res.status(500).json({ error: "Erro ao deletar mensagem" });
      }
    },
  );

  app.get("/api/admin/metrics", requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      // Parse dates as São Paulo timezone (UTC-3)
      // Input format: YYYY-MM-DD, interpret as São Paulo time
      let parsedStartDate: Date | undefined;
      let parsedEndDate: Date | undefined;

      if (startDate) {
        // Start of day in São Paulo = add 3 hours to get UTC
        parsedStartDate = new Date(`${startDate}T00:00:00-03:00`);
      }
      if (endDate) {
        // End of day in São Paulo = 23:59:59-03:00
        parsedEndDate = new Date(`${endDate}T23:59:59.999-03:00`);
      }

      if (startDate && (!parsedStartDate || isNaN(parsedStartDate.getTime()))) {
        return res
          .status(400)
          .json({ error: "startDate invalido. Use o formato YYYY-MM-DD" });
      }
      if (endDate && (!parsedEndDate || isNaN(parsedEndDate.getTime()))) {
        return res
          .status(400)
          .json({ error: "endDate invalido. Use o formato YYYY-MM-DD" });
      }

      const metrics = await storage.getAdminMetrics(
        parsedStartDate,
        parsedEndDate,
        FREE_ITEM_LIMIT,
      );
      res.json(metrics);
    } catch (err) {
      console.error("Error fetching admin metrics:", err);
      res.status(500).json({ error: "Erro ao buscar metricas" });
    }
  });

  app.get("/api/kpis/funnel", requireAdmin, async (req, res) => {
    try {
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const registrationLanguage = req.query.registrationLanguage as
        | string
        | undefined;
      const country = req.query.country as string | undefined;

      const rawData = await storage.getFunnelData(
        startDate,
        endDate,
        registrationLanguage,
        country,
      );
      const funnelMap = new Map(rawData.map((r) => [r.eventName, r.count]));

      // Merge old (item_created_*) and new (kit_created_*) event names for backwards compatibility
      const eventOrder = [
        "ad_click",
        "sign_up",
        "kit_created_1",
        "kit_created_3",
        "kit_created_5",
        "kit_created_7",
        "kit_created_10",
        "upgrade_pro",
      ];
      const legacyMapping: Record<string, string> = {
        kit_created_1: "item_created_1",
        kit_created_3: "item_created_3",
        kit_created_5: "item_created_5",
        kit_created_10: "item_created_10",
      };

      const funnel = eventOrder.map((eventName) => {
        const newCount = funnelMap.get(eventName) || 0;
        const legacyName = legacyMapping[eventName];
        const legacyCount = legacyName ? funnelMap.get(legacyName) || 0 : 0;
        return {
          eventName,
          count: newCount + legacyCount,
        };
      });

      res.json(funnel);
    } catch (err) {
      console.error("Error fetching funnel data:", err);
      res.status(500).json({ error: "Erro ao buscar dados do funil" });
    }
  });

  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllAdminSettings();
      res.json(settings);
    } catch (err) {
      console.error("Error fetching admin settings:", err);
      res.status(500).json({ error: "Erro ao buscar configuracoes" });
    }
  });

  // Backfill funnel events for existing users
  app.post(
    "/api/admin/backfill-funnel-events",
    requireAdmin,
    async (req, res) => {
      try {
        const results = await storage.backfillFunnelEvents();
        res.json({
          success: true,
          message: "Eventos retroativos criados com sucesso",
          results,
        });
      } catch (err) {
        console.error("Error backfilling funnel events:", err);
        res.status(500).json({ error: "Erro ao criar eventos retroativos" });
      }
    },
  );

  // Track user events (welcome modal, etc.)
  app.post("/api/track-event", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { eventName } = req.body;

      const allowedEvents = [
        "welcome_modal_shown",
        "welcome_modal_cta_clicked",
        "welcome_modal_closed_without_action",
      ];

      if (!eventName || !allowedEvents.includes(eventName)) {
        return res.status(400).json({ error: "Invalid event name" });
      }

      await storage.logUserEvent(userId, eventName);
      res.json({ success: true });
    } catch (err) {
      console.error("Error tracking event:", err);
      res.status(500).json({ error: "Error tracking event" });
    }
  });

  // Get welcome modal stats for admin
  app.get("/api/admin/welcome-modal-stats", requireAdmin, async (req, res) => {
    try {
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const stats = await storage.getWelcomeModalStats(startDate, endDate);
      res.json(stats);
    } catch (err) {
      console.error("Error fetching welcome modal stats:", err);
      res.status(500).json({ error: "Error fetching welcome modal stats" });
    }
  });

  // Get upgrade button clicks for period
  app.get("/api/kpis/upgrade-clicks", requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const count = await storage.getUpgradeClicksInPeriod(
        startDate as string | undefined,
        endDate as string | undefined,
      );
      res.json({ count });
    } catch (err) {
      console.error("Error fetching upgrade clicks:", err);
      res.status(500).json({ error: "Erro ao buscar cliques de upgrade" });
    }
  });

  app.post("/api/admin/settings", requireAdmin, csrfProtection, async (req, res) => {
    try {
      const { settings } = req.body;
      const adminId = req.session.userId;

      if (!settings || typeof settings !== "object") {
        return res
          .status(400)
          .json({ error: "Campo 'settings' obrigatorio e deve ser um objeto" });
      }

      // SECURITY: Log critical configuration changes
      console.warn(
        `[AUDIT_CRITICAL] Admin settings modification | Admin: ${adminId} | Settings: ${Object.keys(settings).join(", ")}`
      );

      for (const [key, value] of Object.entries(settings)) {
        if (typeof value === "string" || typeof value === "number") {
          await storage.setAdminSetting(key, String(value));
        }
      }

      // SECURITY: Log successful change
      console.info({
        type: "AUDIT_CRITICAL",
        action: "ADMIN_SETTINGS_CHANGED",
        adminId,
        changedSettings: Object.keys(settings),
        timestamp: new Date().toISOString(),
      });

      const updatedSettings = await storage.getAllAdminSettings();
      res.json(updatedSettings);
    } catch (err) {
      console.error("Error saving admin settings:", err);
      res.status(500).json({ error: "Erro ao salvar configuracoes" });
    }
  });

  app.post(
    "/api/admin/process-follow-up-emails",
    requireAdmin,
    async (req, res) => {
      try {
        const { email24h, email4d, email10d } =
          await storage.getUsersForFollowUpEmails();

        const results = {
          email24h: { total: email24h.length, sent: 0, errors: 0 },
          email4d: { total: email4d.length, sent: 0, errors: 0 },
          email10d: { total: email10d.length, sent: 0, errors: 0 },
        };

        for (const user of email24h) {
          try {
            const language =
              user.preferredLanguage || user.registrationLanguage || "pt";
            const result = await sendFollowUp24hEmail(user.email, language);
            if (result.success) {
              await storage.markFollowUpEmailSent(user.id, "24h");
              results.email24h.sent++;
            } else {
              results.email24h.errors++;
            }
          } catch (err) {
            console.error(`Error sending 24h email to ${user.email}:`, err);
            results.email24h.errors++;
          }
        }

        for (const user of email4d) {
          try {
            const language =
              user.preferredLanguage || user.registrationLanguage || "pt";
            const result = await sendFollowUp4dEmail(user.email, language);
            if (result.success) {
              await storage.markFollowUpEmailSent(user.id, "4d");
              results.email4d.sent++;
            } else {
              results.email4d.errors++;
            }
          } catch (err) {
            console.error(`Error sending 4d email to ${user.email}:`, err);
            results.email4d.errors++;
          }
        }

        for (const user of email10d) {
          try {
            const language =
              user.preferredLanguage || user.registrationLanguage || "pt";
            const result = await sendFollowUp10dEmail(user.email, language);
            if (result.success) {
              await storage.markFollowUpEmailSent(user.id, "10d");
              results.email10d.sent++;
            } else {
              results.email10d.errors++;
            }
          } catch (err) {
            console.error(`Error sending 10d email to ${user.email}:`, err);
            results.email10d.errors++;
          }
        }

        const email30dInactive = await storage.getUsersFor30dInactivityEmail();
        const results30d = { total: email30dInactive.length, sent: 0, errors: 0 };

        for (const user of email30dInactive) {
          try {
            const language =
              user.preferredLanguage || user.registrationLanguage || "pt";
            const result = await sendFollowUp30dInactiveEmail(user.email, user.name, language);
            if (result.success) {
              await storage.mark30dInactivityEmailSent(user.id);
              results30d.sent++;
            } else {
              results30d.errors++;
            }
          } catch (err) {
            console.error(`Error sending 30d inactive email to ${user.email}:`, err);
            results30d.errors++;
          }
        }

        console.log("[Follow-up Emails] Processing complete:", { ...results, email30dInactive: results30d });
        res.json({ ...results, email30dInactive: results30d });
      } catch (err) {
        console.error("Error processing follow-up emails:", err);
        res
          .status(500)
          .json({ error: "Erro ao processar emails de follow-up" });
      }
    },
  );

  // Endpoint para reenviar e-mails de correção em espanhol (com pedido de desculpas)
  app.post(
    "/api/admin/resend-correction-emails",
    requireAdmin,
    async (req, res) => {
      try {
        const { emails } = req.body;

        if (!emails || !Array.isArray(emails)) {
          return res.status(400).json({
            error:
              "Campo 'emails' obrigatorio (array de objetos com email e emailType)",
          });
        }

        const results: {
          email: string;
          emailType: string;
          success: boolean;
          error?: string;
        }[] = [];

        for (const item of emails) {
          const { email, emailType } = item;

          if (!email || !emailType) {
            results.push({
              email: email || "unknown",
              emailType: emailType || "unknown",
              success: false,
              error: "Missing email or emailType",
            });
            continue;
          }

          try {
            let result;
            if (emailType === "24h") {
              result = await sendCorrectionEmail24h(email);
            } else if (emailType === "4d") {
              result = await sendCorrectionEmail4d(email);
            } else if (emailType === "10d") {
              result = await sendCorrectionEmail10d(email);
            } else {
              results.push({
                email,
                emailType,
                success: false,
                error: "Invalid emailType",
              });
              continue;
            }

            if (result.success) {
              results.push({ email, emailType, success: true });
              console.log(
                `[Correction Email] Successfully sent ${emailType} correction email to ${email}`,
              );
            } else {
              results.push({
                email,
                emailType,
                success: false,
                error: "Send failed",
              });
            }
          } catch (err: any) {
            results.push({
              email,
              emailType,
              success: false,
              error: err.message || "Unknown error",
            });
            console.error(
              `[Correction Email] Error sending ${emailType} correction email to ${email}:`,
              err,
            );
          }
        }

        const successCount = results.filter((r) => r.success).length;
        console.log(
          `[Correction Email] Completed: ${successCount}/${results.length} emails sent successfully`,
        );

        res.json({
          total: results.length,
          success: successCount,
          errors: results.length - successCount,
          details: results,
        });
      } catch (err) {
        console.error("Error sending correction emails:", err);
        res.status(500).json({ error: "Erro ao enviar emails de correção" });
      }
    },
  );

  /* =========================
     FAVORITE LINKS
  ========================= */
  app.get("/api/favorite-links", requireAuth, async (req, res) => {
    try {
      const links = await storage.getFavoriteLinks(req.session.userId!);
      res.json(links);
    } catch (err) {
      console.error("Error fetching favorite links:", err);
      res.status(500).json({ error: "Erro ao buscar links favoritos" });
    }
  });

  app.post("/api/favorite-links", requireAuth, async (req, res) => {
    try {
      const link = await storage.createFavoriteLink(
        req.session.userId!,
        req.body,
      );
      res.status(201).json(link);
    } catch (err) {
      console.error("Error creating favorite link:", err);
      res.status(500).json({ error: "Erro ao criar link favorito" });
    }
  });

  app.patch("/api/favorite-links/:id", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateFavoriteLink(
        req.params.id,
        req.session.userId!,
        req.body,
      );
      if (!updated) {
        return res.status(404).json({ error: "Link nao encontrado" });
      }
      res.json(updated);
    } catch (err) {
      console.error("Error updating favorite link:", err);
      res.status(500).json({ error: "Erro ao atualizar link favorito" });
    }
  });

  app.delete("/api/favorite-links/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteFavoriteLink(
        req.params.id,
        req.session.userId!,
      );
      if (!deleted) {
        return res.status(404).json({ error: "Link nao encontrado" });
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting favorite link:", err);
      res.status(500).json({ error: "Erro ao deletar link favorito" });
    }
  });

  /* =========================
     WISHLIST
  ========================= */
  app.get("/api/wishlist", requireAuth, async (req, res) => {
    try {
      const items = await storage.getWishlistItems(req.session.userId!);
      res.json(items);
    } catch (err) {
      console.error("Error fetching wishlist:", err);
      res.status(500).json({ error: "Erro ao buscar lista de desejos" });
    }
  });

  app.post("/api/wishlist", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;

      const { canAdd, totalItems, limit } = await checkFreeUserLimit(userId);
      if (!canAdd) {
        return res.status(403).json({
          error: "LIMIT_EXCEEDED",
          message: `Limite de ${limit} itens atingido (${totalItems}/${limit}). Faça upgrade para adicionar mais.`,
          totalItems,
          limit,
        });
      }

      const parsed = insertWishlistItemSchema.safeParse(req.body);
      if (!parsed.success) {
        console.error("Wishlist validation error:", parsed.error);
        return res.status(400).json({ error: "Dados inválidos" });
      }
      const item = await storage.createWishlistItem(userId, parsed.data);
      res.status(201).json(item);
    } catch (err) {
      console.error("Error creating wishlist item:", err);
      res.status(500).json({ error: "Erro ao adicionar à lista de desejos" });
    }
  });

  app.patch("/api/wishlist/:id", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateWishlistItem(
        req.params.id,
        req.session.userId!,
        req.body,
      );
      if (!updated) {
        return res.status(404).json({ error: "Item não encontrado" });
      }
      res.json(updated);
    } catch (err) {
      console.error("Error updating wishlist item:", err);
      res.status(500).json({ error: "Erro ao atualizar item" });
    }
  });

  app.delete("/api/wishlist/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteWishlistItem(
        req.params.id,
        req.session.userId!,
      );
      if (!deleted) {
        return res.status(404).json({ error: "Item não encontrado" });
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting wishlist item:", err);
      res.status(500).json({ error: "Erro ao remover item" });
    }
  });

  // Wishlist photo upload
  app.post("/api/wishlist/upload-photo", requireAuth, async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      const userId = req.session.userId!;

      if (!imageBase64) {
        return res.status(400).json({ error: "No image provided" });
      }

      const matches = imageBase64.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ error: "Invalid image format" });
      }

      const extension = matches[1] === "jpeg" ? "jpg" : matches[1];
      const base64Data = matches[2];
      const imageBuffer = Buffer.from(base64Data, "base64");

      // Validate file type and size before upload
      const validation = await validateImageFile(imageBuffer, imageBuffer.length);
      if (!validation.valid) {
        logUploadValidationFailure(userId, `wishlist.${extension}`, validation.error || "Validation failed", imageBuffer.length);
        return res.status(400).json({ error: validation.error || "Arquivo inválido" });
      }

      const fileName = `wishlist/${randomUUID()}.${extension}`;
      const bucket = objectStorageClient.bucket('uploads');
      const file = bucket.file(fileName);
      await file.save(imageBuffer, {
        contentType: `image/${matches[1]}`,
        metadata: { uploadedBy: userId },
      });

      const photoUrl = `/objects/${fileName}`;
      res.json({ url: photoUrl });
    } catch (err) {
      console.error("Error uploading wishlist photo:", err);
      res.status(500).json({ error: "Erro ao fazer upload da foto" });
    }
  });

  /* =========================
     MATERIALS
  ========================= */
  app.get("/api/materials", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const type = req.query.type as string | undefined;
      const materials = await storage.getMaterials(userId, type);
      res.json(materials);
    } catch (err) {
      console.error("Error fetching materials:", err);
      res.status(500).json({ error: "Erro ao buscar materiais" });
    }
  });

  app.post("/api/materials", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;

      const { canAdd, totalItems, limit } = await checkFreeUserLimit(userId);
      if (!canAdd) {
        return res.status(403).json({
          error: "LIMIT_EXCEEDED",
          message: `Limite de ${limit} itens atingido (${totalItems}/${limit}). Faça upgrade para adicionar mais.`,
          totalItems,
          limit,
        });
      }

      const material = await storage.createMaterial(userId, req.body);

      // Track item creation milestones for funnel
      const newTotalItems = await storage.getTotalItemCount(userId);
      const milestones = [1, 3, 5, 7, 10];
      for (const m of milestones) {
        if (newTotalItems >= m) {
          const eventName = `kit_created_${m}`;
          const legacyEventName = `item_created_${m}`;
          const hasNewEvent = await storage.hasUserEvent(userId, eventName);
          const hasLegacyEvent = await storage.hasUserEvent(
            userId,
            legacyEventName,
          );
          if (!hasNewEvent && !hasLegacyEvent) {
            storage
              .logUserEvent(userId, eventName)
              .catch((err) =>
                console.error(
                  `[POST /api/materials] Failed to log ${eventName} event:`,
                  err,
                ),
              );
          }
        }
      }

      // Check if user just reached the limit (now has exactly 10 items)
      if (newTotalItems === FREE_ITEM_LIMIT) {
        const user = await storage.getUser(userId);
        if (user && !user.limitReachedEmailSent) {
          sendLimitReachedEmail(user.email, user.preferredLanguage || "pt")
            .then(() => {
              storage.markLimitReachedEmailSent(userId);
            })
            .catch((err) =>
              console.error(
                "[POST /api/materials] Failed to send limit reached email:",
                err,
              ),
            );
        }
      }

      res.status(201).json(material);
    } catch (err) {
      console.error("Error creating material:", err);
      res.status(500).json({ error: "Erro ao criar material" });
    }
  });

  app.patch("/api/materials/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { id } = req.params;
      const updated = await storage.updateMaterial(id, userId, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Material nao encontrado" });
      }
      res.json(updated);
    } catch (err) {
      console.error("Error updating material:", err);
      res.status(500).json({ error: "Erro ao atualizar material" });
    }
  });

  app.delete("/api/materials/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { id } = req.params;
      const deleted = await storage.deleteMaterial(id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Material nao encontrado" });
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting material:", err);
      res.status(500).json({ error: "Erro ao deletar material" });
    }
  });

  app.post("/api/images/upload-base64", requireAuth, async (req, res) => {
    try {
      const { base64Data, contentType = "image/jpeg", folder = "uploads" } = req.body;
      const userId = req.session.userId!;

      if (!base64Data || typeof base64Data !== "string") {
        return res.status(400).json({ error: "base64Data is required" });
      }

      const raw = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
      const imageBuffer = Buffer.from(raw, "base64");

      // Validate file type and size before upload
      const validation = await validateImageFile(imageBuffer, imageBuffer.length);
      if (!validation.valid) {
        logUploadValidationFailure(userId, "base64-image", validation.error || "Validation failed", imageBuffer.length);
        return res.status(400).json({ error: validation.error || "Arquivo inválido" });
      }

      const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
      const fileName = `${folder}/${randomUUID()}.${ext}`;
      const bucket = objectStorageClient.bucket('uploads');
      const file = bucket.file(fileName);
      await file.save(imageBuffer, {
        contentType,
        metadata: { uploadedBy: userId },
      });

      const objectUrl = `/objects/${fileName}`;
      res.json({ url: objectUrl });
    } catch (err) {
      console.error("Error uploading base64 image:", err);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  app.post("/api/admin/fix-corrupted-kit-fields", requireAdmin, async (_req, res) => {
    try {
      const result = await storage.fixCorruptedKitJsonFields();
      res.json({ success: true, fixedCount: result });
    } catch (err) {
      console.error("[POST /api/admin/fix-corrupted-kit-fields] Error:", err);
      res.status(500).json({ error: "Failed to fix corrupted kit fields" });
    }
  });

  app.post("/api/admin/migrate-images", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin only" });
      }

      const allKits = await storage.getKitsByUser(req.session.userId!);
      let migratedCount = 0;
      let errorCount = 0;
      const details: string[] = [];

      const uploadBase64ToStorage = async (base64Str: string, folder: string): Promise<string | null> => {
        try {
          if (!base64Str || !base64Str.startsWith("data:")) return null;
          const raw = base64Str.includes(",") ? base64Str.split(",")[1] : base64Str;
          const imageBuffer = Buffer.from(raw, "base64");

          let ext = "jpg";
          if (base64Str.startsWith("data:image/png")) ext = "png";
          else if (base64Str.startsWith("data:image/webp")) ext = "webp";
          else if (base64Str.startsWith("data:application/pdf")) ext = "pdf";

          const contentType = ext === "pdf" ? "application/pdf" : `image/${ext}`;
          const fileName = `${folder}/${randomUUID()}.${ext}`;
          const bucket = objectStorageClient.bucket('uploads');
          const file = bucket.file(fileName);
          await file.save(imageBuffer, {
            contentType,
            metadata: { migratedFrom: "database" },
          });

          return `/objects/${fileName}`;
        } catch (err) {
          console.error("Migration upload error:", err);
          return null;
        }
      };

      for (const kit of allKits) {
        let needsUpdate = false;
        const updateData: any = {};

        if (kit.boxImage && kit.boxImage.startsWith("data:")) {
          const newUrl = await uploadBase64ToStorage(kit.boxImage, "box-images");
          if (newUrl) {
            updateData.boxImage = newUrl;
            needsUpdate = true;
            details.push(`Kit ${kit.id}: boxImage migrated`);
          }
        }

        if (Array.isArray(kit.instructionImages)) {
          const newInstructions: string[] = [];
          let changed = false;
          for (const img of kit.instructionImages) {
            if (img && img.startsWith("data:")) {
              const newUrl = await uploadBase64ToStorage(img, "instruction-images");
              if (newUrl) {
                newInstructions.push(newUrl);
                changed = true;
              } else {
                newInstructions.push(img);
              }
            } else {
              newInstructions.push(img);
            }
          }
          if (changed) {
            updateData.instructionImages = newInstructions;
            needsUpdate = true;
            details.push(`Kit ${kit.id}: instructionImages migrated`);
          }
        }

        const migrateFileArray = async (files: any[], folder: string): Promise<{ data: any[]; changed: boolean }> => {
          if (!Array.isArray(files)) return { data: files, changed: false };
          const newFiles: any[] = [];
          let changed = false;
          for (const f of files) {
            if (f && f.url && f.url.startsWith("data:")) {
              const newUrl = await uploadBase64ToStorage(f.url, folder);
              if (newUrl) {
                const isPdf = f.url.startsWith("data:application/pdf");
                newFiles.push({ ...f, url: newUrl, thumbnail: isPdf ? undefined : newUrl });
                changed = true;
              } else {
                newFiles.push(f);
              }
            } else {
              newFiles.push(f);
            }
          }
          return { data: newFiles, changed };
        };

        if (Array.isArray(kit.buildPhotos)) {
          const result = await migrateFileArray(kit.buildPhotos as any[], "build-photos");
          if (result.changed) {
            updateData.buildPhotos = result.data;
            needsUpdate = true;
            details.push(`Kit ${kit.id}: buildPhotos migrated`);
          }
        }

        if (Array.isArray(kit.referencePhotos)) {
          const result = await migrateFileArray(kit.referencePhotos as any[], "reference-photos");
          if (result.changed) {
            updateData.referencePhotos = result.data;
            needsUpdate = true;
            details.push(`Kit ${kit.id}: referencePhotos migrated`);
          }
        }

        if (Array.isArray(kit.referenceDocuments)) {
          const result = await migrateFileArray(kit.referenceDocuments as any[], "reference-docs");
          if (result.changed) {
            updateData.referenceDocuments = result.data;
            needsUpdate = true;
            details.push(`Kit ${kit.id}: referenceDocuments migrated`);
          }
        }

        if (needsUpdate) {
          try {
            await storage.updateKit(kit.id, kit.userId, updateData);
            migratedCount++;
          } catch (err) {
            console.error(`Error updating kit ${kit.id}:`, err);
            errorCount++;
          }
        }
      }

      res.json({ migratedKits: migratedCount, errors: errorCount, details });
    } catch (err) {
      console.error("Migration error:", err);
      res.status(500).json({ error: "Migration failed" });
    }
  });

  app.post("/api/admin/migrate-all-users-images", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin only" });
      }

      const allUsers = await storage.getAllUsers();
      let totalMigrated = 0;
      let totalErrors = 0;

      const uploadBase64ToStorage = async (base64Str: string, folder: string): Promise<string | null> => {
        try {
          if (!base64Str || !base64Str.startsWith("data:")) return null;
          const raw = base64Str.includes(",") ? base64Str.split(",")[1] : base64Str;
          const imageBuffer = Buffer.from(raw, "base64");

          let ext = "jpg";
          if (base64Str.startsWith("data:image/png")) ext = "png";
          else if (base64Str.startsWith("data:image/webp")) ext = "webp";
          else if (base64Str.startsWith("data:application/pdf")) ext = "pdf";

          const contentType = ext === "pdf" ? "application/pdf" : `image/${ext}`;
          const fileName = `${folder}/${randomUUID()}.${ext}`;
          const bucket = objectStorageClient.bucket('uploads');
          const file = bucket.file(fileName);
          await file.save(imageBuffer, {
            contentType,
            metadata: { migratedFrom: "database" },
          });

          return `/objects/${fileName}`;
        } catch (err) {
          console.error("Migration upload error:", err);
          return null;
        }
      };

      for (const u of allUsers) {
        const userKits = await storage.getKitsByUser(u.id);

        for (const kit of userKits) {
          let needsUpdate = false;
          const updateData: any = {};

          if (kit.boxImage && kit.boxImage.startsWith("data:")) {
            const newUrl = await uploadBase64ToStorage(kit.boxImage, "box-images");
            if (newUrl) {
              updateData.boxImage = newUrl;
              needsUpdate = true;
            }
          }

          if (Array.isArray(kit.instructionImages)) {
            const newInstructions: string[] = [];
            let changed = false;
            for (const img of kit.instructionImages) {
              if (img && img.startsWith("data:")) {
                const newUrl = await uploadBase64ToStorage(img, "instruction-images");
                newInstructions.push(newUrl || img);
                if (newUrl) changed = true;
              } else {
                newInstructions.push(img);
              }
            }
            if (changed) {
              updateData.instructionImages = newInstructions;
              needsUpdate = true;
            }
          }

          const migrateArr = async (files: any[], folder: string) => {
            if (!Array.isArray(files)) return { data: files, changed: false };
            const out: any[] = [];
            let changed = false;
            for (const f of files) {
              if (f?.url?.startsWith("data:")) {
                const newUrl = await uploadBase64ToStorage(f.url, folder);
                if (newUrl) {
                  const isPdf = f.url.startsWith("data:application/pdf");
                  out.push({ ...f, url: newUrl, thumbnail: isPdf ? undefined : newUrl });
                  changed = true;
                } else {
                  out.push(f);
                }
              } else {
                out.push(f);
              }
            }
            return { data: out, changed };
          };

          for (const [field, folder] of [
            ["buildPhotos", "build-photos"],
            ["referencePhotos", "reference-photos"],
            ["referenceDocuments", "reference-docs"],
          ] as const) {
            if (Array.isArray((kit as any)[field])) {
              const result = await migrateArr((kit as any)[field], folder);
              if (result.changed) {
                updateData[field] = result.data;
                needsUpdate = true;
              }
            }
          }

          if (needsUpdate) {
            try {
              await storage.updateKit(kit.id, kit.userId, updateData);
              totalMigrated++;
            } catch (err) {
              console.error(`Error migrating kit ${kit.id}:`, err);
              totalErrors++;
            }
          }
        }
      }

      res.json({ totalMigratedKits: totalMigrated, totalErrors });
    } catch (err) {
      console.error("Full migration error:", err);
      res.status(500).json({ error: "Migration failed" });
    }
  });

  /* =========================
     PUBLIC SHARING
  ========================= */
  app.post("/api/user/share-token", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const token = await storage.ensureShareToken(userId);
      res.json({ shareToken: token });
    } catch (err) {
      console.error("Error generating share token:", err);
      res.status(500).json({ error: "Failed to generate share token" });
    }
  });

  app.get("/api/public/:shareToken/profile", async (req, res) => {
    try {
      const user = await storage.getUserByShareToken(req.params.shareToken);
      if (!user) return res.status(404).json({ error: "Not found" });
      res.json({
        name: user.name,
        profilePhoto: user.profilePhoto,
        preferredLanguage: user.preferredLanguage,
        preferredCurrency: user.preferredCurrency,
      });
    } catch (err) {
      console.error("Error fetching public profile:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/public/:shareToken/kits", async (req, res) => {
    try {
      const user = await storage.getUserByShareToken(req.params.shareToken);
      if (!user) return res.status(404).json({ error: "Not found" });
      const rawKits = await storage.getKitsListByUser(user.id);
      const kits = rawKits.map(sanitizeKitArrayFields);
      res.json({ kits });
    } catch (err) {
      console.error("Error fetching public kits:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/public/:shareToken/kits/:kitId", async (req, res) => {
    try {
      const user = await storage.getUserByShareToken(req.params.shareToken);
      if (!user) return res.status(404).json({ error: "Not found" });
      const kit = await storage.getKit(req.params.kitId, user.id);
      if (!kit) return res.status(404).json({ error: "Kit not found" });
      res.json(sanitizeKitArrayFields(kit));
    } catch (err) {
      console.error("Error fetching public kit:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/public/:shareToken/materials", async (req, res) => {
    try {
      const user = await storage.getUserByShareToken(req.params.shareToken);
      if (!user) return res.status(404).json({ error: "Not found" });
      const type = req.query.type as string | undefined;
      const materials = await storage.getMaterials(user.id, type);
      res.json(materials);
    } catch (err) {
      console.error("Error fetching public materials:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/public/:shareToken/statistics", async (req, res) => {
    try {
      const user = await storage.getUserByShareToken(req.params.shareToken);
      if (!user) return res.status(404).json({ error: "Not found" });
      const kits = await storage.getKitsListByUser(user.id);

      const kitsByStatus: Record<string, number> = {};
      const kitsByScale: Record<string, number> = {};
      const kitsByCategory: Record<string, number> = {};
      const brandCounts: Record<string, number> = {};
      const investmentByCategory: Record<string, number> = {};
      const soldByMonth: Record<string, number> = {};
      const forSaleByMonth: Record<string, number> = {};
      let soldKitsCount = 0;
      let totalSoldKitsValue = 0;
      let kitsForSaleCount = 0;
      let totalForSaleValue = 0;

      for (const kit of kits) {
        const status = kit.status || "na_caixa";
        const scale = kit.scale || "Desconhecido";
        const category = kit.type || "Outros";
        const brand = kit.brand || "Desconhecido";
        const paidValue = kit.paidValue || 0;

        kitsByStatus[status] = (kitsByStatus[status] || 0) + 1;
        kitsByScale[scale] = (kitsByScale[scale] || 0) + 1;
        kitsByCategory[category] = (kitsByCategory[category] || 0) + 1;
        brandCounts[brand] = (brandCounts[brand] || 0) + 1;
        investmentByCategory[category] = (investmentByCategory[category] || 0) + paidValue;

        if (kit.destino === "vendido" || kit.soldDate) {
          soldKitsCount++;
          totalSoldKitsValue += kit.salePrice || paidValue;
          const monthKey = kit.soldDate ? new Date(kit.soldDate).toISOString().slice(0, 7) : "unknown";
          soldByMonth[monthKey] = (soldByMonth[monthKey] || 0) + (kit.salePrice || paidValue);
        }
        if (kit.isForSale || kit.destino === "a_venda") {
          kitsForSaleCount++;
          const forSalePrice = kit.salePrice || 0;
          totalForSaleValue += forSalePrice;
          const monthKey = kit.createdAt ? new Date(kit.createdAt).toISOString().slice(0, 7) : "unknown";
          forSaleByMonth[monthKey] = (forSaleByMonth[monthKey] || 0) + forSalePrice;
        }
      }

      const allMonths = new Set([...Object.keys(soldByMonth), ...Object.keys(forSaleByMonth)]);
      const forSaleVsSoldByMonth = Array.from(allMonths).sort().map((month) => ({
        month,
        forSale: forSaleByMonth[month] || 0,
        sold: soldByMonth[month] || 0,
      }));

      res.json({
        totalKits: kits.length,
        totalHours: kits.reduce((sum, k) => sum + (k.hoursWorked || 0), 0),
        totalInvested: kits.reduce((sum, k) => sum + (k.paidValue || 0), 0),
        kitsByStatus: Object.entries(kitsByStatus).map(([status, count]) => ({ status, count })),
        kitsByScale: Object.entries(kitsByScale).map(([scale, count]) => ({ scale, count })),
        kitsByCategory: Object.entries(kitsByCategory).map(([category, count]) => ({ category, count })),
        topBrands: Object.entries(brandCounts).map(([brand, count]) => ({ brand, count })).sort((a, b) => b.count - a.count).slice(0, 10),
        soldKitsCount,
        soldKitsValueByMonth: Object.entries(soldByMonth).map(([month, value]) => ({ month, value })),
        totalSoldKitsValue,
        investmentByCategory: Object.entries(investmentByCategory).map(([category, investment]) => ({ category, investment })),
        kitsForSaleCount,
        totalForSaleValue,
        forSaleVsSoldByMonth,
      });
    } catch (err) {
      console.error("Error fetching public statistics:", err);
      res.status(500).json({ error: "Server error" });
    }
  });
}
