import { useState, useEffect } from 'react';

const API = 'http://localhost:5000/api';

export default function AdminUzenetek({ token }) {
  const [uzenetek, setUzenetek] = useState([]);
  const [betolt, setBetolt] = useState(true);
  const [kivalasztott, setKivalasztott] = useState(null);

  useEffect(() => {
    fetch(`${API}/admin/uzenetek`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setUzenetek(Array.isArray(d) ? d : []); setBetolt(false); })
      .catch(() => setBetolt(false));
  }, [token]);

  return (
    <div>
      {betolt ? <p className="admin-betoltes">Betöltés...</p> : (
        <div className="admin-tabla-wrap">
          <table className="admin-tabla">
            <thead>
              <tr><th>#</th><th>Név</th><th>E-mail</th><th>Tárgy</th><th>Üzenet</th><th>Dátum</th></tr>
            </thead>
            <tbody>
              {uzenetek.map(u => (
                <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => setKivalasztott(u)}>
                  <td style={{ color: '#444' }}>{u.id}</td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{u.name}</td>
                  <td style={{ color: '#888' }}>{u.email}</td>
                  <td style={{ color: '#ccc' }}>{u.subject}</td>
                  <td><div className="uzenet-szoveg">{u.message}</div></td>
                  <td style={{ color: '#555', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString('hu-HU')}</td>
                </tr>
              ))}
              {uzenetek.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#444', padding: 32 }}>Nincs üzenet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {kivalasztott && (
        <div className="modal-hatter" onClick={() => setKivalasztott(null)}>
          <div className="modal-doboz" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: 8 }}>{kivalasztott.subject}</h2>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 20 }}>
              {kivalasztott.name} — <span style={{ color: '#00ff00' }}>{kivalasztott.email}</span>
              <span style={{ marginLeft: 12 }}>{new Date(kivalasztott.created_at).toLocaleString('hu-HU')}</span>
            </div>
            <div style={{ background: '#111', borderRadius: 8, padding: 16, fontSize: 14, color: '#ccc', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {kivalasztott.message}
            </div>
            <div className="modal-gombok">
              <button className="admin-gomb admin-gomb-masodlagos" onClick={() => setKivalasztott(null)}>Bezárás</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
