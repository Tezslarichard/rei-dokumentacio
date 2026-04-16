import { useState } from "react";
import "./kapcs.css";

export default function KapcsolatPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [uzenet, setUzenet] = useState('');
  const [hiba, setHiba] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUzenet('');
    setHiba('');

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setHiba('Minden mező kitöltése kötelező!');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/kapcsolat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setUzenet(data.message);
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setHiba(data.error || 'Hiba történt az üzenet küldése során');
      }
    } catch (err) {
      setHiba('Hálózati hiba. Próbáld újra később.');
      console.error(err);
    }
  };

  return (
    <div className="kapcsolat-page">
      <div className="kapcsolat-container">
        <h1 className="kapcsolat-title">Kapcsolat</h1>
        <p className="kapcsolat-subtitle">
          Vedd fel velünk a kapcsolatot, ha bármilyen kérdésed van!
        </p>

        <div className="kapcsolat-content">
          <form className="kapcsolat-form" onSubmit={handleSubmit}>
            <h2>Írj nekünk</h2>
            <p>
              Töltsd ki az űrlapot és munkatársaink hamarosan válaszolnak.
            </p>

            <div className="form-group">
              <label>Név *</label>
              <input 
                type="text" 
                name="name"
                placeholder="Add meg a neved" 
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input 
                type="email" 
                name="email"
                placeholder="pelda@email.com" 
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Tárgy *</label>
              <input 
                type="text" 
                name="subject"
                placeholder="Miben segíthetünk?" 
                value={formData.subject}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Üzenet *</label>
              <textarea 
                name="message"
                placeholder="Írd le részletesen a kérdésed..."
                value={formData.message}
                onChange={handleChange}
              ></textarea>
            </div>

            <button type="submit" className="submit-button">Üzenet küldése</button>

            {uzenet && <p style={{ color: 'green', marginTop: '10px' }}>{uzenet}</p>}
            {hiba && <p style={{ color: 'red', marginTop: '10px' }}>{hiba}</p>}
          </form>

          <div className="kapcsolat-info">
            <h2>Elérhetőségeink</h2>

            <div className="info-item">
              <div className="info-icon">📧</div>
              <div className="info-content">
                <h3>Email</h3>
                <p>info@rei.hu</p>
                <p>Válaszidő: 24-48 óra</p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">📱</div>
              <div className="info-content">
                <h3>Telefon</h3>
                <p>+36 1 234 5678</p>
                <p>Hétfő-Péntek: 9:00 - 18:00</p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">📍</div>
              <div className="info-content">
                <h3>Cím</h3>
                <p>1234 Budapest</p>
                <p>Példa utca 12.</p>
              </div>
            </div>

            <div className="nyitvatartas">
              <h2>Nyitvatartás</h2>
              <div className="nyitvatartas-item">
                <span>Hétfő - Péntek</span>
                <span>9:00 - 18:00</span>
              </div>
              <div className="nyitvatartas-item">
                <span>Szombat</span>
                <span>10:00 - 16:00</span>
              </div>
              <div className="nyitvatartas-item">
                <span>Vasárnap</span>
                <span>Zárva</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}