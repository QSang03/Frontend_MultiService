#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

function run(command, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: 'inherit', shell: true, ...opts });
    proc.on('close', (code) => {
      if (code === 0) resolve(); else reject(new Error(`${command} exited ${code}`));
    });
  });
}

async function syncOnce() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const protoOut = path.resolve(__dirname, '..', 'proto');
  if (!fs.existsSync(protoOut)) fs.mkdirSync(protoOut, { recursive: true });

  console.log('Exporting protos from remote server via buf...');
  // Uses npx buf export <address> --output ./proto
  // Example address: http://localhost:50051
  const addr = process.argv[2] || process.env.BUF_SERVER || 'http://192.168.117.18:50051';

  try {
    // Try several buf invocation methods (npx buf, npx @bufbuild/buf, or system buf)
    const bufCommands = [
      { cmd: 'npx', args: ['buf', 'export', addr, '--output', protoOut] },
      { cmd: 'npx', args: ['@bufbuild/buf', 'export', addr, '--output', protoOut] },
      { cmd: 'buf', args: ['export', addr, '--output', protoOut] },
    ];

    let succeeded = false;
    for (const c of bufCommands) {
      try {
        await run(c.cmd, c.args);
        succeeded = true;
        break;
      } catch (err) {
        console.warn('Attempt failed:', c.cmd, c.args.join(' '), err?.message || err);
      }
    }
    if (!succeeded) throw new Error('Failed to run buf. Please install the buf CLI: https://docs.buf.build/installation');
    console.log('Proto export complete. Running proto generation...');
    await run('npm', ['run', 'proto:generate']);
    console.log('Proto sync finished successfully.');
  } catch (err) {
    console.error('Proto sync failed:', err.message || err);
    process.exitCode = 1;
  }
}

async function watch(intervalMs = 5000) {
  console.log('Starting proto sync watch (poll every', intervalMs, 'ms)');
  await syncOnce();
  setInterval(async () => {
    try {
      await syncOnce();
    } catch (err) {
      console.error('Watch sync error:', err?.message || err);
    }
  }, intervalMs);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const watchFlag = process.argv.includes('--watch');
  const intervalArgIndex = process.argv.indexOf('--interval');
  const interval = intervalArgIndex > -1 ? Number(process.argv[intervalArgIndex + 1]) : undefined;
  if (watchFlag) watch(interval || 5000).catch((err) => { console.error(err); process.exit(1); });
  else syncOnce();
}

export { syncOnce };
