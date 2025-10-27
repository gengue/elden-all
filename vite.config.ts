import { defineConfig } from 'vite'

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    root: __dirname,
    publicDir: 'public',
    build: {
        minify: false,
        outDir: 'dist',
        emptyOutDir: false,
        rollupOptions: {
            input: {
                background: resolve(__dirname, 'src/background.ts'),
                content: resolve(__dirname, 'src/content.ts'),
                options: resolve(__dirname, 'options.html')
            },
            output: {
                format: 'es',
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name][extname]'
            }
        }
    }
})
