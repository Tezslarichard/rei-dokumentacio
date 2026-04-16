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
const authHeader = { Authorization: `Bearer ${userToken}` };

describe('GET /api/kosar', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('401, ha nincs token', async () => {
    const res = await request(app).get('/api/kosar');
    expect(res.status).toBe(401);
  });

  it('200, visszaadja a user kosár tételeit', async () => {
    const tetelek = [
      { id: 1, termek_id: 5, mennyiseg: 2, name: 'Póló', price: '3 000 Ft', color: 'fekete', image_url: null, stock: 10 },
    ];
    mockDbAll.mockResolvedValueOnce(tetelek);
    const res = await request(app).get('/api/kosar').set(authHeader);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(tetelek);
  });

  it('500, ha DB hiba', async () => {
    mockDbAll.mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app).get('/api/kosar').set(authHeader);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/kosar', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('401, ha nincs token', async () => {
    const res = await request(app).post('/api/kosar').send({ termek_id: 1 });
    expect(res.status).toBe(401);
  });

  it('400, ha hiányzik a termek_id', async () => {
    const res = await request(app).post('/api/kosar').set(authHeader).send({});
    expect(res.status).toBe(400);
  });

  it('404, ha a termék nem található', async () => {
    mockDbGet.mockResolvedValueOnce(null);
    const res = await request(app).post('/api/kosar').set(authHeader)
      .send({ termek_id: 999 });
    expect(res.status).toBe(404);
  });

  it('új tétel hozzáadása sikeres, ha még nincs a kosárban', async () => {
    mockDbGet
      .mockResolvedValueOnce({ id: 5, stock: 10 })  // termék
      .mockResolvedValueOnce(null);                  // nincs kosárban
    mockQuery.mockResolvedValueOnce([{}]);
    const res = await request(app).post('/api/kosar').set(authHeader)
      .send({ termek_id: 5, mennyiseg: 2 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO kosar'),
      expect.arrayContaining([1, 5, 2])
    );
  });

  it('ha már van a kosárban, a mennyiség összeadódik', async () => {
    mockDbGet
      .mockResolvedValueOnce({ id: 5, stock: 10 })                // termék
      .mockResolvedValueOnce({ id: 99, mennyiseg: 3 });           // meglévő kosár sor
    mockQuery.mockResolvedValueOnce([{}]);
    const res = await request(app).post('/api/kosar').set(authHeader)
      .send({ termek_id: 5, mennyiseg: 2 });
    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      'UPDATE kosar SET mennyiseg = ? WHERE id = ?',
      [5, 99]
    );
  });

  it('400, ha a kért mennyiség meghaladja a készletet (új tétel)', async () => {
    mockDbGet
      .mockResolvedValueOnce({ id: 5, stock: 3 })
      .mockResolvedValueOnce(null);
    const res = await request(app).post('/api/kosar').set(authHeader)
      .send({ termek_id: 5, mennyiseg: 10 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/készlet/i);
  });

  it('400, ha meglévő + új mennyiség meghaladja a készletet', async () => {
    mockDbGet
      .mockResolvedValueOnce({ id: 5, stock: 5 })
      .mockResolvedValueOnce({ id: 99, mennyiseg: 4 });
    const res = await request(app).post('/api/kosar').set(authHeader)
      .send({ termek_id: 5, mennyiseg: 2 });   // 4 + 2 = 6 > 5
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/kosar/:id', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('401, ha nincs token', async () => {
    const res = await request(app).put('/api/kosar/1').send({ mennyiseg: 2 });
    expect(res.status).toBe(401);
  });

  it('400, ha a mennyiség érvénytelen (0 vagy negatív)', async () => {
    const res = await request(app).put('/api/kosar/1').set(authHeader)
      .send({ mennyiseg: 0 });
    expect(res.status).toBe(400);
  });

  it('404, ha a kosár tétel nem található (vagy nem a useré)', async () => {
    mockDbGet.mockResolvedValueOnce(null);
    const res = await request(app).put('/api/kosar/1').set(authHeader)
      .send({ mennyiseg: 2 });
    expect(res.status).toBe(404);
  });

  it('sikeres frissítés', async () => {
    mockDbGet.mockResolvedValueOnce({ id: 1, mennyiseg: 1, stock: 10 });
    mockQuery.mockResolvedValueOnce([{}]);
    const res = await request(app).put('/api/kosar/1').set(authHeader)
      .send({ mennyiseg: 5 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('400, ha a mennyiség > stock', async () => {
    mockDbGet.mockResolvedValueOnce({ id: 1, mennyiseg: 1, stock: 3 });
    const res = await request(app).put('/api/kosar/1').set(authHeader)
      .send({ mennyiseg: 10 });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/kosar/:id', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('401, ha nincs token', async () => {
    const res = await request(app).delete('/api/kosar/1');
    expect(res.status).toBe(401);
  });

  it('sikeres törlés', async () => {
    mockQuery.mockResolvedValueOnce([{}]);
    const res = await request(app).delete('/api/kosar/1').set(authHeader);
    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      'DELETE FROM kosar WHERE id = ? AND felhasznalo_id = ?',
      [1, 1]
    );
  });
});

describe('DELETE /api/kosar (ürítés)', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('401, ha nincs token', async () => {
    const res = await request(app).delete('/api/kosar');
    expect(res.status).toBe(401);
  });

  it('sikeres ürítés', async () => {
    mockQuery.mockResolvedValueOnce([{}]);
    const res = await request(app).delete('/api/kosar').set(authHeader);
    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      'DELETE FROM kosar WHERE felhasznalo_id = ?',
      [1]
    );
  });
});
