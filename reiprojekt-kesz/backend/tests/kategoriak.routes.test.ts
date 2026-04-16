jest.mock('../src/db/pool', () => ({
  db: { query: jest.fn(), getConnection: jest.fn() },
  dbAll: jest.fn(),
  dbGet: jest.fn(),
}));

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { db, dbAll, dbGet } from '../src/db/pool';
import { JWT_SECRET } from '../src/config';

const mockQuery = db.query as jest.Mock;
const mockDbAll = dbAll as jest.Mock;
const mockDbGet = dbGet as jest.Mock;

const userToken = jwt.sign({ id: 1, email: 'a@b.hu', is_admin: 0 }, JWT_SECRET);
const adminToken = jwt.sign({ id: 2, email: 'admin@b.hu', is_admin: 1 }, JWT_SECRET);

describe('GET /api/kategoriak', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('200 a kategóriák listájával', async () => {
    const lista = [{ id: 1, name: 'Pólók', slug: 'polok' }];
    mockDbAll.mockResolvedValueOnce(lista);
    const res = await request(app).get('/api/kategoriak');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(lista);
  });
});

describe('POST /api/kategoriak (admin)', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('401 token nélkül', async () => {
    const res = await request(app).post('/api/kategoriak').send({ name: 'Új' });
    expect(res.status).toBe(401);
  });

  it('403 sima usernek', async () => {
    const res = await request(app).post('/api/kategoriak')
      .set('Authorization', `Bearer ${userToken}`).send({ name: 'Új' });
    expect(res.status).toBe(403);
  });

  it('400 admin-ként ha hiányzik a név', async () => {
    const res = await request(app).post('/api/kategoriak')
      .set('Authorization', `Bearer ${adminToken}`).send({});
    expect(res.status).toBe(400);
  });

  it('201 admin-ként, auto-generált slug ékezetek nélkül', async () => {
    mockQuery.mockResolvedValueOnce([{ insertId: 10 }]);
    mockDbGet.mockResolvedValueOnce({ id: 10, name: 'Új kategória', slug: 'uj-kategoria' });
    const res = await request(app).post('/api/kategoriak')
      .set('Authorization', `Bearer ${adminToken}`).send({ name: 'Új kategória' });
    expect(res.status).toBe(201);
    expect(res.body.kategoria.slug).toBe('uj-kategoria');
  });

  it('409 duplikált kategóriára', async () => {
    mockQuery.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });
    const res = await request(app).post('/api/kategoriak')
      .set('Authorization', `Bearer ${adminToken}`).send({ name: 'Pólók' });
    expect(res.status).toBe(409);
  });
});

describe('PUT /api/kategoriak/:id (admin)', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('403 sima usernek', async () => {
    const res = await request(app).put('/api/kategoriak/1')
      .set('Authorization', `Bearer ${userToken}`).send({ name: 'X' });
    expect(res.status).toBe(403);
  });

  it('400 admin-ként ha hiányzik a név', async () => {
    const res = await request(app).put('/api/kategoriak/1')
      .set('Authorization', `Bearer ${adminToken}`).send({});
    expect(res.status).toBe(400);
  });

  it('200 admin-ként sikeres frissítés', async () => {
    mockQuery.mockResolvedValueOnce([{}]);
    mockDbGet.mockResolvedValueOnce({ id: 1, name: 'Módosított', slug: 'modositott' });
    const res = await request(app).put('/api/kategoriak/1')
      .set('Authorization', `Bearer ${adminToken}`).send({ name: 'Módosított', slug: 'modositott' });
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/kategoriak/:id (admin)', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('403 sima usernek', async () => {
    const res = await request(app).delete('/api/kategoriak/1')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('200 admin-ként', async () => {
    mockQuery.mockResolvedValueOnce([{}]);
    const res = await request(app).delete('/api/kategoriak/1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});
