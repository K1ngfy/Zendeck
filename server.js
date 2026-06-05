import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware to parse JSON bodies
  app.use(express.json({ limit: '50mb' }));

  const STORAGE_DIR = path.join(__dirname, 'storage', 'projects');

  // Initialize storage directory
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create storage directory:', err);
  }

  // Generic proxy route to bypass CORS issues on the client
  app.post('/api/proxy/chat', async (req, res) => {
    // Disable Express timeout for this route
    req.setTimeout(0);
    const startTime = Date.now();
    try {
      const { url, headers, body } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'Missing URL in proxy request' });
      }

      console.log(`\n[PROXY] ${new Date().toISOString()}`);
      console.log(`[PROXY] => Starting request to LLM API: ${url}`);

      const cleanHeaders = { ...headers };
      delete cleanHeaders.host;
      delete cleanHeaders['content-length'];
      delete cleanHeaders['accept-encoding']; // Prevent decompression issues

      if (cleanHeaders['Authorization']) {
        console.log(`[PROXY] => Authorization header present: Bearer *****...`);
      }

      console.log(`[PROXY] => Request Body:`, JSON.stringify(body).slice(0, 200) + '...');

      // Add AbortController to log if the fetch is taking too long
      const controller = new AbortController();

      req.on('close', () => {
        console.log(`[PROXY] ⚠️ Client disconnected before completion.`);
        controller.abort();
      });

      let response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: cleanHeaders,
          body: JSON.stringify(body),
          signal: controller.signal
        });
      } catch (err) {
        throw err;
      }
      
      console.log(`[PROXY] <= Received headers. Status: ${response.status}`);
      
      if (!response.ok) {
         const errText = await response.text();
         console.log(`[PROXY] ❌ Error response body:`, errText.slice(0, 500));
         res.status(response.status).json({ _proxy_error: true, status: response.status, message: errText });
         return;
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[PROXY] <= Streaming success response body... Time to first byte: ${duration}s.`);

      res.status(response.status);
      response.headers.forEach((value, key) => {
        if (!['content-encoding', 'content-length'].includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      if (response.body) {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
          if (typeof res.flush === 'function') res.flush(); // ensure Express/compression flush
        }
        res.end();
      } else {
        const data = await response.text();
        res.send(data);
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`[PROXY] 🛑 Request was aborted by client disconnect`);
        return;
      }
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error(`[PROXY] ❌ Request failed after ${duration}s:`, error);
      if (!res.headersSent) {
        res.status(500).json({ _proxy_error: true, status: 500, message: error.message || 'Proxy request failed' });
      } else {
        res.end();
      }
    }
  });

  // ========== Projects Storage API ==========
  
  app.get('/api/projects', async (req, res) => {
    try {
      const files = await fs.readdir(STORAGE_DIR);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      const projectsList = [];
      for (const file of jsonFiles) {
        const filePath = path.join(STORAGE_DIR, file);
        const stat = await fs.stat(filePath);
        const data = await fs.readFile(filePath, 'utf-8');
        const project = JSON.parse(data);
        
        projectsList.push({
          id: project.id,
          title: project.title || 'Untitled Project',
          lastUpdated: project.lastUpdated || stat.mtime.toISOString(),
          createdAt: project.createdAt || stat.birthtime.toISOString(),
          themeId: project.themeId // Optional summary info
        });
      }
      
      // Sort by created at descending
      projectsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(projectsList);
    } catch (error) {
      console.error('Failed to list projects:', error);
      res.status(500).json({ error: 'Failed to list projects' });
    }
  });

  app.get('/api/projects/:id', async (req, res) => {
    try {
      const filePath = path.join(STORAGE_DIR, `${req.params.id}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      res.json(JSON.parse(data));
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.status(404).json({ error: 'Project not found' });
      } else {
        console.error('Failed to read project:', error);
        res.status(500).json({ error: 'Failed to read project' });
      }
    }
  });

  app.post('/api/projects', async (req, res) => {
    try {
      const projectData = req.body;
      if (!projectData || !projectData.id) {
        return res.status(400).json({ error: 'Missing project data or id' });
      }
      
      projectData.lastUpdated = new Date().toISOString();

      const filePath = path.join(STORAGE_DIR, `${projectData.id}.json`);
      // check if file exists to preserve createdAt if missing
      try {
        const existingDataStr = await fs.readFile(filePath, 'utf-8');
        const existingData = JSON.parse(existingDataStr);
        projectData.createdAt = projectData.createdAt || existingData.createdAt || (await fs.stat(filePath)).birthtime.toISOString();
      } catch (err) {
        projectData.createdAt = projectData.createdAt || new Date().toISOString();
      }

      const tempPath = path.join(STORAGE_DIR, `${projectData.id}.tmp.json`);
      
      // Atomic write: write to temp file then rename
      await fs.writeFile(tempPath, JSON.stringify(projectData, null, 2), 'utf-8');
      await fs.rename(tempPath, filePath);
      
      res.json({ success: true, lastUpdated: projectData.lastUpdated });
    } catch (error) {
      console.error('Failed to save project:', error);
      res.status(500).json({ error: 'Failed to save project' });
    }
  });

  app.delete('/api/projects/:id', async (req, res) => {
    try {
      const filePath = path.join(STORAGE_DIR, `${req.params.id}.json`);
      await fs.unlink(filePath);
      res.json({ success: true });
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.status(404).json({ error: 'Project not found' });
      } else {
        console.error('Failed to delete project:', error);
        res.status(500).json({ error: 'Failed to delete project' });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
