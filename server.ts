import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get('/api/track', async (req, res) => {
    const { courier, awb } = req.query;
    const apiKey = process.env.BINDERBYTE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'BINDERBYTE_API_KEY is not configured.' });
    }

    if (!courier || !awb) {
      return res.status(400).json({ error: 'Courier and AWB are required.' });
    }

    try {
      const response = await fetch(`https://api.binderbyte.com/v1/track?api_key=${apiKey}&courier=${courier}&awb=${awb}`);
      const data = await response.json();
      
      if (response.ok) {
        res.json(data);
      } else {
        res.status(response.status).json(data);
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      res.status(500).json({ error: 'Failed to fetch tracking data.' });
    }
  });

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
