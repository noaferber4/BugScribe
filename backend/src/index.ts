import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import analyzeRouter from './routes/analyze.js';
import translateRouter from './routes/translate.js';
import transcribeRouter from './routes/transcribe.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '1mb' }));

app.use('/api', analyzeRouter);
app.use('/api', translateRouter);
app.use('/api', transcribeRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`BugScribe backend running on http://localhost:${PORT}`);
});
