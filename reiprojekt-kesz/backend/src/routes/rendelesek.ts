import { Router, Request, Response } from 'express';
import { db, dbAll, dbGet } from '../db/pool';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Saját rendelések (tételekkel együtt)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rendelesek = await dbAll<any>(
      'SELECT * FROM rendeles WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    // Minden rendeléshez lekérjük a tételeket
    for (const r of rendelesek) {
      r.tetelek = await dbAll(
        `SELECT rt.id, rt.quantity, rt.unit_price, t.name, t.color, t.image_url
         FROM rendeles_tetel rt
         JOIN termekek t ON rt.termek_id = t.id
         WHERE rt.rendeles_id = ?`,
        [r.id]
      );
    }

    res.json(rendelesek);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Rendelés leadása
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const kosarTetelek = await dbAll<any>(
      `SELECT k.termek_id, k.mennyiseg, t.price, t.name, t.stock
       FROM kosar k JOIN termekek t ON k.termek_id = t.id
       WHERE k.felhasznalo_id = ?`,
      [userId]
    );
    if (kosarTetelek.length === 0) { res.status(400).json({ error: 'A kosár üres!' }); return; }

    // Ellenőrizzük a készletet minden tételnél
    for (const tetel of kosarTetelek) {
      if (tetel.mennyiseg > tetel.stock) {
        res.status(400).json({ error: `Nincs elegendő készlet: ${tetel.name} (Max: ${tetel.stock} db)` });
        return;
      }
    }

    const osszeg = kosarTetelek.reduce((sum: number, t: any) => {
      const ar = parseInt(t.price.replace(/\D/g, ''), 10) || 0;
      return sum + ar * t.mennyiseg;
    }, 0);
    const total_amount = `${osszeg.toLocaleString('hu-HU')} Ft`;

    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
      const [rendelesResult]: any = await conn.query(
        'INSERT INTO rendeles (user_id, total_amount, status) VALUES (?, ?, ?)',
        [userId, total_amount, 'pending']
      );
      const rendelesId = rendelesResult.insertId;
      for (const tetel of kosarTetelek) {
        await conn.query(
          'INSERT INTO rendeles_tetel (rendeles_id, termek_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
          [rendelesId, tetel.termek_id, tetel.mennyiseg, tetel.price]
        );
        await conn.query('UPDATE termekek SET stock = stock - ? WHERE id = ?', [tetel.mennyiseg, tetel.termek_id]);
      }
      await conn.query('DELETE FROM kosar WHERE felhasznalo_id = ?', [userId]);
      await conn.commit();
      conn.release();
      res.status(201).json({ success: true, message: 'Rendelés sikeresen leadva!', rendeles_id: rendelesId });
    } catch (e) { await conn.rollback(); conn.release(); throw e; }
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// --- ADMIN ---

// Összes rendelés (admin)
router.get('/admin/osszes', authMiddleware, adminMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const rendelesek = await dbAll<any>(
      `SELECT r.*, f.name as felhasznalo_nev, f.email as felhasznalo_email
       FROM rendeles r
       LEFT JOIN felhasznalok f ON r.user_id = f.id
       ORDER BY r.created_at DESC`
    );
    for (const r of rendelesek) {
      r.tetelek = await dbAll(
        `SELECT rt.id, rt.quantity, rt.unit_price, t.name, t.color
         FROM rendeles_tetel rt
         JOIN termekek t ON rt.termek_id = t.id
         WHERE rt.rendeles_id = ?`,
        [r.id]
      );
    }
    res.json(rendelesek);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Rendelés státusz frissítése (admin)
router.put('/admin/:id/statusz', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    const ervenyes = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!ervenyes.includes(status)) {
      res.status(400).json({ error: 'Érvénytelen státusz! Lehetséges értékek: ' + ervenyes.join(', ') });
      return;
    }
    const rendeles = await dbGet<any>('SELECT id FROM rendeles WHERE id = ?', [id]);
    if (!rendeles) { res.status(404).json({ error: 'Rendelés nem található!' }); return; }
    await db.query('UPDATE rendeles SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: 'Státusz frissítve!' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
