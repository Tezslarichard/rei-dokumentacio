import { sha256, generateToken, JWT_SECRET } from '../src/config';
import jwt from 'jsonwebtoken';

describe('config - sha256', () => {
  it('ugyanarra a bemenetre ugyanazt a hash-t adja', () => {
    expect(sha256('titok123')).toBe(sha256('titok123'));
  });

  it('különböző bemenetre különböző hash', () => {
    expect(sha256('a')).not.toBe(sha256('b'));
  });

  it('64 karakteres hex sztringet ad vissza (SHA-256)', () => {
    const hash = sha256('teszt');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('üres sztringre is helyesen működik', () => {
    const hash = sha256('');
    expect(hash).toHaveLength(64);
  });
});

describe('config - generateToken', () => {
  it('érvényes JWT tokent ad vissza', () => {
    const token = generateToken({ id: 1, email: 'a@b.hu', is_admin: 0 });
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('a token dekódolható a JWT_SECRET-tel', () => {
    const payload = { id: 42, email: 'x@y.hu', is_admin: 1 };
    const token = generateToken(payload);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    expect(decoded.id).toBe(42);
    expect(decoded.email).toBe('x@y.hu');
    expect(decoded.is_admin).toBe(1);
  });

  it('rossz secret-tel nem ellenőrizhető', () => {
    const token = generateToken({ id: 1 });
    expect(() => jwt.verify(token, 'rossz_secret')).toThrow();
  });
});
