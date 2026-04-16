import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './kategoria.css';

export default function Kategoriak() {
  const [kategoriak, setKategoriak] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/kategoriak')
      .then(res => res.json())
      .then(data => {
        setKategoriak(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Kategóriák betöltése sikertelen:', err);
        setLoading(false);
      });
  }, []);

  const handleKategoriaClick = (kategoriaId) => {
    navigate(`/termekek?kategoria_id=${kategoriaId}`);
  };

  if (loading) return <div>Betöltés...</div>;

  return (
    <section className="kategoriak-szekcio">
      <h2 className="kategoriak-cim">VÁSÁROLJ KATEGÓRIÁK ALAPJÁN</h2>

      <div className="kategoriak-racs">
        {kategoriak.map((kategoria) => (
          <button 
            key={kategoria.id} 
            className="kategoriak-gomb"
            onClick={() => handleKategoriaClick(kategoria.id)}
          >
            {kategoria.name.toUpperCase()}
          </button>
        ))}
      </div>
    </section>
  );
}