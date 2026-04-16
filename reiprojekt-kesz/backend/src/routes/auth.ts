import { Router, Request, Response } from 'express';
import { db, dbGet } from '../db/pool';
import { sha256, generateToken } from '../config';

const router = Router();

// Regisztráció
router.post('/regisztracio', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) { res.status(400).json({ error: 'Minden mező kitöltése kötelező!' }); return; }
    if (password.length < 6) { res.status(400).json({ error: 'A jelszónak legalább 6 karakter hosszúnak kell lennie!' }); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { res.status(400).json({ error: 'Érvénytelen e-mail cím!' }); return; }

    const password_hash = sha256(password);
    const [result]: any = await db.query(
      'INSERT INTO felhasznalok (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, password_hash]
    );
    const felhasznalo = { id: result.insertId, name, email, is_admin: 0 };
    const token = generateToken({ id: felhasznalo.id, email, is_admin: 0 });
    res.status(201).json({ success: true, message: 'Sikeres regisztráció!', token, felhasznalo });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') { res.status(409).json({ error: 'Ez az e-mail cím már regisztrálva van!' }); return; }
    console.error(err); res.status(500).json({ error: 'Internal server error' });
  }
});

// Bejelentkezés
router.post('/bejelentkezes', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ error: 'Az e-mail cím és a jelszó megadása kötelező!' }); return; }
    const password_hash = sha256(password);
    const felhasznalo = await dbGet<any>(
      'SELECT id, name, email, is_admin, created_at FROM felhasznalok WHERE email = ? AND password_hash = ?',
      [email, password_hash]
    );
    if (!felhasznalo) { res.status(401).json({ error: 'Hibás e-mail cím vagy jelszó!' }); return; }
    const token = generateToken({ id: felhasznalo.id, email: felhasznalo.email, is_admin: felhasznalo.is_admin });
    res.json({ success: true, message: 'Sikeres bejelentkezés!', token, felhasznalo });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
