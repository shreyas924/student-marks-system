const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Test server is running' });
});

const PORT = 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log('Try accessing:');
  console.log(`1. http://localhost:${PORT}/health`);
  console.log(`2. http://127.0.0.1:${PORT}/health`);
}); 