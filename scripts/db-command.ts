import { spawn } from 'child_process';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const command = process.argv[2];
const isProd = process.argv.includes('--prod');

process.env.DATABASE_URL = isProd
  ? process.env.TURSO_DATABASE_URL
  : process.env.LOCAL_DATABASE_URL;

console.log('Using', isProd ? 'Production' : 'Dev', 'Environment');

const drizzleBinPath = path.resolve(
  process.cwd(),
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'drizzle-kit.cmd' : 'drizzle-kit',
);

const drizzleProcess = spawn(drizzleBinPath, [command], {
  stdio: 'inherit',
  env: process.env,
});

drizzleProcess.on('error', (err) => {
  console.error('Failed to start drizzle-kit:', err);
  process.exit(1);
});

drizzleProcess.on('exit', (code) => {
  process.exit(code ?? 0);
});
