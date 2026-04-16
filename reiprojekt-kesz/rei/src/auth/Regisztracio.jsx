import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './auth.css';

export default function Regisztracio() {
  const [nev, setNev] = useState('');
  const [email, setEmail] = useState('');
  const [jelszo, setJelszo] = useState('');
  const [jelszo2, setJelszo2] = useState('');
  const [hiba, setHiba] = useState('');
  const [betolt, setBetolt] = useState(false);
  const { bejelentkezes } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHiba('');
    if (jelszo !== jelszo2) { setHiba('A két jelszó nem egyezik meg!'); return; }
    if (jelszo.length < 6) { setHiba('A jelszónak legalább 6 karakter hosszúnak kell lennie!'); return; }
    setBetolt(true);
    try {
      const res = await fetch('http://localhost:5000/api/regisztracio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nev, email, password: jelszo }),
      });
      const data = await res.json();
      if (res.ok) {
        bejelentkezes(data.token, data.felhasznalo);
        navigate('/profil');
      } else {
        setHiba(data.error || 'Hiba történt!');
      }
    } catch {
      setHiba('Nem sikerült csatlakozni a szerverhez!');
    } finally {
      setBetolt(false);
    }
  };

  return (
    <div className="auth-oldal">
      <div className="auth-doboz">
        <div className="auth-logo">REI</div>
        <h1 className="auth-cim">Regisztráció</h1>
        <p className="auth-alcim">Csatlakozz a REI közösséghez!</p>

        {hiba && <div className="auth-hiba">{hiba}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-mezo">
            <label>Teljes név</label>
            <input
              type="text"
              value={nev}
              onChange={e => setNev(e.target.value)}
              placeholder="Kovács János"
              required
            />
          </div>
          <div className="auth-mezo">
            <label>E-mail cím</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="pelda@email.hu"
              required
            />
          </div>
          <div className="auth-mezo">
            <label>Jelszó</label>
            <input
              type="password"
              value={jelszo}
              onChange={e => setJelszo(e.target.value)}
              placeholder="Min. 6 karakter"
              required
            />
          </div>
          <div className="auth-mezo">
            <label>Jelszó megerősítése</label>
            <input
              type="password"
              value={jelszo2}
              onChange={e => setJelszo2(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="auth-gomb" disabled={betolt}>
            {betolt ? 'Regisztráció...' : 'Regisztráció'}
          </button>
        </form>

        <p className="auth-link-szoveg">
          Már van fiókod?{' '}
          <Link to="/bejelentkezes" className="auth-link">Jelentkezz be!</Link>
        </p>
      </div>
    </div>
  );
}
