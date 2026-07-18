import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3000;

// --- Security middleware ---
app.use(helmet());

const allowedOrigins = [
  'http://localhost:5173', // SvelteKit's default dev server port
  'https://app.pennache.art' // adjust to whatever subdomain you'll actually use
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like curl, Postman, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                 // limit each IP to 100 requests per window
  standardHeaders: true,    // return rate limit info in RateLimit-* headers
  legacyHeaders: false
});
app.use(limiter);

// --- Data ---
const items = [
  { id: 1, name: 'Widget', price: 9.99 },
  { id: 2, name: 'Gadget', price: 19.99 },
  { id: 3, name: 'Gizmo', price: 14.99 }
];

app.get('/', (req, res) => {
  res.json({ message: 'Hello from my API!' });
});

app.get('/api/items', (req, res) => {
  res.json(items);
});

app.get('/api/items/:id', (req, res) => {
  const item = items.find(i => i.id === Number(req.params.id));
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  res.json(item);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});