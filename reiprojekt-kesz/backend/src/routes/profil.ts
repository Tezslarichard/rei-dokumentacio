import { Router, Response } from 'express';
import { db, dbGet } from '../db/pool';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Profil lekérése
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const felhasznalo = await dbGet<any>(
      'SELECT id, name, email, is_admin, created_at FROM felhasznalok WHERE id = ?',
      [req.user.id]
    );
    if (!felhasznalo) { res.status(404).json({ error: 'Felhasználó nem található!' }); return; }
    res.json(felhasznalo);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Profil frissítése
router.put('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;
    if (!name || !email) { res.status(400).json({ error: 'A név és az e-mail megadása kötelező!' }); return; }

    await db.query('UPDATE felhasznalok SET name = ?, email = ? WHERE id = ?', [name, email, userId]);

    const frissitett = await dbGet<any>(
      'SELECT id, name, email, is_admin, created_at FROM felhasznalok WHERE id = ?',
      [userId]
    );
    res.json({ success: true, message: 'Profil sikeresen frissítve!', felhasznalo: frissitett });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') { res.status(409).json({ error: 'Ez az e-mail cím már használatban van!' }); return; }
    console.error(err); res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
