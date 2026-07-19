import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { readFileSync } from 'node:fs'
import { load } from 'js-yaml';


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


function diffYearsFloat(start, end) {
  const msYear = 365.2425 * 24 * 60 * 60 * 1000;
  return (end - start) / msYear;
}

const pensionDate = new Date("2042-12-12");
const todayDate = new Date();
const timeToPensionYears = diffYearsFloat(todayDate, pensionDate);

console.log("Time to pension: ", timeToPensionYears);

let items = [];

// Get document, or throw exception on error
try {
  const doc = load(readFileSync('wyg.yaml', 'utf8'))

  items = doc.map(el => {
    let value = 0;

    if (el.round == 'fixed') {
      value = el.constant;
    } else {
      value = el.round == 'floor' ? Math.floor(timeToPensionYears * el.constant) : Math.ceil(timeToPensionYears * el.constant);
    }

    return {Id: el.id, Name: el.name, Nth: value, Unit: el.unit, Art: el.art};
  });
} catch (e) {
  console.log(e)
}

console.log(items);


// --- Data ---
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