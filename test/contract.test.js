const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const request = require('supertest');
const app = require('../server');

const spec = yaml.load(
  fs.readFileSync(path.join(__dirname, '..', 'specs', 'cms-spec.yaml'), 'utf8')
);

const operations = Object.entries(spec.paths).flatMap(([route, methods]) =>
  Object.keys(methods).map((method) => ({ route, method }))
);

// Each spec operation needs a request that provokes every documented status code.
const scenarios = {
  'get /posts': [{ status: '200', run: () => request(app).get('/posts') }],
  'post /posts': [
    {
      status: '201',
      run: () => request(app).post('/posts').send({ title: 't', content: 'c' }),
    },
    { status: '400', run: () => request(app).post('/posts').send({ title: 't' }) },
  ],
  'get /posts/{id}': [
    {
      status: '200',
      run: async () => {
        const created = await request(app)
          .post('/posts')
          .send({ title: 't', content: 'c' });
        return request(app).get(`/posts/${created.body.id}`);
      },
    },
    { status: '404', run: () => request(app).get('/posts/999999') },
  ],
  'put /posts/{id}': [
    {
      status: '200',
      run: async () => {
        const created = await request(app)
          .post('/posts')
          .send({ title: 't', content: 'c' });
        return request(app)
          .put(`/posts/${created.body.id}`)
          .send({ title: 'updated', content: 'updated' });
      },
    },
    {
      status: '400',
      run: async () => {
        const created = await request(app)
          .post('/posts')
          .send({ title: 't', content: 'c' });
        return request(app).put(`/posts/${created.body.id}`).send({ title: 'only' });
      },
    },
    {
      status: '404',
      run: () =>
        request(app).put('/posts/999999').send({ title: 't', content: 'c' }),
    },
  ],
  'delete /posts/{id}': [
    {
      status: '204',
      run: async () => {
        const created = await request(app)
          .post('/posts')
          .send({ title: 't', content: 'c' });
        return request(app).delete(`/posts/${created.body.id}`);
      },
    },
    { status: '404', run: () => request(app).delete('/posts/999999') },
  ],
};

describe('server.js matches specs/cms-spec.yaml', () => {
  test('every spec operation has a test scenario', () => {
    const missing = operations
      .map(({ route, method }) => `${method} ${route}`)
      .filter((key) => !scenarios[key]);
    expect(missing).toEqual([]);
  });

  test.each(operations)('$method $route is implemented', async ({ route, method }) => {
    const key = `${method} ${route}`;
    const documented = Object.keys(spec.paths[route][method].responses);

    for (const status of documented) {
      const scenario = scenarios[key].find((s) => s.status === status);
      if (!scenario) {
        throw new Error(`no scenario for ${key} -> ${status}`);
      }

      const res = await scenario.run();
      expect(`${key} -> ${res.status}`).toBe(`${key} -> ${status}`);
    }
  });

  test('undocumented routes return 404', async () => {
    const res = await request(app).get('/not-in-spec');
    expect(res.status).toBe(404);
  });
});
