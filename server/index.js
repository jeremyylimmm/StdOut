const express = require('express');
const app = express();

app.use(express.json()); // parses JSON request bodies

app.get('/hello', (req, res) => {
  res.send('Hello World');
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});