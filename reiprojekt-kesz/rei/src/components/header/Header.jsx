import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useKosar } from '../../context/KosarContext';
import './header.css';

export default function Header() {
  const { felhasznalo, kijelentkezes } = useAuth();
  const { kosarDarab } = useKosar();
  const navigate = useNavigate();
  const [menuNyitva, setMenuNyitva] = useState(false);

  const handleKijelentkezes = () => {
    kijelentkezes();
    setMenuNyitva(false);
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="header-logo">
        <Link to="/" className="logo-link">REI</Link>
      </div>

      <nav className="header-nav">
        <Link to="/" className="nav-link">Kezdőlap</Link>
        <Link to="/termekek" className="nav-link">Katalógus</Link>
        <Link to="/kapcsolat" className="nav-link">Kapcsolat</Link>
      </nav>

      <div className="header-ikonok">
        
        <Link to="/kosar" className="ikon kosar-ikon" title="Kosár">
          🛒
          {kosarDarab > 0 && <span className="kosar-jelveny">{kosarDarab}</span>}
        </Link>

       
        <div className="user-menu">
          <button
            className="ikon user-ikon"
            onClick={() => setMenuNyitva(!menuNyitva)}
            title={felhasznalo ? felhasznalo.name : 'Bejelentkezés'}
          >
            {felhasznalo ? (
              <span className="user-avatar">{felhasznalo.name?.charAt(0)?.toUpperCase()}</span>
            ) : '👤'}
          </button>

          {menuNyitva && (
            <div className="user-dropdown">
              {felhasznalo ? (
                <>
                  <div className="user-dropdown-nev">{felhasznalo.name}</div>
                  <Link to="/profil" className="user-dropdown-link" onClick={() => setMenuNyitva(false)}>Profilom</Link>
                  <Link to="/kosar" className="user-dropdown-link" onClick={() => setMenuNyitva(false)}>Kosaram</Link>
                  {felhasznalo.is_admin === 1 && (
                    <Link to="/admin" className="user-dropdown-link" onClick={() => setMenuNyitva(false)} style={{ color: '#cc00ff' }}>⚙ Admin panel</Link>
                  )}
                  <button className="user-dropdown-kijelentkez" onClick={handleKijelentkezes}>Kijelentkezés</button>
                </>
              ) : (
                <>
                  <Link to="/bejelentkezes" className="user-dropdown-link" onClick={() => setMenuNyitva(false)}>Bejelentkezés</Link>
                  <Link to="/regisztracio" className="user-dropdown-link user-dropdown-reg" onClick={() => setMenuNyitva(false)}>Regisztráció</Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
