import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';

export default function AdminFelhasznalok({ token }) {
  const { felhasznalo: sajatFh } = useAuth();
  const [felhasznalok, setFelhasznalok] = useState([]);
  const [betolt, setBetolt] = useState(true);
  const [kereses, setKereses] = useState('');
  const [muvelet, setMuvelet] = useState({});

  const betoltes = async () => {
    setBetolt(true);
    try {
      const res = await fetch(`${API}/admin/felhasznalok`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setFelhasznalok(Array.isArray(data) ? data : []);
    } catch { setFelhasznalok([]); }
    finally { setBetolt(false); }
  };

  useEffect(() => { betoltes(); }, [token]);

  const adminToggle = async (id) => {
    setMuvelet(m => ({ ...m, [id]: true }));
    try {
      await fetch(`${API}/admin/felhasznalok/${id}/admin`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setFelhasznalok(fl => fl.map(f => f.id === id ? { ...f, is_admin: f.is_admin === 1 ? 0 : 1 } : f));
    } catch { alert('Hiba!'); }
    finally { setMuvelet(m => ({ ...m, [id]: false })); }
  };

  const torol = async (id, nev) => {
    if (!confirm(`Biztosan törölni szeretnéd ${nev} fiókját?`)) return;
    setMuvelet(m => ({ ...m, [id]: true }));
    try {
      await fetch(`${API}/admin/felhasznalok/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setFelhasznalok(fl => fl.filter(f => f.id !== id));
    } catch { alert('Hiba a törlés során!'); }
    finally { setMuvelet(m => ({ ...m, [id]: false })); }
  };

  const szurt = felhasznalok.filter(f =>
    !kereses ||
    f.name?.toLowerCase().includes(kereses.toLowerCase()) ||
    f.email?.toLowerCase().includes(kereses.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <input className="admin-kereses" placeholder="Keresés (név, email)..." value={kereses} onChange={e => setKereses(e.target.value)} />
      </div>

      {betolt ? <p className="admin-betoltes">Betöltés...</p> : (
        <div className="admin-tabla-wrap">
          <table className="admin-tabla">
            <thead>
              <tr>
                <th>#</th><th>Név</th><th>E-mail</th><th>Jogosultság</th><th>Regisztrált</th><th>Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {szurt.map(f => (
                <tr key={f.id}>
                  <td style={{ color: '#444' }}>{f.id}</td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>
                    {f.name}
                    {f.id === sajatFh?.id && <span style={{ fontSize: 10, color: '#555', marginLeft: 8 }}>(te)</span>}
                  </td>
                  <td style={{ color: '#888' }}>{f.email}</td>
                  <td>
                    {f.is_admin === 1
                      ? <span className="admin-badge">Admin</span>
                      : <span style={{ color: '#444', fontSize: 12 }}>Felhasználó</span>
                    }
                  </td>
                  <td style={{ color: '#555', fontSize: 12 }}>{new Date(f.created_at).toLocaleDateString('hu-HU')}</td>
                  <td>
                    {f.id !== sajatFh?.id ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="admin-gomb admin-gomb-masodlagos admin-gomb-kis"
                          onClick={() => adminToggle(f.id)}
                          disabled={muvelet[f.id]}
                        >
                          {f.is_admin === 1 ? 'Admin elvesz' : 'Admin ad'}
                        </button>
                        <button
                          className="admin-gomb admin-gomb-veszelyes admin-gomb-kis"
                          onClick={() => torol(f.id, f.name)}
                          disabled={muvelet[f.id]}
                        >
                          Törlés
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: '#333', fontSize: 12 }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
              {szurt.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#444', padding: 32 }}>Nincs találat</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
