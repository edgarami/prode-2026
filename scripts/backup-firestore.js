#!/usr/bin/env node
/**
 * backup-firestore.js — Descarga todas las colecciones de Firestore a JSON.
 *
 * Genera: backups/backup-YYYY-MM-DD-HHmm/<coleccion>.json
 *
 * Variables (o .env.local):
 *   FIREBASE_PROJECT_ID, FIREBASE_API_KEY, ADMIN_EMAIL, ADMIN_PASSWORD
 *
 * Ejecutar: node scripts/backup-firestore.js
 */
'use strict';

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// Cargar .env.local si existe
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const idx = line.indexOf('=');
    if (idx > 0) {
      const k = line.substring(0, idx).trim();
      const v = line.substring(idx + 1).trim();
      if (k && v && !process.env[k]) process.env[k] = v;
    }
  });
}

const FB_PROJECT  = process.env.FIREBASE_PROJECT_ID;
const FB_API_KEY  = process.env.FIREBASE_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASS  = process.env.ADMIN_PASSWORD;

if (!FB_PROJECT || !FB_API_KEY || !ADMIN_EMAIL || !ADMIN_PASS) {
  console.error('❌ Faltan variables: FIREBASE_PROJECT_ID, FIREBASE_API_KEY, ADMIN_EMAIL, ADMIN_PASSWORD');
  process.exit(1);
}

const COLLECTIONS = ['users', 'predictions', 'leagues', 'matches', 'standings'];

// ── HTTP ───────────────────────────────────────────────────────────────────────
function httpJson(method, url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data   = body ? JSON.stringify(body) : '';
    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      path:     urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...headers,
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}: ${d.substring(0, 300)}`));
        try { resolve(d ? JSON.parse(d) : {}); } catch { resolve({}); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── Conversión Firestore → JS ──────────────────────────────────────────────────
function fromValue(v) {
  if (!v) return null;
  if ('stringValue'  in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue'  in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue'    in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('mapValue'     in v) return Object.fromEntries(Object.entries(v.mapValue.fields ?? {}).map(([k, x]) => [k, fromValue(x)]));
  if ('arrayValue'   in v) return (v.arrayValue.values ?? []).map(fromValue);
  return null;
}

function fromDoc(doc) {
  const r = { _id: doc.name.split('/').pop() };
  for (const [k, v] of Object.entries(doc.fields ?? {})) r[k] = fromValue(v);
  return r;
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`💾 Backup Firestore — ${new Date().toISOString()}`);
  console.log(`   Proyecto: ${FB_PROJECT}`);

  // Autenticar
  const auth = await httpJson('POST',
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FB_API_KEY}`,
    { email: ADMIN_EMAIL, password: ADMIN_PASS, returnSecureToken: true });
  if (!auth.idToken) throw new Error('No se pudo autenticar');
  console.log('   ✅ Autenticado');

  // Carpeta destino
  const stamp = new Date().toISOString().replace(/T/, '-').replace(/:/g, '').substring(0, 15);
  const dir   = path.join(__dirname, '..', 'backups', `backup-${stamp}`);
  fs.mkdirSync(dir, { recursive: true });

  const FS_BASE = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents`;
  let totalDocs = 0;

  for (const col of COLLECTIONS) {
    // runQuery trae todos los documentos sin límite de pageSize
    const rows = await httpJson('POST', `${FS_BASE}:runQuery`,
      { structuredQuery: { from: [{ collectionId: col }] } },
      { 'Authorization': `Bearer ${auth.idToken}` });

    const docs = (Array.isArray(rows) ? rows : [])
      .filter(r => r.document)
      .map(r => fromDoc(r.document));

    fs.writeFileSync(path.join(dir, `${col}.json`), JSON.stringify(docs, null, 2), 'utf8');
    console.log(`   📄 ${col}: ${docs.length} documentos`);
    totalDocs += docs.length;
  }

  console.log(`\n✅ Backup completo: ${totalDocs} documentos en ${dir}`);
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
