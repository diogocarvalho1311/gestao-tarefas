/** Deployment must refuse a mismatched saved identity before exposing a token. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

test('administração reutiliza o perfil correto e recusa outra identidade ou sessão expirada', async () => {
  const root = mkdtempSync(join(tmpdir(), 'dcarvalho-profile-'));
  try {
    for (const dir of ['scripts', 'cloudflare', 'node_modules/cf/bin']) mkdirSync(join(root, dir), { recursive: true });
    copyFileSync(resolve('scripts/cloudflare-auth.mjs'), join(root, 'scripts/cloudflare-auth.mjs'));
    const account = { account_id: 'personal-account', profile: 'pessoal', email: 'personal@example.test' };
    writeFileSync(join(root, 'cloudflare/account.json'), JSON.stringify(account));
    const tokenFile = join(root, 'credential.json');
    writeFileSync(tokenFile, JSON.stringify({ oauth_token: 'test-credential', expiration_time: new Date(Date.now() + 60000).toISOString() }));
    // The fake CLI checks the explicit profile and reports a local fixture credential.
    writeFileSync(join(root, 'node_modules/cf/bin/cf'), `
      const fs = require('node:fs');
      if (process.argv.slice(2).join(' ') !== 'auth whoami --profile pessoal --json') process.exit(2);
      console.log(fs.readFileSync(${JSON.stringify(join(root, 'identity.json'))}, 'utf8'));
    `);
    const identity = { authenticated: true, tokenValid: true, email: account.email,
      accounts: [{ id: account.account_id }], authSource: 'OAuth token from ' + tokenFile };
    const save = (value: unknown) => writeFileSync(join(root, 'identity.json'), JSON.stringify(value));
    const { cloudflareCredentials } = await import(pathToFileURL(join(root, 'scripts/cloudflare-auth.mjs')).href);
    save(identity);
    assert.deepEqual(await cloudflareCredentials(), { CLOUDFLARE_API_TOKEN: 'test-credential', CLOUDFLARE_ACCOUNT_ID: account.account_id });
    save({ ...identity, email: 'other@example.test' });
    await assert.rejects(cloudflareCredentials(), /conta esperada/);
    save({ ...identity, accounts: [{ id: 'another-account' }] });
    await assert.rejects(cloudflareCredentials(), /conta esperada/);
    save({ ...identity, authenticated: false });
    await assert.rejects(cloudflareCredentials(), /conta esperada/);
    save(identity);
    writeFileSync(tokenFile, JSON.stringify({ oauth_token: 'expired', expiration_time: '2020-01-01' }));
    await assert.rejects(cloudflareCredentials(), /renovada/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
