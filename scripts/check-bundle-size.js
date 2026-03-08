#!/usr/bin/env node

/**
 * Checks Next.js client bundle sizes after build.
 * Scans .next/static/chunks/ for JS/CSS files and reports sizes.
 *
 * Usage: node scripts/check-bundle-size.js [--max-chunk 250] [--max-total 1500]
 *
 * --max-chunk: max size (KB) for any single chunk (default: 250)
 * --max-total: max total client JS size (KB) (default: 1500)
 *
 * Exits with code 1 if limits are exceeded.
 */

const fs = require('fs');
const path = require('path');

function getArg(name, fallback) {
  const idx = process.argv.indexOf(name);
  return idx !== -1 ? parseInt(process.argv[idx + 1]) : fallback;
}

const MAX_CHUNK_KB = getArg('--max-chunk', 250);
const MAX_TOTAL_KB = getArg('--max-total', 1500);
const STATIC_DIR = path.join(__dirname, '..', '.next', 'static');

function walkDir(dir, ext) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, ext));
    } else if (entry.name.endsWith(ext)) {
      results.push({ name: entry.name, path: fullPath, size: fs.statSync(fullPath).size });
    }
  }
  return results;
}

function formatKB(bytes) {
  return (bytes / 1024).toFixed(1);
}

function main() {
  if (!fs.existsSync(STATIC_DIR)) {
    console.error('No build found. Run `npm run build` first.');
    process.exit(1);
  }

  const jsFiles = walkDir(STATIC_DIR, '.js').sort((a, b) => b.size - a.size);
  const cssFiles = walkDir(STATIC_DIR, '.css').sort((a, b) => b.size - a.size);

  const totalJS = jsFiles.reduce((sum, f) => sum + f.size, 0);
  const totalCSS = cssFiles.reduce((sum, f) => sum + f.size, 0);

  let hasFailure = false;

  console.log(`\nBundle Size Report\n`);
  console.log(`Limits: ${MAX_CHUNK_KB} KB per chunk, ${MAX_TOTAL_KB} KB total JS\n`);

  // Show top 10 largest JS chunks
  console.log('Top JS chunks:');
  console.log('  ' + 'File'.padEnd(50) + 'Size'.padStart(10) + '  Status');
  console.log('  ' + '-'.repeat(68));

  for (const f of jsFiles.slice(0, 10)) {
    const kb = f.size / 1024;
    const over = kb > MAX_CHUNK_KB;
    if (over) hasFailure = true;
    const marker = over ? '!' : ' ';
    console.log(`  ${marker} ${f.name.padEnd(48)} ${formatKB(f.size).padStart(10)} KB  ${over ? 'OVER' : 'ok'}`);
  }

  if (jsFiles.length > 10) {
    console.log(`  ... and ${jsFiles.length - 10} more chunks`);
  }

  // CSS summary
  if (cssFiles.length > 0) {
    console.log(`\nTop CSS files:`);
    for (const f of cssFiles.slice(0, 5)) {
      console.log(`   ${f.name.padEnd(48)} ${formatKB(f.size).padStart(10)} KB`);
    }
  }

  // Totals
  const totalOver = totalJS / 1024 > MAX_TOTAL_KB;
  if (totalOver) hasFailure = true;

  console.log(`\nTotals:`);
  console.log(`  JS:  ${formatKB(totalJS)} KB (${jsFiles.length} files) ${totalOver ? '  OVER LIMIT' : ''}`);
  console.log(`  CSS: ${formatKB(totalCSS)} KB (${cssFiles.length} files)`);
  console.log();

  if (hasFailure) {
    console.error('Bundle size limits exceeded. Consider code splitting or lazy loading.');
    process.exit(1);
  }

  console.log('All bundles within budget.');
}

main();
