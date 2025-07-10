import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import rehypeExternalLinks from 'rehype-external-links'
import sitemap from '@astrojs/sitemap'

// https://astro.build/config
export default defineConfig({
  // Site configuration
  site: 'https://www.nuclearblastsimulator.com', // Update this to your actual domain
  
  // Integrations
  integrations: [sitemap()],

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
    },
    rehypePlugins: [
      [rehypeExternalLinks, { 
        target: '_blank', 
        rel: ['noopener', 'noreferrer']
      }]
    ]
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
