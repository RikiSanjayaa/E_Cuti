const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';
const venvPython = isWindows
  ? path.join(__dirname, 'venv', 'Scripts', 'python.exe')
  : path.join(__dirname, 'venv', 'bin', 'python');

const scriptName = process.argv[2];
const subCommand = process.argv[3];

if (!scriptName) {
  console.error('Usage: node run_script.js <script> [subcommand]');
  console.error('');
  console.error('Available scripts:');
  console.error('  manage init   - Initialize database (first-time setup)');
  console.error('  manage fresh  - Drop all and start fresh (dev reset)');
  console.error('  manage seed   - Add dummy data for testing');
  console.error('  manage reset  - Clear operational data');
  console.error('  manage check  - Show database status');
  process.exit(1);
}

// Build the command arguments
let args;
if (subCommand) {
  // For CLI scripts with subcommands (e.g., manage.py init)
  args = ['-m', `backend.scripts.${scriptName}`, subCommand];
} else {
  // For standalone scripts (legacy support)
  args = ['-m', `backend.scripts.${scriptName}`];
}

console.log(`Running: python -m backend.scripts.${scriptName}${subCommand ? ' ' + subCommand : ''}`);
console.log('');

const child = spawn(venvPython, args, { stdio: 'inherit', cwd: __dirname });

child.on('error', (err) => {
  console.error(`Failed to start script:`, err);
  console.error('Make sure the virtual environment exists in ./venv');
});

child.on('close', (code) => {
  if (code !== 0) {
    console.error(`\nScript exited with code ${code}`);
  }
  process.exit(code);
});
