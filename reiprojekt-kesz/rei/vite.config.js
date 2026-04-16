import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        '**/*.css',
        'src/main.jsx',
        'src/assets/**',
        'tests/**',
        'vite.config.js',
        'eslint.config.js',
        'dist/**',
      ],
    },
  },
})
