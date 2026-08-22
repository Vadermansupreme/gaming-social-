import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true, // listen on 0.0.0.0 and :: so both IPv4 and IPv6 work (better for Windows localhost)
    port: 8080,
    strictPort: false,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      
      includeAssets: ['favicon.ico', 'icons/*.png', 'placeholder.svg'],
      manifest: {
        name: 'SpotMe',
        short_name: 'SpotMe',
        description: 'Find your fitness partner, anytime, anywhere.',
        theme_color: '#1A1B2E',
        background_color: '#1A1B2E',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/icon-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icons/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000,
        // Cache ONLY static build assets - NO API caching
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Explicitly exclude any API routes from precaching
        navigateFallback: null,
        // No runtimeCaching - static assets only via globPatterns
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
