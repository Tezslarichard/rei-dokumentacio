import { Router, Response } from 'express';
import { db, dbAll, dbGet } from '../db/pool';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Kosár lekérése
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tetelek = await dbAll(
      `SELECT k.id, k.termek_id, k.mennyiseg, t.name, t.price, t.color, t.image_url, t.stock
       FROM kosar k JOIN termekek t ON k.termek_id = t.id
       WHERE k.felhasznalo_id = ?`,
      [req.user.id]
    );
    res.json(tetelek);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Kosárba helyezés
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { termek_id, mennyiseg = 1 } = req.body;
    if (!termek_id) { res.status(400).json({ error: 'A termék ID megadása kötelező!' }); return; }
    const termek = await dbGet<any>('SELECT * FROM termekek WHERE id = ?', [termek_id]);
    if (!termek) { res.status(404).json({ error: 'A termék nem található!' }); return; }
    const meglevo = await dbGet<any>('SELECT * FROM kosar WHERE felhasznalo_id = ? AND termek_id = ?', [userId, termek_id]);
    if (meglevo) {
      const ujMennyiseg = meglevo.mennyiseg + mennyiseg;
      if (ujMennyiseg > termek.stock) { res.status(400).json({ error: `Nincs elegendő készlet! (Max: ${termek.stock} db)` }); return; }
      await db.query('UPDATE kosar SET mennyiseg = ? WHERE id = ?', [ujMennyiseg, meglevo.id]);
    } else {
      if (mennyiseg > termek.stock) { res.status(400).json({ error: `Nincs elegendő készlet! (Max: ${termek.stock} db)` }); return; }
      await db.query('INSERT INTO kosar (felhasznalo_id, termek_id, mennyiseg) VALUES (?, ?, ?)', [userId, termek_id, mennyiseg]);
    }
    res.json({ success: true, message: 'Termék hozzáadva a kosárhoz!' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Mennyiség frissítése
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const kosarId = Number(req.params.id);
    const { mennyiseg } = req.body;
    if (!mennyiseg || mennyiseg < 1) { res.status(400).json({ error: 'Érvénytelen mennyiség!' }); return; }
    const tetel = await dbGet<any>(
      'SELECT k.*, t.stock FROM kosar k JOIN termekek t ON k.termek_id = t.id WHERE k.id = ? AND k.felhasznalo_id = ?',
      [kosarId, userId]
    );
    if (!tetel) { res.status(404).json({ error: 'Kosárelem nem található!' }); return; }
    if (mennyiseg > tetel.stock) { res.status(400).json({ error: `Nincs elegendő készlet! (Max: ${tetel.stock} db)` }); return; }
    await db.query('UPDATE kosar SET mennyiseg = ? WHERE id = ? AND felhasznalo_id = ?', [mennyiseg, kosarId, userId]);
    res.json({ success: true, message: 'Mennyiség frissítve!' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Tétel törlése
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await db.query('DELETE FROM kosar WHERE id = ? AND felhasznalo_id = ?', [Number(req.params.id), req.user.id]);
    res.json({ success: true, message: 'Termék eltávolítva!' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Kosár ürítése
router.delete('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await db.query('DELETE FROM kosar WHERE felhasznalo_id = ?', [req.user.id]);
    res.json({ success: true, message: 'Kosár kiürítve!' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
