import { useState, useEffect } from 'react';

const API = 'http://localhost:5000/api';

const URES_FORM = { name: '', price: '', color: '#000000', description: '', kategoria_id: '', image_url: '', stock: 0 };

export default function AdminTermekek({ token }) {
  const [termekek, setTermekek] = useState([]);
  const [kategoriak, setKategoriak] = useState([]);
  const [betolt, setBetolt] = useState(true);
  const [modal, setModal] = useState(null); // null | 'uj' | 'szerkeszt'
  const [kivalasztott, setKivalasztott] = useState(null);
  const [form, setForm] = useState(URES_FORM);
  const [hiba, setHiba] = useState('');
  const [ment, setMent] = useState(false);
  const [kereses, setKereses] = useState('');

  const betoltes = async () => {
    setBetolt(true);
    const [t, k] = await Promise.all([
      fetch(`${API}/termekek`).then(r => r.json()),
      fetch(`${API}/kategoriak`).then(r => r.json()),
    ]);
    setTermekek(Array.isArray(t) ? t : []);
    setKategoriak(Array.isArray(k) ? k : []);
    setBetolt(false);
  };

  useEffect(() => { betoltes(); }, []);

  const ujMegnyit = () => { setForm(URES_FORM); setHiba(''); setModal('uj'); };
  const szerkesztMegnyit = (t) => {
    setKivalasztott(t);
    setForm({
      name: t.name, price: t.price, color: t.color || '#000000',
      description: t.description || '', kategoria_id: t.kategoria_id || '',
      image_url: t.image_url || '', stock: t.stock ?? 0,
    });
    setHiba('');
    setModal('szerkeszt');
  };

  const ment_kuldese = async () => {
    setHiba(''); setMent(true);
    try {
      const url = modal === 'uj' ? `${API}/termekek` : `${API}/termekek/${kivalasztott.id}`;
      const method = modal === 'uj' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, stock: Number(form.stock), kategoria_id: form.kategoria_id || null }),
      });
      const data = await res.json();
      if (!res.ok) { setHiba(data.error || 'Hiba történt!'); return; }
      setModal(null);
      betoltes();
    } catch { setHiba('Nem sikerült csatlakozni a szerverhez!'); }
    finally { setMent(false); }
  };

  const torol = async (id) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a terméket?')) return;
    try {
      await fetch(`${API}/termekek/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      betoltes();
    } catch { alert('Hiba a törlés során!'); }
  };

  const szurt = termekek.filter(t =>
    !kereses || t.name.toLowerCase().includes(kereses.toLowerCase())
  );

  return (
    <div>
      <div className="admin-fejlec-eszkozok" style={{ marginBottom: 24 }}>
        <input className="admin-kereses" placeholder="Keresés..." value={kereses} onChange={e => setKereses(e.target.value)} />
        <button className="admin-gomb admin-gomb-elsodleges" onClick={ujMegnyit}>+ Új termék</button>
      </div>

      {betolt ? <p className="admin-betoltes">Betöltés...</p> : (
        <div className="admin-tabla-wrap">
          <table className="admin-tabla">
            <thead>
              <tr>
                <th>#</th><th>Szín</th><th>Név</th><th>Ár</th><th>Kategória</th><th>Készlet</th><th>Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {szurt.map(t => (
                <tr key={t.id}>
                  <td style={{ color: '#444' }}>{t.id}</td>
                  <td>
                    <div style={{ width: 20, height: 20, borderRadius: 4, background: t.color || '#333', border: '1px solid #333' }} />
                  </td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{t.name}</td>
                  <td>{t.price}</td>
                  <td>{t.kategoria_nev || <span style={{ color: '#444' }}>—</span>}</td>
                  <td>
                    <span style={{ color: t.stock < 3 ? '#ff3333' : t.stock < 10 ? '#ffcc00' : '#00ff00' }}>
                      {t.stock} db
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="admin-gomb admin-gomb-masodlagos admin-gomb-kis" onClick={() => szerkesztMegnyit(t)}>Szerkesztés</button>
                      <button className="admin-gomb admin-gomb-veszelyes admin-gomb-kis" onClick={() => torol(t.id)}>Törlés</button>
                    </div>
                  </td>
                </tr>
              ))}
              {szurt.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#444', padding: 32 }}>Nincs találat</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-hatter" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-doboz">
            <h2>{modal === 'uj' ? 'Új termék' : 'Termék szerkesztése'}</h2>
            {hiba && <div className="admin-hiba">{hiba}</div>}

            <div className="modal-mezo">
              <label>Név *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Pl. OVERSIZED PULÓVER" />
            </div>
            <div className="modal-mezo">
              <label>Ár *</label>
              <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="Pl. 19 990 Ft" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="modal-mezo">
                <label>Szín (hex)</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    style={{ width: 44, height: 40, padding: 2, cursor: 'pointer' }} />
                  <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    placeholder="#000000" style={{ flex: 1 }} />
                </div>
              </div>
              <div className="modal-mezo">
                <label>Készlet (db)</label>
                <input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
              </div>
            </div>
            <div className="modal-mezo">
              <label>Kategória</label>
              <select value={form.kategoria_id} onChange={e => setForm(f => ({ ...f, kategoria_id: e.target.value }))}>
                <option value="">— Nincs kategória —</option>
                {kategoriak.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
            </div>
            <div className="modal-mezo">
              <label>Leírás</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Termék leírása..." />
            </div>
            <div className="modal-mezo">
              <label>Kép URL</label>
              <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
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
