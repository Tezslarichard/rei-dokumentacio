import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useKosar } from "../context/KosarContext";
import { useAuth } from "../context/AuthContext";
import "./termek.css";

export default function TermekLista() {
  const [termekek, setTermekek] = useState([]);
  const [kategoriak, setKategoriak] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kosarUzenetek, setKosarUzenetek] = useState({});

  // Szűrők
  const [kereses, setKereses] = useState("");
  const [minAr, setMinAr] = useState("");
  const [maxAr, setMaxAr] = useState("");
  const [rendez, setRendez] = useState("");
  const [valasztottKat, setValasztottKat] = useState([]);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { kosarbaAd } = useKosar();
  const { felhasznalo } = useAuth();

  useEffect(() => {
    fetch("http://localhost:5000/api/kategoriak")
      .then(r => r.json())
      .then(d => setKategoriak(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const katId = searchParams.get("kategoria_id");
    if (katId && !valasztottKat.includes(Number(katId))) {
      setValasztottKat([Number(katId)]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (valasztottKat.length === 1) params.set("kategoria_id", valasztottKat[0]);
    if (kereses) params.set("kereses", kereses);
    if (minAr) params.set("min_ar", minAr);
    if (maxAr) params.set("max_ar", maxAr);
    if (rendez) params.set("rendez", rendez);

    fetch(`http://localhost:5000/api/termekek?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error("Hálózati hiba: " + res.status);
        return res.json();
      })
      .then(data => { setTermekek(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [valasztottKat, kereses, minAr, maxAr, rendez]);

  const handleKosarba = async (e, termekId) => {
    e.stopPropagation();
    if (!felhasznalo) { navigate("/bejelentkezes"); return; }
    const result = await kosarbaAd(termekId, 1);
    const uzenet = result.error ? { tipus: "hiba", szoveg: result.error } : { tipus: "siker", szoveg: "Kosárba téve!" };
    setKosarUzenetek(prev => ({ ...prev, [termekId]: uzenet }));
    setTimeout(() => setKosarUzenetek(prev => { const n = { ...prev }; delete n[termekId]; return n; }), 2000);
  };

  const toggleKategoria = (id) => {
    setValasztottKat(prev => prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]);
  };

  const szuresTorles = () => {
    setKereses(""); setMinAr(""); setMaxAr(""); setRendez(""); setValasztottKat([]);
    setSearchParams({});
  };

  return (
    <div className="termekek-page">
      <div className="termekek-fejlec">
        <h1 className="page-title">KATALÓGUS</h1>
        <div className="termekek-kereses">
          <input
            type="text"
            placeholder="Keresés..."
            value={kereses}
            onChange={e => setKereses(e.target.value)}
            className="kereses-input"
          />
        </div>
        <select value={rendez} onChange={e => setRendez(e.target.value)} className="rendez-select">
          <option value="">Rendezés</option>
          <option value="ar_nov">Ár: növekvő</option>
          <option value="ar_csokkeno">Ár: csökkenő</option>
          <option value="nev">Név</option>
          <option value="legujabb">Legújabb</option>
        </select>
      </div>

      <div className="layout">
        <aside className="sidebar">
          <h2>Szűrők</h2>

          <div className="szuro-csoport">
            <h3>Kategória</h3>
            {kategoriak.map(k => (
              <label key={k.id} className="filter-item">
                <input
                  type="checkbox"
                  checked={valasztottKat.includes(k.id)}
                  onChange={() => toggleKategoria(k.id)}
                />
                {k.name}
              </label>
            ))}
          </div>

          <div className="szuro-csoport">
            <h3>Ár (Ft)</h3>
            <div className="ar-szuro">
              <input
                type="number"
                placeholder="Min."
                value={minAr}
                onChange={e => setMinAr(e.target.value)}
                className="ar-input"
              />
              <span>–</span>
              <input
                type="number"
                placeholder="Max."
                value={maxAr}
                onChange={e => setMaxAr(e.target.value)}
                className="ar-input"
              />
            </div>
          </div>

          <button onClick={szuresTorles} className="szuro-torol-gomb">Szűrők törlése</button>
        </aside>

        <div className="product-list">
          {loading ? (
            <p>Betöltés...</p>
          ) : error ? (
            <p style={{ color: "red" }}>{error}</p>
          ) : termekek.length === 0 ? (
            <div className="nincs-termek">
              <p>Nem találhatók termékek a megadott feltételekkel.</p>
              <button onClick={szuresTorles} className="szuro-torol-gomb">Szűrők törlése</button>
            </div>
          ) : (
            termekek.map(termek => (
              <div key={termek.id} className="product-card" onClick={() => navigate(`/termekek/${termek.id}`)}>
                <div className="product-image" style={{ background: termek.color || "#ccc" }} />
                <div className="product-info">
                  <h3>{termek.name}</h3>
                  <span className="product-kategoria">{termek.kategoria_nev || "Limitált kollekció"}</span>
                  <span className="product-keszlet">Raktár: {termek.stock} db</span>
                </div>
                <div className="product-price">
                  <strong>{termek.price}</strong>
                  <div className="product-gombok">
                    <button
                      className="kosarba-gomb-lista"
                      onClick={(e) => handleKosarba(e, termek.id)}
                      disabled={termek.stock === 0}
                    >
                      {kosarUzenetek[termek.id]
                        ? kosarUzenetek[termek.id].tipus === "siker" ? "✓ Hozzáadva" : "✗ Hiba"
                        : termek.stock === 0 ? "Elfogyott" : "Kosárba"}
                    </button>
                    <button
                      className="megnezem-gomb"
                      onClick={(e) => { e.stopPropagation(); navigate(`/termekek/${termek.id}`); }}
                    >
                      Részletek
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
