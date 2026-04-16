jest.mock('../src/db/pool', () => ({
  db: { query: jest.fn(), getConnection: jest.fn() },
  dbAll: jest.fn(),
  dbGet: jest.fn(),
}));

import request from 'supertest';
import app from '../src/app';
import { db, dbGet } from '../src/db/pool';

const mockQuery = db.query as jest.Mock;
const mockDbGet = dbGet as jest.Mock;

describe('POST /api/regisztracio', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('sikeres regisztráció esetén 201 és token', async () => {
    mockQuery.mockResolvedValueOnce([{ insertId: 42 }]);
    const res = await request(app).post('/api/regisztracio').send({
      name: 'Teszt Elek', email: 'teszt@pelda.hu', password: 'titok123',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.felhasznalo).toMatchObject({
      id: 42, name: 'Teszt Elek', email: 'teszt@pelda.hu', is_admin: 0,
    });
  });

  it('400, ha hiányzik a név', async () => {
    const res = await request(app).post('/api/regisztracio').send({
      email: 'a@b.hu', password: 'titok123',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/kötelező/);
  });

  it('400, ha hiányzik az email', async () => {
    const res = await request(app).post('/api/regisztracio').send({
      name: 'A', password: 'titok123',
    });
    expect(res.status).toBe(400);
  });

  it('400, ha hiányzik a jelszó', async () => {
    const res = await request(app).post('/api/regisztracio').send({
      name: 'A', email: 'a@b.hu',
    });
    expect(res.status).toBe(400);
  });

  it('400, ha a jelszó rövidebb mint 6 karakter', async () => {
    const res = await request(app).post('/api/regisztracio').send({
      name: 'A', email: 'a@b.hu', password: '12345',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/6 karakter/);
  });

  it('400 érvénytelen email formátumra', async () => {
    const res = await request(app).post('/api/regisztracio').send({
      name: 'A', email: 'nem-email', password: 'titok123',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/e-mail/i);
  });

  it('409 duplikált email-re (ER_DUP_ENTRY)', async () => {
    mockQuery.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });
    const res = await request(app).post('/api/regisztracio').send({
      name: 'A', email: 'foglalt@pelda.hu', password: 'titok123',
    });
    expect(res.status).toBe(409);
  });

  it('500 egyéb DB hibára', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB összeomlott'));
    const res = await request(app).post('/api/regisztracio').send({
      name: 'A', email: 'a@b.hu', password: 'titok123',
    });
    expect(res.status).toBe(500);
  });
});

describe('POST /api/bejelentkezes', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('helyes credentials-szel 200 és token', async () => {
    mockDbGet.mockResolvedValueOnce({
      id: 1, name: 'Teszt', email: 'a@b.hu', is_admin: 0, created_at: new Date(),
    });
    const res = await request(app).post('/api/bejelentkezes').send({
      email: 'a@b.hu', password: 'titok123',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.felhasznalo.email).toBe('a@b.hu');
  });

  it('400, ha hiányzik az email', async () => {
    const res = await request(app).post('/api/bejelentkezes').send({
      password: 'titok123',
    });
    expect(res.status).toBe(400);
  });

  it('400, ha hiányzik a jelszó', async () => {
    const res = await request(app).post('/api/bejelentkezes').send({
      email: 'a@b.hu',
    });
    expect(res.status).toBe(400);
  });

  it('401, ha nem létezik ilyen user / hibás jelszó', async () => {
    mockDbGet.mockResolvedValueOnce(null);
    const res = await request(app).post('/api/bejelentkezes').send({
      email: 'nem@letezik.hu', password: 'rossz',
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Hibás/);
  });

  it('admin user is_admin = 1-gyel tudjon belépni', async () => {
    mockDbGet.mockResolvedValueOnce({
      id: 1, name: 'Admin', email: 'admin@rei.hu', is_admin: 1, created_at: new Date(),
    });
    const res = await request(app).post('/api/bejelentkezes').send({
      email: 'admin@rei.hu', password: 'admin123',
    });
    expect(res.status).toBe(200);
    expect(res.body.felhasznalo.is_admin).toBe(1);
  });
});
