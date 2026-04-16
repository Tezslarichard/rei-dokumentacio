import { useState, useEffect } from 'react';

const API = 'http://localhost:5000/api';

const STATUSOK = [
  { ertek: 'pending',    nev: 'Feldolgozás alatt', osztaly: 'statusz-pending' },
  { ertek: 'processing', nev: 'Folyamatban',        osztaly: 'statusz-processing' },
  { ertek: 'shipped',    nev: 'Elküldve',           osztaly: 'statusz-shipped' },
  { ertek: 'delivered',  nev: 'Teljesítve',         osztaly: 'statusz-delivered' },
  { ertek: 'cancelled',  nev: 'Törölve',            osztaly: 'statusz-cancelled' },
];

const statuszNev = (s) => STATUSOK.find(x => x.ertek === s)?.nev || s;

export default function AdminRendelesek({ token }) {
  const [rendelesek, setRendelesek] = useState([]);
  const [betolt, setBetolt] = useState(true);
  const [kereses, setKereses] = useState('');
  const [szuroStatusz, setSzuroStatusz] = useState('');
  const [nyitott, setNyitott] = useState(null);
  const [frissit, setFrissit] = useState({});

  const betoltes = async () => {
    setBetolt(true);
    try {
      const res = await fetch(`${API}/rendelesek/admin/osszes`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setRendelesek(Array.isArray(data) ? data : []);
    } catch { setRendelesek([]); }
    finally { setBetolt(false); }
  };

  useEffect(() => { betoltes(); }, [token]);

  const statuszFrissit = async (id, ujStatusz) => {
    setFrissit(f => ({ ...f, [id]: true }));
    try {
      await fetch(`${API}/rendelesek/admin/${id}/statusz`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: ujStatusz }),
      });
      setRendelesek(r => r.map(x => x.id === id ? { ...x, status: ujStatusz } : x));
    } catch { alert('Hiba a státusz frissítésekor!'); }
    finally { setFrissit(f => ({ ...f, [id]: false })); }
  };

  const szurt = rendelesek.filter(r => {
    const keresesOk = !kereses ||
      String(r.id).includes(kereses) ||
      (r.felhasznalo_nev || '').toLowerCase().includes(kereses.toLowerCase()) ||
      (r.felhasznalo_email || '').toLowerCase().includes(kereses.toLowerCase());
    const statuszOk = !szuroStatusz || r.status === szuroStatusz;
    return keresesOk && statuszOk;
  });

  return (
    <div>
      <div className="admin-fejlec-eszkozok" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <input className="admin-kereses" placeholder="Keresés (ID, név, email)..." value={kereses} onChange={e => setKereses(e.target.value)} />
        <select className="statusz-select" style={{ padding: '9px 12px', fontSize: 12 }} value={szuroStatusz} onChange={e => setSzuroStatusz(e.target.value)}>
          <option value="">Összes státusz</option>
          {STATUSOK.map(s => <option key={s.ertek} value={s.ertek}>{s.nev}</option>)}
        </select>
      </div>

      {betolt ? <p className="admin-betoltes">Betöltés...</p> : (
        <div className="admin-tabla-wrap">
          <table className="admin-tabla">
            <thead>
              <tr>
                <th>#</th><th>Felhasználó</th><th>Összeg</th><th>Tételek</th><th>Státusz</th><th>Dátum</th>
              </tr>
            </thead>
            <tbody>
              {szurt.map(r => (
                <>
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setNyitott(nyitott === r.id ? null : r.id)}>
                    <td style={{ fontWeight: 700, color: '#fff' }}>#{r.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{r.felhasznalo_nev || '—'}</div>
                      <div style={{ fontSize: 11, color: '#555' }}>{r.felhasznalo_email}</div>
                    </td>
                    <td style={{ color: '#00ff00', fontWeight: 600 }}>{r.total_amount}</td>
                    <td style={{ color: '#666', fontSize: 12 }}>{r.tetelek?.length || 0} tétel</td>
                    <td onClick={e => e.stopPropagation()}>
                      <select
                        className="statusz-select"
                        value={r.status}
                        disabled={frissit[r.id]}
                        onChange={e => statuszFrissit(r.id, e.target.value)}
                      >
                        {STATUSOK.map(s => <option key={s.ertek} value={s.ertek}>{s.nev}</option>)}
                      </select>
                    </td>
                    <td style={{ color: '#666', fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString('hu-HU')}</td>
                  </tr>
                  {nyitott === r.id && r.tetelek?.length > 0 && (
                    <tr key={`${r.id}-tetelek`}>
                      <td colSpan={6} style={{ background: '#080808', padding: '12px 20px' }}>
                        <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                          Rendelés tételei
                        </div>
                        <div className="rendeles-tetelek">
                          {r.tetelek.map(t => (
                            <div key={t.id} className="rendeles-tetel-sor">
                              <span className="rendeles-tetel-szin" style={{ background: t.color || '#333' }} />
                              <span style={{ color: '#ccc', fontWeight: 600 }}>{t.name}</span>
                              <span style={{ color: '#555' }}>×{t.quantity}</span>
                              <span style={{ color: '#00ff00', marginLeft: 'auto' }}>{t.unit_price}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
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
