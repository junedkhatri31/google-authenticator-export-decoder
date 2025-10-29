import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['reference/**', 'node_modules/**'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
})
