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

describe('GET /api/termekek', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('200, visszaadja az összes terméket', async () => {
    const termekek = [{ id: 1, name: 'Póló', price: '3 000 Ft' }];
    mockDbAll.mockResolvedValueOnce(termekek);
    const res = await request(app).get('/api/termekek');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(termekek);
  });

  it('kategoria_id szűrő beépül a SQL-be', async () => {
    mockDbAll.mockResolvedValueOnce([]);
    await request(app).get('/api/termekek?kategoria_id=3');
    const [sql, params] = mockDbAll.mock.calls[0];
    expect(sql).toContain('t.kategoria_id = ?');
    expect(params).toContain('3');
  });

  it('kereses szűrő LIKE-ot használ name-re és description-re', async () => {
    mockDbAll.mockResolvedValueOnce([]);
    await request(app).get('/api/termekek?kereses=ing');
    const [sql, params] = mockDbAll.mock.calls[0];
    expect(sql).toContain('t.name LIKE ?');
    expect(sql).toContain('t.description LIKE ?');
    expect(params).toContain('%ing%');
  });

  it('min_ar és max_ar szűrő beépül', async () => {
    mockDbAll.mockResolvedValueOnce([]);
    await request(app).get('/api/termekek?min_ar=1000&max_ar=5000');
    const [sql, params] = mockDbAll.mock.calls[0];
    expect(sql).toContain('>= ?');
    expect(sql).toContain('<= ?');
    expect(params).toContain(1000);
    expect(params).toContain(5000);
  });

  it('rendez=ar_nov helyes ORDER BY-t tesz', async () => {
    mockDbAll.mockResolvedValueOnce([]);
    await request(app).get('/api/termekek?rendez=ar_nov');
    const [sql] = mockDbAll.mock.calls[0];
    expect(sql).toContain('ASC');
  });

  it('rendez=ar_csokkeno helyes ORDER BY-t tesz', async () => {
    mockDbAll.mockResolvedValueOnce([]);
    await request(app).get('/api/termekek?rendez=ar_csokkeno');
    const [sql] = mockDbAll.mock.calls[0];
    expect(sql).toContain('DESC');
  });

  it('érvénytelen rendez érték default ORDER BY-re esik vissza', async () => {
    mockDbAll.mockResolvedValueOnce([]);
    await request(app).get('/api/termekek?rendez=hulladek');
    const [sql] = mockDbAll.mock.calls[0];
    expect(sql).toContain('ORDER BY t.id ASC');
  });
});

describe('GET /api/termekek/:id', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('200, egy termék adatai', async () => {
    const termek = { id: 1, name: 'Póló' };
    mockDbGet.mockResolvedValueOnce(termek);
    const res = await request(app).get('/api/termekek/1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(termek);
  });

  it('400, ha az id nem szám', async () => {
    const res = await request(app).get('/api/termekek/abc');
    expect(res.status).toBe(400);
  });

  it('404, ha nem található', async () => {
    mockDbGet.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/termekek/9999');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/termekek (admin)', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('401 token nélkül', async () => {
    const res = await request(app).post('/api/termekek').send({
      name: 'X', price: '100 Ft',
    });
    expect(res.status).toBe(401);
  });

  it('403 sima usernek', async () => {
    const res = await request(app).post('/api/termekek')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'X', price: '100 Ft' });
    expect(res.status).toBe(403);
  });

  it('400 admin-ként ha hiányzik a név', async () => {
    const res = await request(app).post('/api/termekek')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: '100 Ft' });
    expect(res.status).toBe(400);
  });

  it('400 admin-ként ha hiányzik az ár', async () => {
    const res = await request(app).post('/api/termekek')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'X' });
    expect(res.status).toBe(400);
  });

  it('201 admin-ként sikeres létrehozás', async () => {
    mockQuery.mockResolvedValueOnce([{ insertId: 5 }]);
    mockDbGet.mockResolvedValueOnce({ id: 5, name: 'X', price: '100 Ft' });
    const res = await request(app).post('/api/termekek')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'X', price: '100 Ft', stock: 10 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.termek.id).toBe(5);
  });
});

describe('PUT /api/termekek/:id (admin)', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('403 nem admin-nak', async () => {
    const res = await request(app).put('/api/termekek/1')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'X', price: '100 Ft' });
    expect(res.status).toBe(403);
  });

  it('400 érvénytelen id-ra', async () => {
    const res = await request(app).put('/api/termekek/abc')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'X', price: '100 Ft' });
    expect(res.status).toBe(400);
  });

  it('400, ha hiányzik a név vagy ár', async () => {
    const res = await request(app).put('/api/termekek/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'X' });
    expect(res.status).toBe(400);
  });

  it('200 admin-ként sikeres update', async () => {
    mockQuery.mockResolvedValueOnce([{}]);
    mockDbGet.mockResolvedValueOnce({ id: 1, name: 'Y', price: '200 Ft' });
    const res = await request(app).put('/api/termekek/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Y', price: '200 Ft' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('DELETE /api/termekek/:id (admin)', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('403 nem admin-nak', async () => {
    const res = await request(app).delete('/api/termekek/1')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('400 érvénytelen id-ra', async () => {
    const res = await request(app).delete('/api/termekek/abc')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });

  it('200 admin-ként sikeres törlés', async () => {
    mockQuery.mockResolvedValueOnce([{}]);
    const res = await request(app).delete('/api/termekek/1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});
