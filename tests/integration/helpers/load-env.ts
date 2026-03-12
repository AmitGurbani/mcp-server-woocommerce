import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const envFile = resolve(import.meta.dirname, '../../../.integration-env');
if (existsSync(envFile)) {
  const lines = readFileSync(envFile, 'utf-8').split('\n');
  for (const line of lines) {
    const [key, ...rest] = line.split('=');
    if (key?.trim() && rest.length) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  }
}
