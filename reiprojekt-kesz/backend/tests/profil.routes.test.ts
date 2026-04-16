jest.mock('../src/db/pool', () => ({
  db: { query: jest.fn(), getConnection: jest.fn() },
  dbAll: jest.fn(),
  dbGet: jest.fn(),
}));

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { db, dbGet } from '../src/db/pool';
import { JWT_SECRET } from '../src/config';

const mockQuery = db.query as jest.Mock;
const mockDbGet = dbGet as jest.Mock;

const token = jwt.sign({ id: 5, email: 'x@y.hu', is_admin: 0 }, JWT_SECRET);
const auth = { Authorization: `Bearer ${token}` };

describe('GET /api/profil', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('401 token nélkül', async () => {
    const res = await request(app).get('/api/profil');
    expect(res.status).toBe(401);
  });

  it('200, profil adatok', async () => {
    const fh = { id: 5, name: 'X', email: 'x@y.hu', is_admin: 0, created_at: new Date() };
    mockDbGet.mockResolvedValueOnce(fh);
    const res = await request(app).get('/api/profil').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(5);
  });

  it('404, ha nincs meg a user', async () => {
    mockDbGet.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/profil').set(auth);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/profil', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('401 token nélkül', async () => {
    const res = await request(app).put('/api/profil').send({ name: 'X', email: 'a@b.hu' });
    expect(res.status).toBe(401);
  });

  it('400, ha hiányzik a név', async () => {
    const res = await request(app).put('/api/profil').set(auth)
      .send({ email: 'a@b.hu' });
    expect(res.status).toBe(400);
  });

  it('400, ha hiányzik az email', async () => {
    const res = await request(app).put('/api/profil').set(auth)
      .send({ name: 'X' });
    expect(res.status).toBe(400);
  });

  it('200 sikeres update', async () => {
    mockQuery.mockResolvedValueOnce([{}]);
    mockDbGet.mockResolvedValueOnce({
      id: 5, name: 'Új Név', email: 'uj@pelda.hu', is_admin: 0, created_at: new Date(),
    });
    const res = await request(app).put('/api/profil').set(auth)
      .send({ name: 'Új Név', email: 'uj@pelda.hu' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.felhasznalo.name).toBe('Új Név');
  });

  it('409, ha az email foglalt', async () => {
    mockQuery.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });
    const res = await request(app).put('/api/profil').set(auth)
      .send({ name: 'X', email: 'foglalt@pelda.hu' });
    expect(res.status).toBe(409);
  });
});
