const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let nextId = 1;
const posts = [];

app.get('/posts', (req, res) => {
  res.status(200).json(posts);
});

app.get('/posts/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const post = posts.find((p) => p.id === id);

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  res.status(200).json(post);
});

app.post('/posts', (req, res) => {
  const { title, content } = req.body ?? {};

  if (typeof title !== 'string' || typeof content !== 'string') {
    return res.status(400).json({ error: 'title and content must be strings' });
  }

  const post = { id: nextId++, title, content };
  posts.push(post);
  res.status(201).json(post);
});

app.delete('/posts/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = Number.isInteger(id) ? posts.findIndex((p) => p.id === id) : -1;

  if (index === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  posts.splice(index, 1);
  res.status(204).end();
});

const port = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Mini CMS API listening on port ${port}`);
  });
}

module.exports = app;
