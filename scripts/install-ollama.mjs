#!/usr/bin/env node

import { exec, execSync } from 'child_process';
import { platform, arch } from 'os';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

class OllamaInstaller {
  constructor() {
    this.platform = platform();
    this.arch = arch();
    this.isWindows = this.platform === 'win32';
    this.isMac = this.platform === 'darwin';
    this.isLinux = this.platform === 'linux';
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',    // cyan
      success: '\x1b[32m', // green
      warning: '\x1b[33m', // yellow
      error: '\x1b[31m',   // red
      reset: '\x1b[0m'
    };

    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : '💡';
    console.log(`${colors[type]}${prefix} ${message}${colors.reset}`);
  }

  async checkOllamaInstalled() {
    try {
      await execAsync('ollama --version');
      return true;
    } catch {
      return false;
    }
  }

  async checkOllamaRunning() {
    try {
      const response = await fetch('http://localhost:11434/api/version');
      return response.ok;
    } catch {
      return false;
    }
  }

  async installOllama() {
    this.log('Installing Ollama...');

    try {
      if (this.isWindows) {
        this.log('For Windows: Please download and run the installer from https://ollama.com/download/windows');
        this.log('After installation, please restart your terminal and run this script again.');
        return false;
      } else if (this.isMac || this.isLinux) {
        this.log('Running Ollama installation script...');
        await execAsync('curl -fsSL https://ollama.com/install.sh | sh');
        this.log('Ollama installed successfully!', 'success');
        return true;
      }
    } catch (error) {
      this.log(`Failed to install Ollama: ${error.message}`, 'error');
      return false;
    }
  }

  async startOllama() {
    this.log('Starting Ollama service...');

    try {
      if (this.isWindows) {
        // On Windows, ollama typically starts automatically after installation
        exec('ollama serve', { detached: true });
        await this.waitForOllama();
      } else {
        // On macOS/Linux, start ollama in the background
        exec('ollama serve > /dev/null 2>&1 &');
        await this.waitForOllama();
      }

      this.log('Ollama service started successfully!', 'success');
      return true;
    } catch (error) {
      this.log(`Failed to start Ollama: ${error.message}`, 'error');
      return false;
    }
  }

  async waitForOllama(maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      if (await this.checkOllamaRunning()) {
        return true;
      }
      this.log(`Waiting for Ollama to start... (${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error('Ollama failed to start within expected time');
  }

  async pullModel(modelName) {
    this.log(`Pulling model: ${modelName}`);

    try {
      const { stdout } = await execAsync(`ollama pull ${modelName}`);
      this.log(`Successfully pulled ${modelName}`, 'success');
      return true;
    } catch (error) {
      this.log(`Failed to pull ${modelName}: ${error.message}`, 'error');
      return false;
    }
  }

  async listModels() {
    try {
      const { stdout } = await execAsync('ollama list');
      return stdout.includes('qwen2.5:7b') || stdout.includes('tinyllama:latest');
    } catch {
      return false;
    }
  }

  getRecommendedModels() {
    return {
      fast: {
        name: 'tinyllama:latest',
        size: '~637MB',
        description: 'Fastest model, good for testing'
      },
      balanced: {
        name: 'qwen2.5:7b',
        size: '~4.7GB',
        description: 'Balanced speed and quality (recommended)'
      },
      quality: {
        name: 'mistral:7b',
        size: '~4.1GB',
        description: 'High quality responses'
      }
    };
  }

  async promptModelSelection() {
    const models = this.getRecommendedModels();

    console.log('\n📚 Available models:');
    Object.entries(models).forEach(([key, model]) => {
      console.log(`  ${key}: ${model.name} (${model.size}) - ${model.description}`);
    });

    // For automation, default to balanced model
    return models.balanced.name;
  }

  async setupEnvironment() {
    const envPath = path.join(process.cwd(), '.env');
    const envExamplePath = path.join(process.cwd(), '.env.example');

    try {
      let envContent = '';

      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      } else if (fs.existsSync(envExamplePath)) {
        envContent = fs.readFileSync(envExamplePath, 'utf8');
        this.log('Created .env file from .env.example');
      }

      // Update or add Ollama configuration
      const ollamaHost = 'OLLAMA_HOST="http://localhost:11434"';
      const ollamaModel = 'OLLAMA_MODEL="qwen2.5:7b"';

      if (!envContent.includes('OLLAMA_HOST')) {
        envContent += `\n# Ollama Configuration\n${ollamaHost}\n${ollamaModel}\n`;
      }

      fs.writeFileSync(envPath, envContent);
      this.log('Environment variables configured', 'success');
    } catch (error) {
      this.log(`Failed to setup environment: ${error.message}`, 'warning');
    }
  }

  async run() {
    console.log('🚀 Ollama Setup for YouTube Transcript App\n');

    // Check if Ollama is already installed
    const isInstalled = await this.checkOllamaInstalled();

    if (!isInstalled) {
      this.log('Ollama not found. Starting installation...');
      const installed = await this.installOllama();

      if (!installed && this.isWindows) {
        process.exit(1);
      }
    } else {
      this.log('Ollama is already installed', 'success');
    }

    // Check if Ollama is running
    const isRunning = await this.checkOllamaRunning();

    if (!isRunning) {
      this.log('Ollama is not running. Starting service...');
      const started = await this.startOllama();

      if (!started) {
        this.log('Please start Ollama manually: ollama serve', 'warning');
        process.exit(1);
      }
    } else {
      this.log('Ollama service is running', 'success');
    }

    // Check if models are available
    const hasModels = await this.listModels();

    if (!hasModels) {
      this.log('No compatible models found. Installing recommended model...');
      const selectedModel = await this.promptModelSelection();
      await this.pullModel(selectedModel);
    } else {
      this.log('Compatible models are available', 'success');
    }

    // Setup environment variables
    await this.setupEnvironment();

    console.log('\n🎉 Ollama setup complete!');
    console.log('\nNext steps:');
    console.log('1. Make sure your .env file has the correct Ollama configuration');
    console.log('2. Start your development server: npm run dev');
    console.log('3. Navigate to the app and try the AI features');
    console.log('\nIf you encounter issues, check that Ollama is running: ollama list');
  }
}

// Handle command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const installer = new OllamaInstaller();
  installer.run().catch(error => {
    console.error('❌ Installation failed:', error.message);
    process.exit(1);
  });
}

export default OllamaInstaller;