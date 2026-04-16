import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { KosarProvider } from './context/KosarContext';
import Header from './components/header/Header';
import Footer from './components/footer/Footer';

import HomePage from './components/homepage/homepage';
import TermekLista from './termekek/termekcat';
import TermekReszlet from './termekek/termek';
import KapcsolatPage from './kapcsolat/kapcsolat';
import Bejelentkezes from './auth/Bejelentkezes';
import Regisztracio from './auth/Regisztracio';
import Profil from './profil/Profil';
import Kosar from './kosar/Kosar';
import Fizetes from './fizetes/Fizetes';
import RendelesSikeres from './fizetes/RendelesSikeres';
import Admin from './admin/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <KosarProvider>
          <Routes>
            {/* Admin panel – header/footer nélkül */}
            <Route path="/admin" element={<Admin />} />

            {/* Normál oldalak */}
            <Route path="/*" element={
              <>
                <Header />
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/termekek" element={<TermekLista />} />
                  <Route path="/termekek/:id" element={<TermekReszlet />} />
                  <Route path="/kapcsolat" element={<KapcsolatPage />} />
                  <Route path="/bejelentkezes" element={<Bejelentkezes />} />
                  <Route path="/regisztracio" element={<Regisztracio />} />
                  <Route path="/profil" element={<Profil />} />
                  <Route path="/kosar" element={<Kosar />} />
                  <Route path="/fizetes" element={<Fizetes />} />
                  <Route path="/rendeles-sikeres" element={<RendelesSikeres />} />
                </Routes>
                <Footer />
              </>
            } />
          </Routes>
        </KosarProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
