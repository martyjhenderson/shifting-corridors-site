#!/usr/bin/env node

/**
 * Mint the personal submission links.
 *
 * Each Game Master gets a URL carrying a token that names them and expires. The
 * token is signed with INVITE_SECRET, the same secret the Worker verifies with,
 * so it can be sent over Discord or email without being forgeable.
 *
 * Usage:
 *   INVITE_SECRET=... node scripts/make-invite-link.js            # everyone
 *   INVITE_SECRET=... node scripts/make-invite-link.js eli-f      # just one
 *   INVITE_SECRET=... node scripts/make-invite-link.js --days 90  # shorter life
 *
 * The Game Master slugs come from src/content/gamemasters/, so a link can only
 * be issued to someone the site already lists.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SITE = process.env.SITE_URL || 'https://shiftingcorridors.com';
const DEFAULT_DAYS = 180;

const secret = process.env.INVITE_SECRET;
if (!secret) {
  console.error('INVITE_SECRET is not set.');
  console.error('It is the value you gave to `wrangler secret put INVITE_SECRET`.');
  process.exit(1);
}

const args = process.argv.slice(2);
let days = DEFAULT_DAYS;
const daysAt = args.indexOf('--days');
if (daysAt !== -1) {
  days = Number(args[daysAt + 1]);
  if (!Number.isFinite(days) || days <= 0) {
    console.error('--days needs a positive number');
    process.exit(1);
  }
  args.splice(daysAt, 2);
}

const gmDir = path.join(__dirname, '../src/content/gamemasters');
const known = fs
  .readdirSync(gmDir)
  .filter(f => f.endsWith('.md'))
  .map(f => f.replace(/\.md$/, ''));

const wanted = args.length ? args : known;

const unknown = wanted.filter(gm => !known.includes(gm));
if (unknown.length) {
  console.error(`No such Game Master: ${unknown.join(', ')}`);
  console.error(`Known: ${known.join(', ')}`);
  process.exit(1);
}

const base64url = buffer =>
  buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const exp = Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;

console.log(`Links valid until ${new Date(exp * 1000).toISOString().slice(0, 10)}.\n`);

for (const gm of wanted) {
  const body = base64url(Buffer.from(JSON.stringify({ gm, exp })));
  const signature = base64url(crypto.createHmac('sha256', secret).update(body).digest());

  // The token sits in the fragment, so it is never sent to the server that
  // hosts the page and never lands in an S3 or CloudFront access log.
  console.log(`${gm}:`);
  console.log(`  ${SITE}/submit-event#t=${body}.${signature}\n`);
}

console.log('To revoke one before it expires:');
console.log('  cd worker && npx wrangler kv key put --binding REVOKED "revoked:<gm>" "left the lodge"');
