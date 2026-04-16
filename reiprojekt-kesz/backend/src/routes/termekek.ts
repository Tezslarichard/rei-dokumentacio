import { Router, Request, Response } from 'express';
import { db, dbAll, dbGet } from '../db/pool';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Összes termék (szűrőkkel)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { kategoria_id, kereses, min_ar, max_ar, rendez } = req.query as Record<string, string>;
    let sql = `SELECT t.*, k.name as kategoria_nev FROM termekek t LEFT JOIN kategoria k ON t.kategoria_id = k.id WHERE 1=1`;
    const params: any[] = [];

    if (kategoria_id) { sql += ' AND t.kategoria_id = ?'; params.push(kategoria_id); }
    if (kereses) {
      sql += ' AND (t.name LIKE ? OR t.description LIKE ?)';
      params.push(`%${kereses}%`, `%${kereses}%`);
    }
    if (min_ar) {
      sql += ' AND CAST(REPLACE(REPLACE(t.price, " Ft", ""), " ", "") AS UNSIGNED) >= ?';
      params.push(Number(min_ar));
    }
    if (max_ar) {
      sql += ' AND CAST(REPLACE(REPLACE(t.price, " Ft", ""), " ", "") AS UNSIGNED) <= ?';
      params.push(Number(max_ar));
    }
    const rendezMap: Record<string, string> = {
      ar_nov: 'CAST(REPLACE(REPLACE(t.price," Ft","")," ","") AS UNSIGNED) ASC',
      ar_csokkeno: 'CAST(REPLACE(REPLACE(t.price," Ft","")," ","") AS UNSIGNED) DESC',
      nev: 't.name ASC',
      legujabb: 't.created_at DESC',
    };
    sql += rendez && rendezMap[rendez] ? ` ORDER BY ${rendezMap[rendez]}` : ' ORDER BY t.id ASC';

    const rows = await dbAll(sql, params);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Egy termék
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }
    const row = await dbGet(
      `SELECT t.*, k.name as kategoria_nev FROM termekek t LEFT JOIN kategoria k ON t.kategoria_id = k.id WHERE t.id = ?`,
      [id]
    );
    if (!row) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ADMIN: Termék létrehozása
router.post('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, price, color, description, kategoria_id, image_url, stock } = req.body;
    if (!name || !price) { res.status(400).json({ error: 'A név és az ár megadása kötelező!' }); return; }
    const [result]: any = await db.query(
      'INSERT INTO termekek (name, price, color, description, kategoria_id, image_url, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, price, color || null, description || null, kategoria_id || null, image_url || null, stock ?? 0]
    );
    const termek = await dbGet('SELECT t.*, k.name as kategoria_nev FROM termekek t LEFT JOIN kategoria k ON t.kategoria_id = k.id WHERE t.id = ?', [result.insertId]);
    res.status(201).json({ success: true, termek });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ADMIN: Termék szerkesztése
router.put('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }
    const { name, price, color, description, kategoria_id, image_url, stock } = req.body;
    if (!name || !price) { res.status(400).json({ error: 'A név és az ár megadása kötelező!' }); return; }
    await db.query(
      'UPDATE termekek SET name=?, price=?, color=?, description=?, kategoria_id=?, image_url=?, stock=? WHERE id=?',
      [name, price, color || null, description || null, kategoria_id || null, image_url || null, stock ?? 0, id]
    );
    const termek = await dbGet('SELECT t.*, k.name as kategoria_nev FROM termekek t LEFT JOIN kategoria k ON t.kategoria_id = k.id WHERE t.id = ?', [id]);
    res.json({ success: true, termek });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ADMIN: Termék törlése
router.delete('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }
    await db.query('DELETE FROM termekek WHERE id = ?', [id]);
    res.json({ success: true, message: 'Termék törölve!' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
