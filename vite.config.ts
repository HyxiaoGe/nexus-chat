import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Generate a shared build timestamp
const BUILD_TIMESTAMP = Date.now();

// Custom plugin to generate version.json on build using the shared timestamp
const versionGenPlugin = () => {
  return {
    name: 'version-gen',
    writeBundle() {
      const version = {
        version: BUILD_TIMESTAMP,
        builtAt: new Date().toISOString(),
      };
      // Write to dist/version.json
      const outputPath = path.resolve(__dirname, 'dist', 'version.json');
      try {
        if (!fs.existsSync(path.resolve(__dirname, 'dist'))) {
          fs.mkdirSync(path.resolve(__dirname, 'dist'));
        }
        fs.writeFileSync(outputPath, JSON.stringify(version, null, 2));
        console.log(`✓ Generated version.json: ${version.version}`);
      } catch (error) {
        console.warn('⚠ Failed to generate version.json. Update detection may not work locally.');
      }
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), versionGenPlugin()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      __APP_VERSION__: JSON.stringify(BUILD_TIMESTAMP.toString()),
    },
    server: {
      port: 3000,
    },
    build: {
      outDir: 'dist',
    },
  };
});
