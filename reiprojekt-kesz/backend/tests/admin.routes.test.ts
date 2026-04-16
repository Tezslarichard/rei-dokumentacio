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
const adminToken = jwt.sign({ id: 99, email: 'admin@x.hu', is_admin: 1 }, JWT_SECRET);

describe('Admin route-ok védettsége', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('401, ha nincs token', async () => {
    const res = await request(app).get('/api/admin/felhasznalok');
    expect(res.status).toBe(401);
  });

  it('403, ha sima user', async () => {
    const res = await request(app).get('/api/admin/felhasznalok')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/admin/felhasznalok', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('200 admin-ként, lista', async () => {
    const lista = [{ id: 1, name: 'A', email: 'a@b.hu', is_admin: 0 }];
    mockDbAll.mockResolvedValueOnce(lista);
    const res = await request(app).get('/api/admin/felhasznalok')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(lista);
  });
});

describe('PUT /api/admin/felhasznalok/:id/admin', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('400, ha saját magát próbálja módosítani', async () => {
    // Admin user id = 99
    const res = await request(app).put('/api/admin/felhasznalok/99/admin')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Saját/);
  });

  it('404, ha a user nem létezik', async () => {
    mockDbGet.mockResolvedValueOnce(null);
    const res = await request(app).put('/api/admin/felhasznalok/555/admin')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('200, is_admin 0 -> 1 toggle', async () => {
    mockDbGet.mockResolvedValueOnce({ id: 5, is_admin: 0 });
    mockQuery.mockResolvedValueOnce([{}]);
    const res = await request(app).put('/api/admin/felhasznalok/5/admin')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.is_admin).toBe(1);
  });

  it('200, is_admin 1 -> 0 toggle', async () => {
    mockDbGet.mockResolvedValueOnce({ id: 5, is_admin: 1 });
    mockQuery.mockResolvedValueOnce([{}]);
    const res = await request(app).put('/api/admin/felhasznalok/5/admin')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.is_admin).toBe(0);
  });
});

describe('DELETE /api/admin/felhasznalok/:id', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('400, ha saját magát próbálja törölni', async () => {
    const res = await request(app).delete('/api/admin/felhasznalok/99')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });

  it('200 másik user törlésére', async () => {
    mockQuery.mockResolvedValueOnce([{}]);
    const res = await request(app).delete('/api/admin/felhasznalok/5')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

describe('GET /api/admin/dashboard', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('200 az összesítő számokkal', async () => {
    // 5 db COUNT query + 1 db latest orders query
    mockQuery
      .mockResolvedValueOnce([[{ db: 10 }]])   // felhasznalok
      .mockResolvedValueOnce([[{ db: 20 }]])   // termekek
      .mockResolvedValueOnce([[{ db: 5 }]])    // rendelesek
      .mockResolvedValueOnce([[{ db: 15 }]])   // hirlevel
      .mockResolvedValueOnce([[{ db: 3 }]]);   // uzenetek
    mockDbAll.mockResolvedValueOnce([]);       // legujabb rendelesek

    const res = await request(app).get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      felhasznalok: 10,
      termekek: 20,
      rendelesek: 5,
      hirlevel_feliratkozasok: 15,
      kapcsolat_uzenetek: 3,
    });
  });
});

describe('GET /api/admin/uzenetek és /api/admin/hirlevel', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('/uzenetek 200 admin-ként', async () => {
    mockDbAll.mockResolvedValueOnce([{ id: 1, name: 'X' }]);
    const res = await request(app).get('/api/admin/uzenetek')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('/hirlevel 200 admin-ként', async () => {
    mockDbAll.mockResolvedValueOnce([{ id: 1, email: 'a@b.hu' }]);
    const res = await request(app).get('/api/admin/hirlevel')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});
