import { useState } from 'react';
import './hirlevel.css';

export default function Hirlevel() {
  const [email, setEmail] = useState('');
  const [uzenet, setUzenet] = useState('');
  const [hiba, setHiba] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUzenet('');
    setHiba('');

    if (!email) {
      setHiba('Kérlek add meg az email címed!');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/hirlevel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setUzenet(data.message);
        setEmail('');
      } else {
        setHiba(data.error || 'Hiba történt a feliratkozás során');
      }
    } catch (err) {
      setHiba('Hálózati hiba. Próbáld újra később.');
      console.error(err);
    }
  };

  return (
    <section className="hirlevel-szekcio">
      <h4 className="hirlevel-alcim">MARADJ NAPRAKÉSZ</h4>

      <h2 className="hirlevel-cim">
        CSATLAKOZZ<span className="hirlevel-kiemeles"> HOZZÁNK</span>
      </h2>

      <p className="hirlevel-szoveg">
        Exkluzív ajánlatok, early access és limitált kollekciók a postaládádba.
      </p>

      <form className="hirlevel-urlap" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email címed"
          className="hirlevel-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="hirlevel-gomb">Feliratkozás</button>
      </form>

      {uzenet && <p style={{ color: 'green', marginTop: '10px' }}>{uzenet}</p>}
      {hiba && <p style={{ color: 'red', marginTop: '10px' }}>{hiba}</p>}
    </section>
  );
}