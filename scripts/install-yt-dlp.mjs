#!/usr/bin/env node

/**
 * yt-dlp Installation Script
 *
 * This script helps install yt-dlp on different operating systems.
 * It detects the platform and provides appropriate installation instructions.
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');

const execAsync = promisify(exec);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkYtDlpInstalled() {
  try {
    const { stdout } = await execAsync('yt-dlp --version');
    return stdout.trim();
  } catch (error) {
    return null;
  }
}

async function checkPythonInstalled() {
  try {
    const { stdout } = await execAsync('python3 --version');
    return stdout.trim();
  } catch (error) {
    try {
      const { stdout } = await execAsync('python --version');
      return stdout.trim();
    } catch (error) {
      return null;
    }
  }
}

async function checkPipInstalled() {
  try {
    const { stdout } = await execAsync('pip3 --version');
    return stdout.trim();
  } catch (error) {
    try {
      const { stdout } = await execAsync('pip --version');
      return stdout.trim();
    } catch (error) {
      return null;
    }
  }
}

function getInstallationInstructions() {
  const platform = os.platform();

  switch (platform) {
    case 'darwin': // macOS
      return {
        title: 'macOS Installation',
        methods: [
          {
            name: 'Homebrew (Recommended)',
            commands: ['brew install yt-dlp'],
            description: 'Install using Homebrew package manager'
          },
          {
            name: 'Python pip',
            commands: ['pip3 install yt-dlp'],
            description: 'Install using Python package manager'
          },
          {
            name: 'Direct Download',
            commands: [
              'curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp',
              'chmod a+rx /usr/local/bin/yt-dlp'
            ],
            description: 'Download binary directly'
          }
        ]
      };

    case 'linux':
      return {
        title: 'Linux Installation',
        methods: [
          {
            name: 'Python pip (Recommended)',
            commands: ['pip3 install yt-dlp'],
            description: 'Install using Python package manager'
          },
          {
            name: 'Package Manager',
            commands: [
              '# Ubuntu/Debian:',
              'sudo apt update && sudo apt install yt-dlp',
              '',
              '# Arch Linux:',
              'sudo pacman -S yt-dlp',
              '',
              '# Fedora:',
              'sudo dnf install yt-dlp'
            ],
            description: 'Install using system package manager'
          },
          {
            name: 'Direct Download',
            commands: [
              'sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp',
              'sudo chmod a+rx /usr/local/bin/yt-dlp'
            ],
            description: 'Download binary directly'
          }
        ]
      };

    case 'win32': // Windows
      return {
        title: 'Windows Installation',
        methods: [
          {
            name: 'Chocolatey (Recommended)',
            commands: ['choco install yt-dlp'],
            description: 'Install using Chocolatey package manager'
          },
          {
            name: 'Scoop',
            commands: ['scoop install yt-dlp'],
            description: 'Install using Scoop package manager'
          },
          {
            name: 'Python pip',
            commands: ['pip install yt-dlp'],
            description: 'Install using Python package manager'
          },
          {
            name: 'Direct Download',
            commands: [
              '1. Download yt-dlp.exe from: https://github.com/yt-dlp/yt-dlp/releases/latest',
              '2. Place it in a folder that\'s in your PATH environment variable',
              '3. Or add the folder containing yt-dlp.exe to your PATH'
            ],
            description: 'Download executable directly'
          }
        ]
      };

    default:
      return {
        title: 'Generic Installation',
        methods: [
          {
            name: 'Python pip',
            commands: ['pip3 install yt-dlp'],
            description: 'Install using Python package manager'
          },
          {
            name: 'Visit GitHub Releases',
            commands: ['https://github.com/yt-dlp/yt-dlp/releases/latest'],
            description: 'Download appropriate binary for your system'
          }
        ]
      };
  }
}

async function runInteractiveInstall() {
  log('🚀 Interactive yt-dlp Installation', 'cyan');
  log('=====================================\n', 'cyan');

  // Check if yt-dlp is already installed
  const ytDlpVersion = await checkYtDlpInstalled();
  if (ytDlpVersion) {
    log(`✅ yt-dlp is already installed! Version: ${ytDlpVersion}`, 'green');
    process.exit(0);
  }

  log('❌ yt-dlp is not installed', 'red');

  // Check system requirements
  const pythonVersion = await checkPythonInstalled();
  const pipVersion = await checkPipInstalled();

  log('\n📋 System Information:', 'blue');
  log(`Platform: ${os.platform()} ${os.arch()}`);
  log(`Python: ${pythonVersion || 'Not found'}`);
  log(`Pip: ${pipVersion || 'Not found'}`);

  // Show installation instructions
  const instructions = getInstallationInstructions();

  log(`\n📦 ${instructions.title}`, 'yellow');
  log('='.repeat(instructions.title.length + 4), 'yellow');

  instructions.methods.forEach((method, index) => {
    log(`\n${index + 1}. ${method.name}`, 'bright');
    log(`   ${method.description}`, 'reset');
    log('   Commands:', 'cyan');
    method.commands.forEach(cmd => {
      if (cmd.startsWith('#') || cmd === '') {
        log(`   ${cmd}`, 'yellow');
      } else {
        log(`   $ ${cmd}`, 'green');
      }
    });
  });

  // Recommendations
  log('\n💡 Recommendations:', 'magenta');
  if (os.platform() === 'darwin') {
    log('• Use Homebrew if you have it installed', 'reset');
    log('• Otherwise, use pip3 if Python is available', 'reset');
  } else if (os.platform() === 'linux') {
    log('• Use your distribution\'s package manager if available', 'reset');
    log('• pip3 is usually the most reliable option', 'reset');
  } else if (os.platform() === 'win32') {
    log('• Chocolatey or Scoop are recommended for Windows', 'reset');
    log('• Direct download works if you don\'t have package managers', 'reset');
  }

  log('\n🔗 Additional Resources:', 'blue');
  log('• Official documentation: https://github.com/yt-dlp/yt-dlp#installation', 'reset');
  log('• Troubleshooting: https://github.com/yt-dlp/yt-dlp/wiki', 'reset');

  log('\n⚠️  After installation:', 'yellow');
  log('1. Restart your terminal/command prompt', 'reset');
  log('2. Verify installation with: yt-dlp --version', 'reset');
  log('3. Run your application again', 'reset');
}

async function main() {
  try {
    await runInteractiveInstall();
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  checkYtDlpInstalled,
  getInstallationInstructions
};