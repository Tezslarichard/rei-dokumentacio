import { Router, Request, Response } from 'express';
import { db, dbAll, dbGet } from '../db/pool';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Minden route admin védett
router.use(authMiddleware, adminMiddleware);

// Összes felhasználó
router.get('/felhasznalok', async (_req: Request, res: Response): Promise<void> => {
  try {
    const felhasznalok = await dbAll(
      'SELECT id, name, email, is_admin, created_at FROM felhasznalok ORDER BY created_at DESC'
    );
    res.json(felhasznalok);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Felhasználó admin jogosultság toggle
router.put('/felhasznalok/:id/admin', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    // Saját magát nem módosíthatja
    if (id === req.user.id) {
      res.status(400).json({ error: 'Saját admin jogosultságát nem módosíthatja!' });
      return;
    }
    const fh = await dbGet<any>('SELECT id, is_admin FROM felhasznalok WHERE id = ?', [id]);
    if (!fh) { res.status(404).json({ error: 'Felhasználó nem található!' }); return; }
    const ujErtek = fh.is_admin === 1 ? 0 : 1;
    await db.query('UPDATE felhasznalok SET is_admin = ? WHERE id = ?', [ujErtek, id]);
    res.json({ success: true, is_admin: ujErtek });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Felhasználó törlése
router.delete('/felhasznalok/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (id === req.user.id) {
      res.status(400).json({ error: 'Saját fiókját nem törölheti!' });
      return;
    }
    await db.query('DELETE FROM felhasznalok WHERE id = ?', [id]);
    res.json({ success: true, message: 'Felhasználó törölve!' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Dashboard összesítő
router.get('/dashboard', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [[felhasznalokSzama]]: any = await db.query('SELECT COUNT(*) as db FROM felhasznalok');
    const [[termekekSzama]]: any = await db.query('SELECT COUNT(*) as db FROM termekek');
    const [[rendelesekSzama]]: any = await db.query('SELECT COUNT(*) as db FROM rendeles');
    const [[hirlevelSzama]]: any = await db.query('SELECT COUNT(*) as db FROM hirlevel_feliratkozas');
    const [[uzenetekSzama]]: any = await db.query('SELECT COUNT(*) as db FROM kapcsolat_uzenet');
    const legujabbRendelesek = await dbAll(
      `SELECT r.id, r.total_amount, r.status, r.created_at, f.name as felhasznalo_nev
       FROM rendeles r LEFT JOIN felhasznalok f ON r.user_id = f.id
       ORDER BY r.created_at DESC LIMIT 5`
    );
    res.json({
      felhasznalok: felhasznalokSzama.db,
      termekek: termekekSzama.db,
      rendelesek: rendelesekSzama.db,
      hirlevel_feliratkozasok: hirlevelSzama.db,
      kapcsolat_uzenetek: uzenetekSzama.db,
      legujabb_rendelesek: legujabbRendelesek,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Kapcsolat üzenetek listája
router.get('/uzenetek', async (_req: Request, res: Response): Promise<void> => {
  try {
    const uzenetek = await dbAll('SELECT * FROM kapcsolat_uzenet ORDER BY created_at DESC');
    res.json(uzenetek);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Hírlevél feliratkozók
router.get('/hirlevel', async (_req: Request, res: Response): Promise<void> => {
  try {
    const lista = await dbAll('SELECT * FROM hirlevel_feliratkozas ORDER BY created_at DESC');
    res.json(lista);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
