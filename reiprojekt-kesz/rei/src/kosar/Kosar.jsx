import { useNavigate, Link } from 'react-router-dom';
import { useKosar } from '../context/KosarContext';
import { useAuth } from '../context/AuthContext';
import './kosar.css';

export default function Kosar() {
  const { kosarTetelek, kosarBetoltes, mennyisegFrissit, torol, kosarUrit, kosarOsszeg } = useKosar();
  const { felhasznalo } = useAuth();
  const navigate = useNavigate();

  if (!felhasznalo) {
    return (
      <div className="kosar-oldal">
        <div className="kosar-ures">
          <div className="kosar-ures-ikon">🛒</div>
          <h2>Bejelentkezés szükséges</h2>
          <p>A kosár megtekintéséhez jelentkezz be!</p>
          <Link to="/bejelentkezes" className="kosar-bejel-gomb">Bejelentkezés</Link>
        </div>
      </div>
    );
  }

  if (kosarBetoltes) return <div className="kosar-oldal"><p className="kosar-betoltes">Betöltés...</p></div>;

  if (kosarTetelek.length === 0) {
    return (
      <div className="kosar-oldal">
        <div className="kosar-ures">
          <div className="kosar-ures-ikon">🛒</div>
          <h2>A kosár üres</h2>
          <p>Adj hozzá termékeket a kosárhoz!</p>
          <button onClick={() => navigate('/termekek')} className="kosar-vasarlj-gomb">Vásárolj most →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="kosar-oldal">
      <div className="kosar-header">
        <h1>Kosaram</h1>
        <button className="kosar-urit-gomb" onClick={kosarUrit}>Kosár ürítése</button>
      </div>

      <div className="kosar-tartalom">
        <div className="kosar-tetelek">
          {kosarTetelek.map(t => (
            <div key={t.id} className="kosar-tetel">
              <div className="kosar-tetel-kep" style={{ background: t.color || '#222' }} />
              <div className="kosar-tetel-info">
                <h3>{t.name}</h3>
                <span className="kosar-tetel-ar">{t.price}</span>
              </div>
              <div className="kosar-mennyiseg">
                <button onClick={() => mennyisegFrissit(t.id, t.mennyiseg - 1)} disabled={t.mennyiseg <= 1}>−</button>
                <span>{t.mennyiseg}</span>
                <button onClick={() => mennyisegFrissit(t.id, t.mennyiseg + 1)} disabled={t.mennyiseg >= t.stock}>+</button>
              </div>
              <div className="kosar-tetel-reszosszeg">
                {((parseInt(t.price.replace(/\D/g, ''), 10) || 0) * t.mennyiseg).toLocaleString('hu-HU')} Ft
              </div>
              <button className="kosar-torol-gomb" onClick={() => torol(t.id)}>✕</button>
            </div>
          ))}
        </div>

        <div className="kosar-osszesites">
          <h3>Összesítő</h3>
          <div className="kosar-ossz-sor">
            <span>Részösszeg</span>
            <span>{kosarOsszeg.toLocaleString('hu-HU')} Ft</span>
          </div>
          <div className="kosar-ossz-sor">
            <span>Szállítás</span>
            <span className="kosar-ingyenes">Ingyenes</span>
          </div>
          <div className="kosar-ossz-sor kosar-vegosszeg">
            <span>Végösszeg</span>
            <span>{kosarOsszeg.toLocaleString('hu-HU')} Ft</span>
          </div>
          <button className="kosar-rendeles-gomb" onClick={() => navigate('/fizetes')}>
            Tovább a fizetéshez →
          </button>
        </div>
      </div>
    </div>
  );
}
