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
const mockGetConnection = db.getConnection as jest.Mock;
const mockDbAll = dbAll as jest.Mock;
const mockDbGet = dbGet as jest.Mock;

const userToken = jwt.sign({ id: 1, email: 'a@b.hu', is_admin: 0 }, JWT_SECRET);
const adminToken = jwt.sign({ id: 2, email: 'admin@x.hu', is_admin: 1 }, JWT_SECRET);

const mkConn = () => ({
  beginTransaction: jest.fn().mockResolvedValue(undefined),
  query: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
  release: jest.fn(),
});

describe('GET /api/rendelesek (saját rendelések)', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('401 token nélkül', async () => {
    const res = await request(app).get('/api/rendelesek');
    expect(res.status).toBe(401);
  });

  it('200, rendelés lista tételekkel', async () => {
    mockDbAll
      .mockResolvedValueOnce([{ id: 10, total_amount: '1 000 Ft', status: 'pending' }])
      .mockResolvedValueOnce([{ id: 1, quantity: 2, unit_price: '500 Ft', name: 'Póló' }]);
    const res = await request(app).get('/api/rendelesek')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].tetelek).toHaveLength(1);
  });
});

describe('POST /api/rendelesek (rendelés leadása)', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('401 token nélkül', async () => {
    const res = await request(app).post('/api/rendelesek');
    expect(res.status).toBe(401);
  });

  it('400 üres kosárra', async () => {
    mockDbAll.mockResolvedValueOnce([]);
    const res = await request(app).post('/api/rendelesek')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/üres/i);
  });

  it('400, ha egy tétel mennyisége > stock', async () => {
    mockDbAll.mockResolvedValueOnce([
      { termek_id: 1, mennyiseg: 10, price: '500 Ft', name: 'Póló', stock: 2 },
    ]);
    const res = await request(app).post('/api/rendelesek')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/készlet/i);
  });

  it('201 sikeres rendelés, commit meghívódik', async () => {
    mockDbAll.mockResolvedValueOnce([
      { termek_id: 1, mennyiseg: 2, price: '1 500 Ft', name: 'Póló', stock: 10 },
    ]);
    const conn = mkConn();
    conn.query
      .mockResolvedValueOnce([{ insertId: 500 }])  // INSERT rendeles
      .mockResolvedValueOnce([{}])                  // INSERT rendeles_tetel
      .mockResolvedValueOnce([{}])                  // UPDATE termekek stock
      .mockResolvedValueOnce([{}]);                 // DELETE kosar
    mockGetConnection.mockResolvedValueOnce(conn);

    const res = await request(app).post('/api/rendelesek')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.rendeles_id).toBe(500);
    expect(conn.beginTransaction).toHaveBeenCalled();
    expect(conn.commit).toHaveBeenCalled();
    expect(conn.rollback).not.toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });

  it('SQL hiba esetén rollback-et hív és 500-at ad', async () => {
    mockDbAll.mockResolvedValueOnce([
      { termek_id: 1, mennyiseg: 1, price: '100 Ft', name: 'X', stock: 10 },
    ]);
    const conn = mkConn();
    conn.query.mockRejectedValueOnce(new Error('DB crashed'));
    mockGetConnection.mockResolvedValueOnce(conn);

    const res = await request(app).post('/api/rendelesek')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(500);
    expect(conn.rollback).toHaveBeenCalled();
    expect(conn.commit).not.toHaveBeenCalled();
  });

  it('helyesen számítja ki az összeget "1 500 Ft" formátumú árakból', async () => {
    mockDbAll.mockResolvedValueOnce([
      { termek_id: 1, mennyiseg: 2, price: '1 500 Ft', name: 'A', stock: 10 },
      { termek_id: 2, mennyiseg: 1, price: '2 000 Ft', name: 'B', stock: 10 },
    ]);
    const conn = mkConn();
    conn.query
      .mockResolvedValueOnce([{ insertId: 1 }])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}]);
    mockGetConnection.mockResolvedValueOnce(conn);

    await request(app).post('/api/rendelesek')
      .set('Authorization', `Bearer ${userToken}`);

    // Az első INSERT rendeles hívás második paramétere a total_amount
    // (locale-függő formátum lehet "5 000 Ft" vagy "5000 Ft", a lényeg az összeg)
    const firstInsert = conn.query.mock.calls[0];
    const totalAmount = firstInsert[1][1] as string;
    const numeric = parseInt(totalAmount.replace(/\D/g, ''), 10);
    expect(numeric).toBe(5000); // 2*1500 + 1*2000
    expect(totalAmount).toMatch(/Ft/);
  });
});

describe('GET /api/rendelesek/admin/osszes', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('403 sima usernek', async () => {
    const res = await request(app).get('/api/rendelesek/admin/osszes')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('200 admin-ként', async () => {
    mockDbAll
      .mockResolvedValueOnce([{ id: 1, user_id: 2, status: 'pending' }])
      .mockResolvedValueOnce([{ id: 1, quantity: 1 }]);
    const res = await request(app).get('/api/rendelesek/admin/osszes')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('PUT /api/rendelesek/admin/:id/statusz', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('403 sima usernek', async () => {
    const res = await request(app).put('/api/rendelesek/admin/1/statusz')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'shipped' });
    expect(res.status).toBe(403);
  });

  it('400 érvénytelen státuszra', async () => {
    const res = await request(app).put('/api/rendelesek/admin/1/statusz')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'bubamaca' });
    expect(res.status).toBe(400);
  });

  it('404, ha nem létezik a rendelés', async () => {
    mockDbGet.mockResolvedValueOnce(null);
    const res = await request(app).put('/api/rendelesek/admin/1/statusz')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'shipped' });
    expect(res.status).toBe(404);
  });

  it('200 admin-ként érvényes státusszal', async () => {
    mockDbGet.mockResolvedValueOnce({ id: 1 });
    mockQuery.mockResolvedValueOnce([{}]);
    const res = await request(app).put('/api/rendelesek/admin/1/statusz')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'shipped' });
    expect(res.status).toBe(200);
  });

  it.each(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])(
    'elfogadja az érvényes státuszt: %s', async (status) => {
      mockDbGet.mockResolvedValueOnce({ id: 1 });
      mockQuery.mockResolvedValueOnce([{}]);
      const res = await request(app).put('/api/rendelesek/admin/1/statusz')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status });
      expect(res.status).toBe(200);
    }
  );
});
