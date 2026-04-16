import { useLocation, useNavigate } from 'react-router-dom'
import './rendelessikeres.css'

export default function RendelesSikeres() {
  const { state } = useLocation()
  const navigate = useNavigate()

  if (!state?.rendeles_id) {
    navigate('/')
    return null
  }

  const { rendeles_id, osszeg, szallitas, fizetesiMod } = state

  const fizetesNev = { utanvet: '💵 Utánvét', bankkartya: '💳 Bankkártya', atutalas: '🏦 Banki átutalás' }

  return (
    <div className="sikeres-oldal">
      <div className="sikeres-kártya">
        <div className="sikeres-ikon">✓</div>
        <h1>Rendelés leadva!</h1>
        <p className="sikeres-rendeles-id">Rendelés azonosító: <strong>#{rendeles_id}</strong></p>
        <p className="sikeres-email-info">Visszaigazolást küldünk a <strong>{szallitas.email}</strong> címre.</p>

        <div className="sikeres-reszletek">
          <div className="sikeres-blokk">
            <div className="sikeres-blokk-cim">Szállítási cím</div>
            <div>{szallitas.nev}</div>
            <div>{szallitas.iranyitoszam} {szallitas.varos}, {szallitas.utca} {szallitas.hazszam}</div>
            <div>{szallitas.telefon}</div>
          </div>
          <div className="sikeres-blokk">
            <div className="sikeres-blokk-cim">Fizetési mód</div>
            <div>{fizetesNev[fizetesiMod]}</div>
          </div>
          <div className="sikeres-blokk">
            <div className="sikeres-blokk-cim">Végösszeg</div>
            <div className="sikeres-osszeg">{osszeg?.toLocaleString('hu-HU')} Ft</div>
          </div>
        </div>

        <div className="sikeres-gombok">
          <button onClick={() => navigate('/profil')} className="sikeres-profil-gomb">Rendeléseim megtekintése</button>
          <button onClick={() => navigate('/termekek')} className="sikeres-vasarlj-gomb">Folytatom a vásárlást</button>
        </div>
      </div>
    </div>
  )
}
