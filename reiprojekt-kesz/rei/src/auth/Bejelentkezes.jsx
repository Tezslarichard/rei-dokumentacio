import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './auth.css';

export default function Bejelentkezes() {
  const [email, setEmail] = useState('');
  const [jelszo, setJelszo] = useState('');
  const [hiba, setHiba] = useState('');
  const [betolt, setBetolt] = useState(false);
  const { bejelentkezes } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHiba('');
    setBetolt(true);
    try {
      const res = await fetch('http://localhost:5000/api/bejelentkezes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: jelszo }),
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
        <h1 className="auth-cim">Bejelentkezés</h1>
        <p className="auth-alcim">Üdvözlünk vissza!</p>

        {hiba && <div className="auth-hiba">{hiba}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
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
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="auth-gomb" disabled={betolt}>
            {betolt ? 'Bejelentkezés...' : 'Bejelentkezés'}
          </button>
        </form>

        <p className="auth-link-szoveg">
          Még nincs fiókod?{' '}
          <Link to="/regisztracio" className="auth-link">Regisztrálj itt!</Link>
        </p>
      </div>
    </div>
  );
}
