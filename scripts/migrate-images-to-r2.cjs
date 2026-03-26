#!/usr/bin/env node
/**
 * Migrates all uploaded images from Replit to Cloudflare R2.
 *
 * Usage:
 *   node scripts/migrate-images-to-r2.cjs
 *
 * Required env vars (set in .env or shell):
 *   DATABASE_URL         - Railway PostgreSQL URL
 *   R2_ACCOUNT_ID        - Cloudflare account ID
 *   R2_ACCESS_KEY_ID     - R2 access key
 *   R2_SECRET_ACCESS_KEY - R2 secret key
 *   R2_BUCKET_NAME       - R2 bucket name (e.g. "modelhero")
 *   REPLIT_APP_URL       - Base URL of Replit app (e.g. https://ModelHero.marceloribeir34.repl.co)
 */

const { Pool } = require('pg');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

const DATABASE_URL = process.env.DATABASE_URL;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const REPLIT_APP_URL = process.env.REPLIT_APP_URL; // e.g. https://ModelHero.marceloribeir34.repl.co

for (const [k, v] of Object.entries({ DATABASE_URL, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, REPLIT_APP_URL })) {
  if (!v) { console.error(`Missing env var: ${k}`); process.exit(1); }
}

const db = new Pool({ connectionString: DATABASE_URL });

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

// Collect all /objects/ paths from the DB
async function collectImagePaths() {
  const paths = new Set();

  // kits table
  const { rows: kits } = await db.query(`
    SELECT box_image, instruction_images, reference_photos, build_photos, reference_documents
    FROM kits
  `);
  for (const kit of kits) {
    if (kit.box_image?.startsWith('/objects/')) paths.add(kit.box_image);
    for (const p of (kit.instruction_images || [])) {
      if (p?.startsWith('/objects/')) paths.add(p);
    }
    for (const col of [kit.reference_photos, kit.build_photos, kit.reference_documents]) {
      const arr = Array.isArray(col) ? col : (col ? Object.values(col) : []);
      for (const item of arr) {
        const url = item?.url || item?.src || (typeof item === 'string' ? item : null);
        if (url?.startsWith('/objects/')) paths.add(url);
      }
    }
  }

  // wishlist_items
  const { rows: wishlist } = await db.query(`SELECT photos FROM wishlist_items`);
  for (const w of wishlist) {
    const arr = Array.isArray(w.photos) ? w.photos : (w.photos ? Object.values(w.photos) : []);
    for (const item of arr) {
      const url = item?.url || item?.src || (typeof item === 'string' ? item : null);
      if (url?.startsWith('/objects/')) paths.add(url);
    }
  }

  // users profile photos
  const { rows: users } = await db.query(`SELECT profile_photo FROM users WHERE profile_photo IS NOT NULL`);
  for (const u of users) {
    if (u.profile_photo?.startsWith('/objects/')) paths.add(u.profile_photo);
  }

  return [...paths];
}

async function existsInR2(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function downloadAndUpload(objectPath) {
  const key = objectPath.replace(/^\/objects\//, '');
  const sourceUrl = `${REPLIT_APP_URL}${objectPath}`;

  // Skip if already in R2
  if (await existsInR2(key)) {
    return 'skipped';
  }

  const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${sourceUrl}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || 'application/octet-stream';

  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  return 'uploaded';
}

async function main() {
  console.log('Collecting image paths from database...');
  const paths = await collectImagePaths();
  console.log(`Found ${paths.length} unique image paths\n`);

  let uploaded = 0, skipped = 0, errors = 0;

  for (let i = 0; i < paths.length; i++) {
    const p = paths[i];
    try {
      const result = await downloadAndUpload(p);
      if (result === 'uploaded') { uploaded++; process.stdout.write(`  [${i+1}/${paths.length}] ✅ ${p}\n`); }
      else { skipped++; process.stdout.write(`  [${i+1}/${paths.length}] ⏭  ${p} (already in R2)\n`); }
    } catch (err) {
      errors++;
      console.log(`  [${i+1}/${paths.length}] ❌ ${p}: ${err.message}`);
    }
  }

  console.log(`\nDone! Uploaded: ${uploaded}, Skipped: ${skipped}, Errors: ${errors}`);
  await db.end();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
