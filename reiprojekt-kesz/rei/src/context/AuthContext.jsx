import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [felhasznalo, setFelhasznalo] = useState(null);
  const [token, setToken] = useState(null);
  const [betoltes, setBetoltes] = useState(true);

  useEffect(() => {
    const mentettToken = localStorage.getItem('rei_token');
    const mentettFelhasznalo = localStorage.getItem('rei_felhasznalo');
    if (mentettToken && mentettFelhasznalo) {
      try {
        setToken(mentettToken);
        setFelhasznalo(JSON.parse(mentettFelhasznalo));
      } catch {
        localStorage.removeItem('rei_token');
        localStorage.removeItem('rei_felhasznalo');
      }
    }
    setBetoltes(false);
  }, []);

  const bejelentkezes = (tok, fh) => {
    setToken(tok);
    setFelhasznalo(fh);
    localStorage.setItem('rei_token', tok);
    localStorage.setItem('rei_felhasznalo', JSON.stringify(fh));
  };

  const kijelentkezes = () => {
    setToken(null);
    setFelhasznalo(null);
    localStorage.removeItem('rei_token');
    localStorage.removeItem('rei_felhasznalo');
  };

  const profilFrissites = (fh) => {
    setFelhasznalo(fh);
    localStorage.setItem('rei_felhasznalo', JSON.stringify(fh));
  };

  return (
    <AuthContext.Provider value={{ felhasznalo, token, betoltes, bejelentkezes, kijelentkezes, profilFrissites }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
