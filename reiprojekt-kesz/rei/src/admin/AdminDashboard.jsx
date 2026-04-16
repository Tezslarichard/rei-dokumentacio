import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';

export default function AdminDashboard({ token }) {
  const [adatok, setAdatok] = useState(null);
  const [betolt, setBetolt] = useState(true);

  useEffect(() => {
    fetch(`${API}/admin/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setAdatok(d); setBetolt(false); })
      .catch(() => setBetolt(false));
  }, [token]);

  const statuszNev = (s) => ({
    pending: 'Feldolgozás alatt', processing: 'Folyamatban',
    shipped: 'Elküldve', delivered: 'Teljesítve', cancelled: 'Törölve'
  }[s] || s);

  if (betolt) return <p className="admin-betoltes">Betöltés...</p>;
  if (!adatok) return <p className="admin-betoltes">Nem sikerült betölteni az adatokat.</p>;

  return (
    <div>
      <div className="dashboard-grid">
        <div className="dashboard-kartya">
          <div className="dashboard-kartya-szam szin-zold">{adatok.felhasznalok}</div>
          <div className="dashboard-kartya-cimke">Felhasználók</div>
        </div>
        <div className="dashboard-kartya">
          <div className="dashboard-kartya-szam szin-lila">{adatok.termekek}</div>
          <div className="dashboard-kartya-cimke">Termékek</div>
        </div>
        <div className="dashboard-kartya">
          <div className="dashboard-kartya-szam szin-kek">{adatok.rendelesek}</div>
          <div className="dashboard-kartya-cimke">Rendelések</div>
        </div>
        <div className="dashboard-kartya">
          <div className="dashboard-kartya-szam szin-sarga">{adatok.hirlevel_feliratkozasok}</div>
          <div className="dashboard-kartya-cimke">Hírlevél</div>
        </div>
        <div className="dashboard-kartya">
          <div className="dashboard-kartya-szam szin-piros">{adatok.kapcsolat_uzenetek}</div>
          <div className="dashboard-kartya-cimke">Üzenetek</div>
        </div>
      </div>

      <h2 style={{ fontSize: 14, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
        Legújabb rendelések
      </h2>
      <div className="admin-tabla-wrap">
        <table className="admin-tabla">
          <thead>
            <tr>
              <th>#</th>
              <th>Felhasználó</th>
              <th>Összeg</th>
              <th>Státusz</th>
              <th>Dátum</th>
            </tr>
          </thead>
          <tbody>
            {adatok.legujabb_rendelesek.map(r => (
              <tr key={r.id} className="legujabb-rendeles-sor">
                <td>#{r.id}</td>
                <td>{r.felhasznalo_nev || '—'}</td>
                <td>{r.total_amount}</td>
                <td><span className={`statusz-badge statusz-${r.status}`}>{statuszNev(r.status)}</span></td>
                <td>{new Date(r.created_at).toLocaleDateString('hu-HU')}</td>
              </tr>
            ))}
            {adatok.legujabb_rendelesek.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#444', padding: 32 }}>Még nincs rendelés</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
