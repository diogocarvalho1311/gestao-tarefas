/** Bridge the saved cf profile to Wrangler without persisting another credential. */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const execute = promisify(execFile);

/** Refresh and verify the configured identity before returning a process-only token.
 * The CLI owns refresh tokens; this adapter only reads its current plaintext JSON
 * credential at the path reported by whoami. Encrypted profiles fail explicitly.
 */
export async function cloudflareCredentials() {
  const runtime = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const account = JSON.parse(readFileSync(resolve(runtime, 'cloudflare/account.json'), 'utf8'));
  const env = { ...process.env, CLOUDFLARE_ACCOUNT_ID: account.account_id };
  for (const key of ['CLOUDFLARE_API_TOKEN', 'CF_API_TOKEN', 'CLOUDFLARE_API_KEY', 'CLOUDFLARE_EMAIL']) delete env[key];
  const { stdout } = await execute(process.execPath, [resolve(runtime, 'node_modules/cf/bin/cf'),
    'auth', 'whoami', '--profile', account.profile, '--json'], { cwd: runtime, env, maxBuffer: 4 * 1024 * 1024 });
  const identity = JSON.parse(stdout);
  if (!identity.authenticated || identity.tokenValid !== true || identity.email !== account.email ||
      !identity.accounts?.some(item => item.id === account.account_id)) {
    throw new Error(`O perfil ${account.profile} não está autenticado na conta esperada (${account.email}).`);
  }
  const path = identity.authSource?.startsWith('OAuth token from ')
    ? identity.authSource.slice('OAuth token from '.length) : '';
  if (!isAbsolute(path) || !path.endsWith('.json')) {
    throw new Error('O perfil cf não informou um arquivo JSON de credencial compatível. Nenhum login foi alterado.');
  }
  const credential = JSON.parse(readFileSync(path, 'utf8'));
  if (!credential.oauth_token || !(Date.parse(credential.expiration_time) > Date.now())) {
    throw new Error(`A credencial do perfil ${account.profile} não pôde ser renovada pelo cf.`);
  }
  return { CLOUDFLARE_API_TOKEN: credential.oauth_token, CLOUDFLARE_ACCOUNT_ID: account.account_id };
}
