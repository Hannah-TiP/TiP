import { cpSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const builtStaticDir = path.join(projectRoot, '.next', 'static');
const standaloneStaticDir = path.join(projectRoot, '.next', 'standalone', '.next', 'static');

if (!existsSync(builtStaticDir)) {
  throw new Error(`Missing built static assets at ${builtStaticDir}`);
}

mkdirSync(path.dirname(standaloneStaticDir), { recursive: true });
cpSync(builtStaticDir, standaloneStaticDir, { recursive: true, force: true });

await import(path.join(projectRoot, '.next', 'standalone', 'server.js'));
