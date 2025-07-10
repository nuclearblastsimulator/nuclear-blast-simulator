import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

// https://astro.build/config
export default defineConfig({
  // Site configuration
  site: 'https://www.nuclearblastsimulator.com', // Update this to your actual domain

  // Build configuration
  build: {
    format: 'directory' // Use directory URLs (e.g., /about/ instead of /about.html)
  },

  // Server configuration for development
  server: {
    port: 3000,
    host: true
  },

  // Markdown configuration
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  },

  // Vite configuration (to integrate with existing setup)
  vite: {
    // Preserve any existing Vite configuration
    optimizeDeps: {
      exclude: ['@astrojs/prism']
    },
    plugins: [tailwindcss()]
  }
})
