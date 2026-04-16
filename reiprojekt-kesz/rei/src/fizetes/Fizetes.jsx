import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKosar } from '../context/KosarContext'
import { useAuth } from '../context/AuthContext'
import './fizetes.css'

const LEPESEK = ['Szállítás', 'Fizetés', 'Összesítő']

export default function Fizetes() {
  const { kosarTetelek, kosarOsszeg, kosarBetolt } = useKosar()
  const { felhasznalo, token } = useAuth()
  const navigate = useNavigate()

  const [lepes, setLepes] = useState(0)
  const [betolt, setBetolt] = useState(false)
  const [hiba, setHiba] = useState('')

  const [szallitas, setSzallitas] = useState({
    nev: felhasznalo?.name || '',
    email: felhasznalo?.email || '',
    telefon: '',
    iranyitoszam: '',
    varos: '',
    utca: '',
    hazszam: '',
    megjegyzes: '',
  })

  const [fizetesiMod, setFizetesiMod] = useState('utanvet')

  if (!felhasznalo) {
    navigate('/bejelentkezes')
    return null
  }

  if (kosarTetelek.length === 0) {
    navigate('/kosar')
    return null
  }

  const szallitasHiany = () => {
    const { nev, email, telefon, iranyitoszam, varos, utca, hazszam } = szallitas
    if (!nev || !email || !telefon || !iranyitoszam || !varos || !utca || !hazszam) return true
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return true
    if (!/^\d{4}$/.test(iranyitoszam)) return true
    return false
  }

  const handleSzallitasValtozas = (e) => {
    setSzallitas(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleRendeles = async () => {
    setHiba('')
    setBetolt(true)
    try {
      const res = await fetch('http://localhost:5000/api/rendelesek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        await kosarBetolt()
        navigate('/rendeles-sikeres', { state: { rendeles_id: data.rendeles_id, osszeg: kosarOsszeg, szallitas, fizetesiMod } })
      } else {
        setHiba(data.error || 'Hiba történt a rendelés leadásakor!')
        setBetolt(false)
      }
    } catch {
      setHiba('Nem sikerült csatlakozni a szerverhez!')
      setBetolt(false)
    }
  }

  return (
    <div className="fizetes-oldal">
      {/* Lépésjelző */}
      <div className="fizetes-lepesek">
        {LEPESEK.map((l, i) => (
          <div key={l} className={`fizetes-lepes ${i === lepes ? 'aktiv' : ''} ${i < lepes ? 'kesz' : ''}`}>
            <div className="fizetes-lepes-szam">{i < lepes ? '✓' : i + 1}</div>
            <span>{l}</span>
            {i < LEPESEK.length - 1 && <div className="fizetes-lepes-vonal" />}
          </div>
        ))}
      </div>

      <div className="fizetes-tartalom">
        {/* Bal oldal – lépés tartalma */}
        <div className="fizetes-bal">

          {/* 1. LÉPÉS: Szállítási adatok */}
          {lepes === 0 && (
            <div className="fizetes-panel">
              <h2>Szállítási adatok</h2>

              <div className="fizetes-sor">
                <div className="fizetes-mezo">
                  <label>Teljes név *</label>
                  <input name="nev" value={szallitas.nev} onChange={handleSzallitasValtozas} placeholder="Kovács János" />
                </div>
                <div className="fizetes-mezo">
                  <label>E-mail cím *</label>
                  <input name="email" type="email" value={szallitas.email} onChange={handleSzallitasValtozas} placeholder="pelda@email.hu" />
                </div>
              </div>

              <div className="fizetes-sor">
                <div className="fizetes-mezo">
                  <label>Telefonszám *</label>
                  <input name="telefon" value={szallitas.telefon} onChange={handleSzallitasValtozas} placeholder="+36 20 123 4567" />
                </div>
                <div className="fizetes-mezo fizetes-mezo--kicsi">
                  <label>Irányítószám *</label>
                  <input name="iranyitoszam" value={szallitas.iranyitoszam} onChange={handleSzallitasValtozas} placeholder="1234" maxLength={4} />
                </div>
              </div>

              <div className="fizetes-sor">
                <div className="fizetes-mezo">
                  <label>Város *</label>
                  <input name="varos" value={szallitas.varos} onChange={handleSzallitasValtozas} placeholder="Budapest" />
                </div>
                <div className="fizetes-mezo">
                  <label>Utca, közterület *</label>
                  <input name="utca" value={szallitas.utca} onChange={handleSzallitasValtozas} placeholder="Példa utca" />
                </div>
                <div className="fizetes-mezo fizetes-mezo--kicsi">
                  <label>Házszám *</label>
                  <input name="hazszam" value={szallitas.hazszam} onChange={handleSzallitasValtozas} placeholder="12/A" />
                </div>
              </div>

              <div className="fizetes-mezo">
                <label>Megjegyzés a futárnak</label>
                <textarea name="megjegyzes" value={szallitas.megjegyzes} onChange={handleSzallitasValtozas} placeholder="pl. Csengő nem működik, hívj fel érkezés előtt..." rows={3} />
              </div>

              <button className="fizetes-tovabb-gomb" onClick={() => setLepes(1)} disabled={szallitasHiany()}>
                Tovább a fizetéshez →
              </button>
            </div>
          )}

          {/* 2. LÉPÉS: Fizetési mód */}
          {lepes === 1 && (
            <div className="fizetes-panel">
              <h2>Fizetési mód</h2>

              <div className="fizetes-modok">
                {[
                  { ertek: 'utanvet', ikon: '💵', cim: 'Utánvét', leiras: 'Készpénzben fizetsz a futárnak átvételkor' },
                  { ertek: 'bankkartya', ikon: '💳', cim: 'Bankkártya', leiras: 'Biztonságos online bankkártyás fizetés' },
                  { ertek: 'atutalas', ikon: '🏦', cim: 'Banki átutalás', leiras: 'Utalj a megrendelés után 3 munkanapon belül' },
                ].map(({ ertek, ikon, cim, leiras }) => (
                  <label key={ertek} className={`fizetes-mod-kártya ${fizetesiMod === ertek ? 'kivalasztott' : ''}`}>
                    <input type="radio" name="fizetesiMod" value={ertek} checked={fizetesiMod === ertek} onChange={() => setFizetesiMod(ertek)} />
                    <span className="fizetes-mod-ikon">{ikon}</span>
                    <div>
                      <div className="fizetes-mod-cim">{cim}</div>
                      <div className="fizetes-mod-leiras">{leiras}</div>
                    </div>
                    {fizetesiMod === ertek && <span className="fizetes-mod-pipa">✓</span>}
                  </label>
                ))}
              </div>

              {fizetesiMod === 'bankkartya' && (
                <div className="fizetes-kártya-mezok">
                  <p className="fizetes-demo-info">⚠️ Ez egy demó webshop — valódi fizetési adatokat ne adj meg!</p>
                  <div className="fizetes-mezo">
                    <label>Kártyaszám</label>
                    <input placeholder="1234 5678 9012 3456" maxLength={19} />
                  </div>
                  <div className="fizetes-sor">
                    <div className="fizetes-mezo">
                      <label>Lejárat</label>
                      <input placeholder="HH/ÉÉ" maxLength={5} />
                    </div>
                    <div className="fizetes-mezo fizetes-mezo--kicsi">
                      <label>CVV</label>
                      <input placeholder="123" maxLength={3} type="password" />
                    </div>
                  </div>
                  <div className="fizetes-mezo">
                    <label>Kártyán szereplő név</label>
                    <input placeholder="KOVACS JANOS" />
                  </div>
                </div>
              )}

              {fizetesiMod === 'atutalas' && (
                <div className="fizetes-atutalas-info">
                  <p>Bankszámlaszám: <strong>12345678-12345678-12345678</strong></p>
                  <p>Közlemény: rendelési számodat kapod meg e-mailben</p>
                </div>
              )}

              <div className="fizetes-gomb-sor">
                <button className="fizetes-vissza-gomb" onClick={() => setLepes(0)}>← Vissza</button>
                <button className="fizetes-tovabb-gomb" onClick={() => setLepes(2)}>Összesítő →</button>
              </div>
            </div>
          )}

          {/* 3. LÉPÉS: Összesítő */}
          {lepes === 2 && (
            <div className="fizetes-panel">
              <h2>Rendelés összesítő</h2>

              <div className="fizetes-osszesito-blokk">
                <h3>Szállítási adatok</h3>
                <div className="fizetes-osszesito-adat">{szallitas.nev}</div>
                <div className="fizetes-osszesito-adat">{szallitas.email} · {szallitas.telefon}</div>
                <div className="fizetes-osszesito-adat">{szallitas.iranyitoszam} {szallitas.varos}, {szallitas.utca} {szallitas.hazszam}</div>
                {szallitas.megjegyzes && <div className="fizetes-osszesito-adat fizetes-megjegyzes">„{szallitas.megjegyzes}"</div>}
                <button className="fizetes-szerkeszt-gomb" onClick={() => setLepes(0)}>Szerkesztés</button>
              </div>

              <div className="fizetes-osszesito-blokk">
                <h3>Fizetési mód</h3>
                <div className="fizetes-osszesito-adat">
                  {{ utanvet: '💵 Utánvét', bankkartya: '💳 Bankkártya', atutalas: '🏦 Banki átutalás' }[fizetesiMod]}
                </div>
                <button className="fizetes-szerkeszt-gomb" onClick={() => setLepes(1)}>Szerkesztés</button>
              </div>

              <div className="fizetes-osszesito-blokk">
                <h3>Termékek ({kosarTetelek.length} tétel)</h3>
                {kosarTetelek.map(t => (
                  <div key={t.id} className="fizetes-osszesito-tetel">
                    <div className="fizetes-osszesito-szin" style={{ background: t.color || '#222' }} />
                    <span className="fizetes-osszesito-nev">{t.name}</span>
                    <span className="fizetes-osszesito-db">×{t.mennyiseg}</span>
                    <span className="fizetes-osszesito-ar">
                      {((parseInt(t.price.replace(/\D/g, ''), 10) || 0) * t.mennyiseg).toLocaleString('hu-HU')} Ft
                    </span>
                  </div>
                ))}
              </div>

              {hiba && <div className="fizetes-hiba">{hiba}</div>}

              <div className="fizetes-gomb-sor">
                <button className="fizetes-vissza-gomb" onClick={() => setLepes(1)}>← Vissza</button>
                <button className="fizetes-lead-gomb" onClick={handleRendeles} disabled={betolt}>
                  {betolt ? 'Feldolgozás...' : '✓ Rendelés véglegesítése'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Jobb oldal – rendelés összefoglaló */}
        <div className="fizetes-jobb">
          <div className="fizetes-osszeg-doboz">
            <h3>Rendelés</h3>
            <div className="fizetes-tetel-lista">
              {kosarTetelek.map(t => (
                <div key={t.id} className="fizetes-mini-tetel">
                  <div className="fizetes-mini-szin" style={{ background: t.color || '#222' }} />
                  <span className="fizetes-mini-nev">{t.name} <span className="fizetes-mini-db">×{t.mennyiseg}</span></span>
                  <span className="fizetes-mini-ar">
                    {((parseInt(t.price.replace(/\D/g, ''), 10) || 0) * t.mennyiseg).toLocaleString('hu-HU')} Ft
                  </span>
                </div>
              ))}
            </div>
            <div className="fizetes-ossz-sor">
              <span>Részösszeg</span>
              <span>{kosarOsszeg.toLocaleString('hu-HU')} Ft</span>
            </div>
            <div className="fizetes-ossz-sor">
              <span>Szállítás</span>
              <span className="fizetes-ingyenes">Ingyenes</span>
            </div>
            <div className="fizetes-ossz-sor fizetes-vegosszeg">
              <span>Végösszeg</span>
              <span>{kosarOsszeg.toLocaleString('hu-HU')} Ft</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
