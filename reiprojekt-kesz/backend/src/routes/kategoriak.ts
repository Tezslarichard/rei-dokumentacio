import { Router, Request, Response } from 'express';
import { db, dbAll, dbGet } from '../db/pool';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await dbAll('SELECT * FROM kategoria ORDER BY id ASC');
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ADMIN: Kategória létrehozása
router.post('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, slug } = req.body;
    if (!name) { res.status(400).json({ error: 'A név megadása kötelező!' }); return; }
    const generaltSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[áéíóöőúüű]/g, (c: string) =>
      ({ á:'a', é:'e', í:'i', ó:'o', ö:'o', ő:'o', ú:'u', ü:'u', ű:'u' }[c] || c)
    );
    const [result]: any = await db.query('INSERT INTO kategoria (name, slug) VALUES (?, ?)', [name, generaltSlug]);
    const kat = await dbGet('SELECT * FROM kategoria WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, kategoria: kat });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') { res.status(409).json({ error: 'Ez a kategória már létezik!' }); return; }
    console.error(err); res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN: Kategória szerkesztése
router.put('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { name, slug } = req.body;
    if (!name) { res.status(400).json({ error: 'A név megadása kötelező!' }); return; }
    await db.query('UPDATE kategoria SET name=?, slug=? WHERE id=?', [name, slug || null, id]);
    const kat = await dbGet('SELECT * FROM kategoria WHERE id = ?', [id]);
    res.json({ success: true, kategoria: kat });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ADMIN: Kategória törlése
router.delete('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await db.query('DELETE FROM kategoria WHERE id = ?', [id]);
    res.json({ success: true, message: 'Kategória törölve!' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
