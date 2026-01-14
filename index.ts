import express, { Express, Request, Response } from 'express';

const app: Express = express();
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
