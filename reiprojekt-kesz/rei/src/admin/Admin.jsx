import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import AdminTermekek from './AdminTermekek';
import AdminKategoriak from './AdminKategoriak';
import AdminRendelesek from './AdminRendelesek';
import AdminFelhasznalok from './AdminFelhasznalok';
import AdminUzenetek from './AdminUzenetek';
import './admin.css';

const MENU = [
  { id: 'dashboard',    nev: 'Dashboard',      ikon: '📊' },
  { id: 'termekek',     nev: 'Termékek',       ikon: '👕' },
  { id: 'kategoriak',   nev: 'Kategóriák',     ikon: '🏷️' },
  { id: 'rendelesek',   nev: 'Rendelések',     ikon: '📦' },
  { id: 'felhasznalok', nev: 'Felhasználók',   ikon: '👥' },
  { id: 'uzenetek',     nev: 'Üzenetek',       ikon: '✉️' },
];

const OLDALCIMEK = {
  dashboard: 'Dashboard',
  termekek: 'Termékek kezelése',
  kategoriak: 'Kategóriák kezelése',
  rendelesek: 'Rendelések',
  felhasznalok: 'Felhasználók',
  uzenetek: 'Kapcsolat üzenetek',
};

export default function Admin() {
  const { felhasznalo, token, kijelentkezes } = useAuth();
  const navigate = useNavigate();
  const [aktiv, setAktiv] = useState('dashboard');

  // Csak admin láthatja
  if (!felhasznalo) {
    navigate('/bejelentkezes');
    return null;
  }
  if (felhasznalo.is_admin !== 1) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontSize: 48 }}>🚫</div>
        <h1 style={{ color: '#ff3333', margin: 0 }}>Hozzáférés megtagadva</h1>
        <p style={{ color: '#555' }}>Nincs admin jogosultságod.</p>
        <button className="admin-gomb admin-gomb-masodlagos" onClick={() => navigate('/')}>Vissza a főoldalra</button>
      </div>
    );
  }

  const renderTartalom = () => {
    const kozos = { token };
    switch (aktiv) {
      case 'dashboard':    return <AdminDashboard {...kozos} />;
      case 'termekek':     return <AdminTermekek {...kozos} />;
      case 'kategoriak':   return <AdminKategoriak {...kozos} />;
      case 'rendelesek':   return <AdminRendelesek {...kozos} />;
      case 'felhasznalok': return <AdminFelhasznalok {...kozos} />;
      case 'uzenetek':     return <AdminUzenetek {...kozos} />;
      default:             return null;
    }
  };

  return (
    <div className="admin-oldal">
      {/* Oldalsáv */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">REI ADMIN</div>

        <div className="admin-sidebar-cimke">Navigáció</div>
        {MENU.map(m => (
          <button
            key={m.id}
            className={`admin-nav-gomb ${aktiv === m.id ? 'aktiv' : ''}`}
            onClick={() => setAktiv(m.id)}
          >
            <span className="ikon">{m.ikon}</span>
            {m.nev}
          </button>
        ))}

        <div className="admin-sidebar-lap">
          <div style={{ fontSize: 11, color: '#444', marginBottom: 8 }}>
            Bejelentkezve:<br />
            <span style={{ color: '#666' }}>{felhasznalo.name}</span>
          </div>
          <Link to="/" className="admin-vissza-gomb">← Vissza a webshopra</Link>
        </div>
      </aside>

      {/* Fő tartalom */}
      <main className="admin-tartalom">
        <div className="admin-oldal-fejlec">
          <h1>{OLDALCIMEK[aktiv]}</h1>
        </div>
        {renderTartalom()}
      </main>
    </div>
  );
}
