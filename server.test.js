const path = require('path');
const request = require('supertest');
const jestOpenAPI = require('jest-openapi').default || require('jest-openapi');
const app = require('./server');

// 1. Point the matcher to our OpenAPI contract
jestOpenAPI(path.join(__dirname, 'specs/cms-spec.yaml'));

describe('Mini CMS Contract Tests', () => {
  
  it('GET /posts should conform to the OpenAPI spec', async () => {
    const response = await request(app).get('/posts');
    
    // Assert basic HTTP status code
    expect(response.status).toBe(200);
    
    // 2. Validate response body & headers against cms-spec.yaml
    expect(response).toSatisfyApiSpec();
  });

  it('POST /posts should create a post conforming to the spec', async () => {
    const newPost = {
      title: 'Spec-Driven Development',
      content: 'Building software contract-first!'
    };

    const response = await request(app)
      .post('/posts')
      .send(newPost);

    expect(response.status).toBe(201);
    expect(response).toSatisfyApiSpec();
  });

  it('GET /posts/:id should return 404 for missing post per spec', async () => {
    const response = await request(app).get('/posts/999');

    expect(response.status).toBe(404);
    expect(response).toSatisfyApiSpec();
  });

});