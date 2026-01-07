import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about-page.html'),
        findLocation: resolve(__dirname, 'find-your-location.html'),
        formSubmit: resolve(__dirname, 'form-submit-page.html'),
        franchise: resolve(__dirname, 'franchise-page.html'),
        groupFitness: resolve(__dirname, 'group-fitness.html'),
        kickboxing: resolve(__dirname, 'kickboxing.html'),
        schedule: resolve(__dirname, 'schedule-page.html'),
        thankYou: resolve(__dirname, 'thank-you-page.html')
      }
    }
  }
});
