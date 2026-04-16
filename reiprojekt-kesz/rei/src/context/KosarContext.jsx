import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const KosarContext = createContext(null);

export function KosarProvider({ children }) {
  const { token, felhasznalo } = useAuth();
  const [kosarTetelek, setKosarTetelek] = useState([]);
  const [kosarBetoltes, setKosarBetoltes] = useState(false);

  const kosarBetolt = useCallback(async () => {
    if (!token) { setKosarTetelek([]); return; }
    setKosarBetoltes(true);
    try {
      const res = await fetch('http://localhost:5000/api/kosar', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setKosarTetelek(data);
      }
    } catch (err) {
      console.error('Kosár betöltési hiba:', err);
    } finally {
      setKosarBetoltes(false);
    }
  }, [token]);

  useEffect(() => {
    if (felhasznalo) {
      kosarBetolt();
    } else {
      setKosarTetelek([]);
    }
  }, [felhasznalo, kosarBetolt]);

  const kosarbaAd = async (termekId, mennyiseg = 1) => {
    if (!token) return { error: 'Bejelentkezés szükséges!' };
    try {
      const res = await fetch('http://localhost:5000/api/kosar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ termek_id: termekId, mennyiseg }),
      });
      const data = await res.json();
      if (res.ok) { await kosarBetolt(); return { success: true }; }
      return { error: data.error };
    } catch { return { error: 'Hálózati hiba!' }; }
  };

  const mennyisegFrissit = async (kosarId, mennyiseg) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/kosar/${kosarId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mennyiseg }),
      });
      if (res.ok) await kosarBetolt();
    } catch (err) { console.error(err); }
  };

  const torol = async (kosarId) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/kosar/${kosarId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) await kosarBetolt();
    } catch (err) { console.error(err); }
  };

  const kosarUrit = async () => {
    if (!token) return;
    try {
      await fetch('http://localhost:5000/api/kosar', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setKosarTetelek([]);
    } catch (err) { console.error(err); }
  };

  const kosarOsszeg = kosarTetelek.reduce((sum, t) => {
    const ar = parseInt(t.price.replace(/\D/g, ''), 10) || 0;
    return sum + ar * t.mennyiseg;
  }, 0);

  const kosarDarab = kosarTetelek.reduce((sum, t) => sum + t.mennyiseg, 0);

  return (
    <KosarContext.Provider value={{
      kosarTetelek, kosarBetoltes, kosarBetolt,
      kosarbaAd, mennyisegFrissit, torol, kosarUrit,
      kosarOsszeg, kosarDarab,
    }}>
      {children}
    </KosarContext.Provider>
  );
}

export function useKosar() {
  const ctx = useContext(KosarContext);
  if (!ctx) throw new Error('useKosar must be used within KosarProvider');
  return ctx;
}
