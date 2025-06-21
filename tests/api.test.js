const request = require('supertest');

jest.mock('../config/mongodb.js', () => jest.fn());
jest.mock('axios');
jest.mock('../libs/general/auth.libs', () => ({
  GetAPSThreeLeggedToken: jest.fn(),
  GetAPSToken: jest.fn(),
}));

const axios = require('axios');
const authLibs = require('../libs/general/auth.libs');
const app = require('../app');

describe('API routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /general/userprofile', () => {
    test('returns 200 with valid token', async () => {
      axios.get.mockResolvedValueOnce({ data: { id: 'user' } });
      const res = await request(app)
        .get('/general/userprofile')
        .set('Cookie', ['access_token=valid']);
      expect(res.status).toBe(200);
      expect(axios.get).toHaveBeenCalled();
    });

    test('returns 401 without token', async () => {
      const res = await request(app).get('/general/userprofile');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /acc/accprojects', () => {
    test('returns 200 with valid token', async () => {
      axios.get
        .mockResolvedValueOnce({ data: { id: 'user' } }) // validateAutodeskToken
        .mockResolvedValueOnce({ data: { data: [] } }); // GetProjects
      const res = await request(app)
        .get('/acc/accprojects')
        .set('Cookie', ['access_token=valid']);
      expect(res.status).toBe(200);
      expect(axios.get).toHaveBeenCalled();
    });

    test('returns 401 without token', async () => {
      const res = await request(app).get('/acc/accprojects');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /auth/three-legged', () => {
    test('mocks login flow', async () => {
      authLibs.GetAPSThreeLeggedToken.mockResolvedValue('tok');
      const res = await request(app).get('/auth/three-legged?code=abc');
      expect(res.status).toBe(302);
      expect(res.headers['set-cookie'][0]).toContain('access_token=tok');
    });
  });
});
