import { Router, Request, Response } from 'express';
import { db } from '../db/pool';

const router = Router();

// Hírlevél feliratkozás
router.post('/hirlevel', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: 'Email is required' }); return; }
    await db.query('INSERT INTO hirlevel_feliratkozas (email) VALUES (?)', [email]);
    res.json({ success: true, message: 'Sikeres feliratkozás!' });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') { res.status(409).json({ error: 'Ez az email cím már fel van iratkozva' }); return; }
    console.error(err); res.status(500).json({ error: 'Internal server error' });
  }
});

// Kapcsolat üzenet
router.post('/kapcsolat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) { res.status(400).json({ error: 'All fields are required' }); return; }
    await db.query(
      'INSERT INTO kapcsolat_uzenet (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject, message]
    );
    res.json({ success: true, message: 'Üzenet elküldve!' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
