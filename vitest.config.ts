import { defineConfig } from "vitest/config"
import { playwright } from "@vitest/browser-playwright"
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules/**'],
    browser: {
      provider: playwright(),
      enabled: true,
      instances: [
        { browser: 'chromium' },
      ],
      viewport: {
        width: 1920,
        height: 1080,
      },
    },
    coverage: {
      reporter: ['text', 'html'],
    },
  },
})
