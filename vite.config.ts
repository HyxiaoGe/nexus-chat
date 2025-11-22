import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs';
import path from 'node:path';

// Custom plugin to generate version.json on build
const versionGenPlugin = () => {
  return {
    name: 'version-gen',
    writeBundle() {
      const version = {
        version: Date.now(), // Use timestamp as version ID
        builtAt: new Date().toISOString()
      };
      // Write to dist/version.json
      const outputPath = path.resolve(__dirname, 'dist', 'version.json');
      try {
        fs.writeFileSync(outputPath, JSON.stringify(version, null, 2));
        console.log(`✓ Generated version.json: ${version.version}`);
      } catch (error) {
        console.warn('⚠ Failed to generate version.json. Update detection may not work locally.');
      }
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      versionGenPlugin()
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    server: {
      port: 3000
    },
    build: {
      outDir: 'dist'
    }
  }
})