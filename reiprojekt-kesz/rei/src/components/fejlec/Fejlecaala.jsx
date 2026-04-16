import { useNavigate } from 'react-router-dom';
import './fejlecala.css'; 

export default function Fejlecala() {
  const navigate = useNavigate();

  return (
    <section className="fejlecala-szekcio">
      <h4 className="fejlecala-alcim">2026 KOLLEKCIÓ</h4>

      <h1 className="fejlecala-cim">
        <span className="fejlecala-kiemeles">STREET</span> CULTURE
      </h1>

      <p className="fejlecala-szoveg">Merészség. Stílus. Egyediség.</p>

      <button className="fejlecala-gomb" onClick={() => navigate('/termekek')}>
        VÁSÁROLJ MOST →
      </button>
    </section>
  );
}