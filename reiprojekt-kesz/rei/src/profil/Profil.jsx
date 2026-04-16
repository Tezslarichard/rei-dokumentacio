import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './profil.css';

const API = 'http://localhost:5000/api';

const STATUSZ_NEV = {
  pending:    'Feldolgozás alatt',
  processing: 'Folyamatban',
  shipped:    'Elküldve',
  delivered:  'Teljesítve',
  cancelled:  'Törölve',
};

export default function Profil() {
  const { felhasznalo, token, kijelentkezes, profilFrissites } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('adatok');

  // Adatok szerkesztése
  const [nev, setNev] = useState('');
  const [email, setEmail] = useState('');
  const [mentesHiba, setMentesHiba] = useState('');
  const [mentes, setMentes] = useState(false);
  const [mentes_siker, setMentes_siker] = useState('');

  // Rendelések
  const [rendelesek, setRendelesek] = useState([]);
  const [rendBetolt, setRendBetolt] = useState(false);
  const [rendHiba, setRendHiba] = useState('');
  const [nyitottRendeles, setNyitottRendeles] = useState(null);

  useEffect(() => {
    if (!felhasznalo) { navigate('/bejelentkezes'); return; }
    setNev(felhasznalo.name || '');
    setEmail(felhasznalo.email || '');
  }, [felhasznalo, navigate]);

  useEffect(() => {
    if (tab === 'rendelesek' && token) {
      setRendBetolt(true);
      setRendHiba('');
      fetch(`${API}/rendelesek`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(d => {
          if (Array.isArray(d)) { setRendelesek(d); }
          else { setRendHiba('Hiba a rendelések betöltésekor.'); }
          setRendBetolt(false);
        })
        .catch(() => { setRendHiba('Nem sikerült betölteni a rendeléseket.'); setRendBetolt(false); });
    }
  }, [tab, token]);

  const handleMentes = async (e) => {
    e.preventDefault();
    setMentesHiba('');
    setMentes_siker('');
    setMentes(true);
    try {
      const body = { name: nev, email };
      const res = await fetch(`${API}/profil`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        profilFrissites(data.felhasznalo);
        setMentes_siker('Profil sikeresen frissítve!');
      } else {
        setMentesHiba(data.error || 'Hiba történt!');
      }
    } catch {
      setMentesHiba('Nem sikerült csatlakozni a szerverhez!');
    } finally {
      setMentes(false);
    }
  };

  const handleKijelentkezes = () => {
    kijelentkezes();
    navigate('/');
  };

  if (!felhasznalo) return null;

  return (
    <div className="profil-oldal">
      <div className="profil-header">
        <div className="profil-avatar">{felhasznalo.name?.charAt(0)?.toUpperCase() || '?'}</div>
        <div>
          <h1 className="profil-nev">{felhasznalo.name}</h1>
          <p className="profil-email">{felhasznalo.email}</p>
          {felhasznalo.is_admin === 1 && <span className="profil-admin-jelveny">ADMIN</span>}
        </div>
        <button className="profil-kijelentkez-gomb" onClick={handleKijelentkezes}>Kijelentkezés</button>
      </div>

      <div className="profil-tabok">
        <button className={`profil-tab ${tab === 'adatok' ? 'aktiv' : ''}`} onClick={() => setTab('adatok')}>Adataim</button>
        <button className={`profil-tab ${tab === 'rendelesek' ? 'aktiv' : ''}`} onClick={() => setTab('rendelesek')}>Rendeléseim</button>
        {felhasznalo.is_admin === 1 && (
          <button className="profil-tab" onClick={() => navigate('/admin')} style={{ color: '#cc00ff' }}>
            ⚙ Admin panel
          </button>
        )}
      </div>

      {tab === 'adatok' && (
        <div className="profil-tartalom">
          <h2>Személyes adatok</h2>
          {mentesHiba && <div className="profil-hiba">{mentesHiba}</div>}
          {mentes_siker && <div className="profil-siker">{mentes_siker}</div>}
          <form onSubmit={handleMentes} className="profil-form">
            <div className="profil-mezo">
              <label>Teljes név</label>
              <input value={nev} onChange={e => setNev(e.target.value)} required />
            </div>
            <div className="profil-mezo">
              <label>E-mail cím</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button type="submit" className="profil-mentes-gomb" disabled={mentes}>
              {mentes ? 'Mentés...' : 'Mentés'}
            </button>
          </form>
        </div>
      )}

      {tab === 'rendelesek' && (
        <div className="profil-tartalom">
          <h2>Rendeléseim</h2>
          {rendBetolt && <p className="profil-betoltes">Betöltés...</p>}
          {rendHiba && <div className="profil-hiba">{rendHiba}</div>}
          {!rendBetolt && !rendHiba && rendelesek.length === 0 && (
            <div className="profil-ures-rendeles">
              <p>Még nem adtál le rendelést.</p>
              <button onClick={() => navigate('/termekek')} className="profil-vasarlj-gomb">Vásárolj most →</button>
            </div>
          )}
          {!rendBetolt && rendelesek.length > 0 && (
            <div className="rendelesek-lista">
              {rendelesek.map(r => (
                <div key={r.id} className="rendeles-kartya">
                  <div
                    className="rendeles-fejlec"
                    style={{ cursor: r.tetelek?.length > 0 ? 'pointer' : 'default' }}
                    onClick={() => r.tetelek?.length > 0 && setNyitottRendeles(nyitottRendeles === r.id ? null : r.id)}
                  >
                    <span className="rendeles-id">#{r.id} rendelés</span>
                    <span className={`rendeles-statusz statusz-${r.status}`}>
                      {STATUSZ_NEV[r.status] || r.status}
                    </span>
                  </div>
                  <div className="rendeles-info">
                    <span>Összeg: <strong>{r.total_amount}</strong></span>
                    <span>{new Date(r.created_at).toLocaleDateString('hu-HU')}</span>
                  </div>

                  {/* Rendelés tételei (kinyitható) */}
                  {nyitottRendeles === r.id && r.tetelek && r.tetelek.length > 0 && (
                    <div className="rendeles-tetelek-lista">
                      <div className="rendeles-tetelek-cim">Rendelt termékek</div>
                      {r.tetelek.map(t => (
                        <div key={t.id} className="rendeles-tetel-sor-profil">
                          <div className="rendeles-tetel-szin-pont" style={{ background: t.color || '#333' }} />
                          <span className="rendeles-tetel-nev">{t.name}</span>
                          <span className="rendeles-tetel-db">×{t.quantity}</span>
                          <span className="rendeles-tetel-ar">{t.unit_price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {r.tetelek?.length > 0 && (
                    <button
                      className="rendeles-reszlet-gomb"
                      onClick={() => setNyitottRendeles(nyitottRendeles === r.id ? null : r.id)}
                    >
                      {nyitottRendeles === r.id ? 'Összecsuk ▲' : `Részletek (${r.tetelek.length} tétel) ▼`}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
