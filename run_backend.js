const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';
const venvPython = isWindows
  ? path.join(__dirname, 'venv', 'Scripts', 'python.exe')
  : path.join(__dirname, 'venv', 'bin', 'python');

const mode = process.argv[2] || 'dev';

let args = ['-m', 'uvicorn', 'backend.main:app', '--port', '8000'];

if (mode === 'prod') {
  args.push('--host', '0.0.0.0');
} else {
  args.push('--reload');
}

console.log(`Starting backend in ${mode} mode using python at: ${venvPython}`);

const child = spawn(venvPython, args, { stdio: 'inherit' });

child.on('error', (err) => {
  console.error('Failed to start backend:', err);
  console.error('Please ensure the virtual environment is set up in ./venv');
});

child.on('close', (code) => {
  process.exit(code);
});
