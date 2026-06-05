import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    clearScreen: false,
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'dynamic-proxy',
        configureServer(server) {
          server.middlewares.use('/api/proxy', (req, res) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              req.on('end', async () => {
                try {
                  const parsed = JSON.parse(body);
                  const { url, headers, body: targetBody } = parsed;
                  
                  const cleanHeaders = { ...headers };
                  delete cleanHeaders.host;
                  delete cleanHeaders['content-length'];
                  
                  const response = await fetch(url, {
                    method: 'POST',
                    headers: cleanHeaders,
                    body: JSON.stringify(targetBody)
                  });
                  
                  const data = await response.text();
                  res.statusCode = response.status;
                  res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
                  res.end(data);
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
            } else {
              res.statusCode = 405;
              res.end('Method Not Allowed');
            }
          });
        }
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: { hmr: process.env.DISABLE_HMR !== 'true', watch: { ignored: ['**/storage/**'] } },
  };
});
