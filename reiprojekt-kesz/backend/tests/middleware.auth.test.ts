import jwt from 'jsonwebtoken';
import { authMiddleware, adminMiddleware, AuthRequest } from '../src/middleware/auth';
import { JWT_SECRET } from '../src/config';
import { Response } from 'express';

const mkRes = (): any => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authMiddleware', () => {
  it('401, ha nincs Authorization header', () => {
    const req = { headers: {} } as AuthRequest;
    const res = mkRes();
    const next = jest.fn();
    authMiddleware(req, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Hitelesítés szükséges!' });
    expect(next).not.toHaveBeenCalled();
  });

  it('401, ha a header nem "Bearer "-rel kezdődik', () => {
    const req = { headers: { authorization: 'Basic abc' } } as AuthRequest;
    const res = mkRes();
    const next = jest.fn();
    authMiddleware(req, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('401, ha a token érvénytelen', () => {
    const req = { headers: { authorization: 'Bearer ervenytelen.token.itt' } } as AuthRequest;
    const res = mkRes();
    const next = jest.fn();
    authMiddleware(req, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Érvénytelen vagy lejárt token!' });
    expect(next).not.toHaveBeenCalled();
  });

  it('érvényes token esetén next() hívódik és req.user ki van töltve', () => {
    const token = jwt.sign({ id: 7, email: 'x@y.hu', is_admin: 0 }, JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = mkRes();
    const next = jest.fn();
    authMiddleware(req, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe(7);
    expect(req.user.email).toBe('x@y.hu');
  });

  it('más secret-tel aláírt tokenre 401', () => {
    const token = jwt.sign({ id: 1 }, 'masik_secret');
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = mkRes();
    const next = jest.fn();
    authMiddleware(req, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('adminMiddleware', () => {
  it('403, ha nincs req.user', () => {
    const req = {} as AuthRequest;
    const res = mkRes();
    const next = jest.fn();
    adminMiddleware(req, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('403, ha a user nem admin (is_admin = 0)', () => {
    const req = { user: { id: 1, is_admin: 0 } } as AuthRequest;
    const res = mkRes();
    const next = jest.fn();
    adminMiddleware(req, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Admin jogosultság szükséges!' });
    expect(next).not.toHaveBeenCalled();
  });

  it('next() hívódik, ha a user admin (is_admin = 1)', () => {
    const req = { user: { id: 1, is_admin: 1 } } as AuthRequest;
    const res = mkRes();
    const next = jest.fn();
    adminMiddleware(req, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
