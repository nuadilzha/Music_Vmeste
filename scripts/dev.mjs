import { spawn, spawnSync } from 'node:child_process';
const children = [
  spawn(process.execPath, ['--watch', 'server/index.mjs'], { stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio: 'inherit' }),
];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach((c) => {
    if (process.platform === 'win32' && c.pid && c.exitCode === null) {
      spawnSync('taskkill', ['/PID', String(c.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
    } else c.kill();
  });
  process.exitCode = code;
}
children.forEach((c) => c.on('exit', (code) => stop(code ?? 0)));
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
