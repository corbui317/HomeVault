const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Some environments may accidentally pass a HOST variable to the React
// development server which causes Webpack to misconfigure allowedHosts.
// Reset it to a safe default before starting child processes.
process.env.HOST = 'localhost';

function ensureInstalled(dir) {
  const nodeModules = path.join(__dirname, dir, 'node_modules');
  if (!fs.existsSync(nodeModules)) {
    console.log(`Installing dependencies for ${dir}...`);
    spawnSync('npm', ['install'], { cwd: path.join(__dirname, dir), stdio: 'inherit', shell: true });
  }
}

function run(command, args, cwd) {
  const env = { ...process.env };
  // Ensure the React dev server sees a safe host value
  env.HOST = 'localhost';
  const proc = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env,
  });
  proc.on('close', code => {
    if (code !== 0) {
      console.error(`${command} ${args.join(' ')} exited with code ${code}`);
    }
  });
  return proc;
}

ensureInstalled('backend');
ensureInstalled('frontend');

const backend = run('npm', ['start'], 'backend');
const frontend = run('npm', ['start'], 'frontend');

function shutdown() {
  backend.kill();
  frontend.kill();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);