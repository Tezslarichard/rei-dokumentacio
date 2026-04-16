jest.mock('../src/db/pool', () => ({
  db: { query: jest.fn(), getConnection: jest.fn() },
  dbAll: jest.fn(),
  dbGet: jest.fn(),
}));

import request from 'supertest';
import app from '../src/app';
import { db } from '../src/db/pool';

const mockQuery = db.query as jest.Mock;

describe('POST /api/hirlevel', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('400, ha hiányzik az email', async () => {
    const res = await request(app).post('/api/hirlevel').send({});
    expect(res.status).toBe(400);
  });

  it('200, sikeres feliratkozás', async () => {
    mockQuery.mockResolvedValueOnce([{}]);
    const res = await request(app).post('/api/hirlevel').send({ email: 'a@b.hu' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('409, ha már fel van iratkozva', async () => {
    mockQuery.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });
    const res = await request(app).post('/api/hirlevel').send({ email: 'a@b.hu' });
    expect(res.status).toBe(409);
  });

  it('500 egyéb DB hibára', async () => {
    mockQuery.mockRejectedValueOnce(new Error('X'));
    const res = await request(app).post('/api/hirlevel').send({ email: 'a@b.hu' });
    expect(res.status).toBe(500);
  });
});

describe('POST /api/kapcsolat', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('400, ha hiányzik mező', async () => {
    const res = await request(app).post('/api/kapcsolat').send({
      name: 'X', email: 'a@b.hu',
    });
    expect(res.status).toBe(400);
  });

  it('200 minden mezővel', async () => {
    mockQuery.mockResolvedValueOnce([{}]);
    const res = await request(app).post('/api/kapcsolat').send({
      name: 'X', email: 'a@b.hu', subject: 'T', message: 'M',
    });
    expect(res.status).toBe(200);
  });
});
