const express = require('express');
const { execFile } = require('child_process');
const app = express();

app.use(express.json()); // parses JSON request bodies

app.get('/hello', (req, res) => {
  res.json({ message: 'Hello World' });
});

app.post('/run', (req, res) => {
  const { code } = req.body;
  const env = { ...process.env, PYTHONIOENCODING: 'utf-8', NO_COLOR: '1', PYTHON_COLORS: '0' };
  execFile('python', ['-c', code], { encoding: 'utf8', env }, (error, stdout, stderr) => {
    res.json({ stdout, stderr, exitCode: error ? error.code : 0 });
  });
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});