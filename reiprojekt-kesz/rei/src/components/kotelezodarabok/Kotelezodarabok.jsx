import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './kotelezo.css';

export default function KotelezoDarabok() {
  const [termekek, setTermekek] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
   
    fetch('http://localhost:5000/api/termekek')
      .then(res => res.json())
      .then(data => {
        setTermekek(data.slice(0, 3)); 
        setLoading(false);
      })
      .catch(err => {
        console.error('Termékek betöltése sikertelen:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Betöltés...</div>;

  return (
    <section className="kotelezo-szekcio">
      <h4 className="kotelezo-alcim">LEGJOBB VÁLASZTÁS</h4>
      <h2 className="kotelezo-cim">KÖTELEZŐ DARABOK</h2>

      <div className="kotelezo-racs">
        {termekek.map((termek) => (
          <div 
            key={termek.id} 
            className="kotelezo-kartya"
            onClick={() => navigate(`/termekek/${termek.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <span className="kotelezo-jelzo">ÚJ</span>

            <div 
              className="kotelezo-kep"
              style={{ backgroundColor: termek.color || '#ccc' }}
            ></div>

            <h3 className="kotelezo-termeknev">{termek.name}</h3>
            <p className="kotelezo-ar">{termek.price}</p>
          </div>
        ))}
      </div>
    </section>
  );
}