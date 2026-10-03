import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: '.', testMatch: 'inquiry-server.spec.ts', workers: 1 });
