import { useState, useEffect } from 'react';

const API = 'http://localhost:5000/api';

export default function AdminKategoriak({ token }) {
  const [kategoriak, setKategoriak] = useState([]);
  const [betolt, setBetolt] = useState(true);
  const [modal, setModal] = useState(null);
  const [kivalasztott, setKivalasztott] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '' });
  const [hiba, setHiba] = useState('');
  const [ment, setMent] = useState(false);

  const betoltes = async () => {
    setBetolt(true);
    const res = await fetch(`${API}/kategoriak`);
    const data = await res.json();
    setKategoriak(Array.isArray(data) ? data : []);
    setBetolt(false);
  };

  useEffect(() => { betoltes(); }, []);

  const ujMegnyit = () => { setForm({ name: '', slug: '' }); setHiba(''); setModal('uj'); };
  const szerkesztMegnyit = (k) => {
    setKivalasztott(k);
    setForm({ name: k.name, slug: k.slug || '' });
    setHiba('');
    setModal('szerkeszt');
  };

  const ment_kuldese = async () => {
    setHiba(''); setMent(true);
    try {
      const url = modal === 'uj' ? `${API}/kategoriak` : `${API}/kategoriak/${kivalasztott.id}`;
      const method = modal === 'uj' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setHiba(data.error || 'Hiba!'); return; }
      setModal(null);
      betoltes();
    } catch { setHiba('Szerverhiba!'); }
    finally { setMent(false); }
  };

  const torol = async (id) => {
    if (!confirm('Biztosan törlöd ezt a kategóriát? A hozzá tartozó termékek kategória nélkül maradnak.')) return;
    await fetch(`${API}/kategoriak/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    betoltes();
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <button className="admin-gomb admin-gomb-elsodleges" onClick={ujMegnyit}>+ Új kategória</button>
      </div>

      {betolt ? <p className="admin-betoltes">Betöltés...</p> : (
        <div className="admin-tabla-wrap">
          <table className="admin-tabla">
            <thead>
              <tr><th>#</th><th>Név</th><th>Slug</th><th>Műveletek</th></tr>
            </thead>
            <tbody>
              {kategoriak.map(k => (
                <tr key={k.id}>
                  <td style={{ color: '#444' }}>{k.id}</td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{k.name}</td>
                  <td style={{ color: '#555', fontFamily: 'monospace', fontSize: 12 }}>{k.slug || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="admin-gomb admin-gomb-masodlagos admin-gomb-kis" onClick={() => szerkesztMegnyit(k)}>Szerkesztés</button>
                      <button className="admin-gomb admin-gomb-veszelyes admin-gomb-kis" onClick={() => torol(k.id)}>Törlés</button>
                    </div>
                  </td>
                </tr>
              ))}
              {kategoriak.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#444', padding: 32 }}>Nincs kategória</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-hatter" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-doboz">
            <h2>{modal === 'uj' ? 'Új kategória' : 'Kategória szerkesztése'}</h2>
            {hiba && <div className="admin-hiba">{hiba}</div>}
            <div className="modal-mezo">
              <label>Név *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Pl. Pólók" />
            </div>
            <div className="modal-mezo">
              <label>Slug (üresen hagyva automatikus)</label>
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="pl. polok" />
            </div>
            <div className="modal-gombok">
              <button className="admin-gomb admin-gomb-masodlagos" onClick={() => setModal(null)}>Mégse</button>
              <button className="admin-gomb admin-gomb-elsodleges" onClick={ment_kuldese} disabled={ment}>
                {ment ? 'Mentés...' : 'Mentés'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
