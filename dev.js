const { spawn } = require('child_process');

function run(command, args, cwd) {
  const proc = spawn(command, args, { cwd, stdio: 'inherit', shell: true });
  proc.on('close', code => {
    if (code !== 0) {
      console.error(`${command} ${args.join(' ')} exited with code ${code}`);
    }
  });
  return proc;
}

const backend = run('npm', ['start'], 'backend');
const frontend = run('npm', ['start'], 'frontend');

function shutdown() {
  backend.kill();
  frontend.kill();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);