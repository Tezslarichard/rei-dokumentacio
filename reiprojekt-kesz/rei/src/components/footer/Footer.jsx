import './foot.css';

export default function Lablec() {
  return (
    <footer className="lablec-container">
      <div className="lablec-tartalom">
        <div className="lablec-oszlop">
          <div className="lablec-logo">REI</div>
        </div>

        <div className="lablec-oszlop">
          <h4 className="oszlop-cim">Navigáció</h4>
          <a href="/" className="lablec-link">Kezdőlap</a>
          <a href="/termekek" className="lablec-link">Katalógus</a>
          <a href="/kapcsolat" className="lablec-link">Kapcsolat</a>
        </div>

        <div className="lablec-oszlop">
          <h4 className="oszlop-cim">Információ</h4>
          <a href="#" className="lablec-link">Szállítás és fizetés</a>
          <a href="#" className="lablec-link">Visszaküldés</a>
        </div>

        <div className="lablec-oszlop">
          <h4 className="oszlop-cim">Kapcsolat</h4>
          <a href="mailto:info@rei.hu" className="lablec-link lablec-email">info@rei.hu</a>
          <div className="social-ikonok">
            <span className="ikon">Ⓕ</span> 
            <span className="ikon">Ⓘ</span>
          </div>
        </div>
      </div>
      
      <div className="lablec-alj">
         <p className="lablec-szoveg">© 2026 REI | Minden jog fenntartva.</p>
      </div>
    </footer>
  );
}