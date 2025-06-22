const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Clean up HOST: completely remove to avoid React/Webpack Dev Server bug
delete process.env.HOST;

function ensureInstalled(dir) {
  const nodeModules = path.join(__dirname, dir, 'node_modules');
  if (!fs.existsSync(nodeModules)) {
    console.log(`Installing dependencies for ${dir}...`);
    spawnSync('npm', ['install'], {
      cwd: path.join(__dirname, dir),
      stdio: 'inherit',
      shell: true,
    });
  }
}

function run(command, args, cwd) {
  const env = { ...process.env };

  // 🚫 Force HOST to be undefined to avoid React/Webpack allowedHosts bug
  delete env.HOST;

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

// ✅ Install packages if node_modules folders are missing
// Include the project root so server dependencies are available
ensureInstalled('.');
ensureInstalled('frontend');
ensureInstalled('backend');

const backend = run('npm', ['start'], 'backend');
const frontend = run('npm', ['start'], 'frontend');

function shutdown() {
  backend.kill();
  frontend.kill();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
