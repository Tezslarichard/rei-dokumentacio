import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useKosar } from "../context/KosarContext";
import { useAuth } from "../context/AuthContext";
import "./termek.css";

export default function TermekReszlet() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mennyiseg, setMennyiseg] = useState(1);
  const [kosarUzenet, setKosarUzenet] = useState(null);

  const { kosarbaAd } = useKosar();
  const { felhasznalo } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:5000/api/termekek/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Hálózati hiba: " + res.status);
        return res.json();
      })
      .then(data => { setProduct(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [id]);

  const handleKosarba = async () => {
    if (!felhasznalo) { navigate("/bejelentkezes"); return; }
    const result = await kosarbaAd(product.id, mennyiseg);
    if (result.error) {
      setKosarUzenet({ tipus: "hiba", szoveg: result.error });
    } else {
      setKosarUzenet({ tipus: "siker", szoveg: `${mennyiseg} db kosárba téve!` });
    }
    setTimeout(() => setKosarUzenet(null), 3000);
  };

  if (loading) return <div className="termek-reszlet"><p>Betöltés...</p></div>;
  if (error) return <div className="termek-reszlet"><p style={{ color: "red" }}>{error}</p></div>;
  if (!product) return <div className="termek-reszlet"><p>Termék nem található</p></div>;

  return (
    <div className="termek-reszlet">
      <Link to="/termekek" className="vissza-link">← Vissza a katalógusba</Link>

      <div className="termek-reszlet-tartalom">
        <div className="modal-image" style={{ background: product.color || "#ccc" }} />

        <div className="termek-reszlet-info">
          {product.kategoria_nev && (
            <span className="termek-kat-cimke">{product.kategoria_nev.toUpperCase()}</span>
          )}
          <h1>{product.name}</h1>
          <p className="termek-ar">{product.price}</p>
          <p className="termek-leiras">{product.description}</p>

          <div className="termek-keszlet">
            {product.stock > 0 ? (
              <span className="keszlet-van">✓ Raktáron ({product.stock} db)</span>
            ) : (
              <span className="keszlet-nincs">✗ Elfogyott</span>
            )}
          </div>

          {product.stock > 0 && (
            <div className="termek-mennyiseg-sor">
              <label>Mennyiség:</label>
              <div className="mennyiseg-valaszto">
                <button onClick={() => setMennyiseg(m => Math.max(1, m - 1))} disabled={mennyiseg <= 1}>−</button>
                <span>{mennyiseg}</span>
                <button onClick={() => setMennyiseg(m => Math.min(product.stock, m + 1))} disabled={mennyiseg >= product.stock}>+</button>
              </div>
            </div>
          )}

          {kosarUzenet && (
            <div className={kosarUzenet.tipus === "siker" ? "kosarba-siker" : "kosarba-hiba"}>
              {kosarUzenet.szoveg}
            </div>
          )}

          <button
            className="kosarba-gomb"
            onClick={handleKosarba}
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? "Elfogyott" : "Kosárba"}
          </button>

          {!felhasznalo && (
            <p className="bejel-figyelmeztes">
              <Link to="/bejelentkezes">Jelentkezz be</Link> a vásárláshoz!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
