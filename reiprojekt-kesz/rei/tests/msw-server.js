import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const API = 'http://localhost:5000/api';

// Alap handlerek - a tesztek override-olhatják server.use()-zal
export const handlers = [
  // Bejelentkezés
  http.post(`${API}/bejelentkezes`, async ({ request }) => {
    const body = await request.json();
    if (body.email === 'jo@pelda.hu' && body.password === 'titok123') {
      return HttpResponse.json({
        success: true,
        token: 'fake-jwt-token',
        felhasznalo: { id: 1, name: 'Teszt User', email: body.email, is_admin: 0 },
      });
    }
    return HttpResponse.json(
      { error: 'Hibás e-mail cím vagy jelszó!' },
      { status: 401 }
    );
  }),

  // Regisztráció
  http.post(`${API}/regisztracio`, async ({ request }) => {
    const body = await request.json();
    if (body.email === 'foglalt@pelda.hu') {
      return HttpResponse.json(
        { error: 'Ez az e-mail cím már regisztrálva van!' },
        { status: 409 }
      );
    }
    return HttpResponse.json(
      {
        success: true,
        token: 'fake-jwt-token',
        felhasznalo: { id: 2, name: body.name, email: body.email, is_admin: 0 },
      },
      { status: 201 }
    );
  }),

  // Kosár lekérés - alapból üres
  http.get(`${API}/kosar`, () => HttpResponse.json([])),

  // Kosárba rakás
  http.post(`${API}/kosar`, () =>
    HttpResponse.json({ success: true, message: 'Termék hozzáadva a kosárhoz!' })
  ),

  // Kosár tétel módosítás
  http.put(`${API}/kosar/:id`, () =>
    HttpResponse.json({ success: true, message: 'Mennyiség frissítve!' })
  ),

  // Kosár tétel törlés
  http.delete(`${API}/kosar/:id`, () =>
    HttpResponse.json({ success: true, message: 'Termék eltávolítva!' })
  ),

  // Kosár ürítés
  http.delete(`${API}/kosar`, () =>
    HttpResponse.json({ success: true, message: 'Kosár kiürítve!' })
  ),

  // Termékek
  http.get(`${API}/termekek`, () =>
    HttpResponse.json([
      { id: 1, name: 'Teszt Póló', price: '3 000 Ft', stock: 10, color: 'fekete' },
      { id: 2, name: 'Teszt Nadrág', price: '8 000 Ft', stock: 5, color: 'kék' },
    ])
  ),
  http.get(`${API}/termekek/:id`, ({ params }) =>
    HttpResponse.json({
      id: Number(params.id),
      name: 'Teszt Termék',
      price: '5 000 Ft',
      description: 'Leírás',
      color: 'fekete',
      stock: 10,
      kategoria_nev: 'Pólók',
    })
  ),

  // Kategóriák
  http.get(`${API}/kategoriak`, () =>
    HttpResponse.json([
      { id: 1, name: 'Pólók', slug: 'polok' },
      { id: 2, name: 'Nadrágok', slug: 'nadragok' },
    ])
  ),

  // Profil
  http.get(`${API}/profil`, () =>
    HttpResponse.json({
      id: 1,
      name: 'Teszt User',
      email: 'jo@pelda.hu',
      is_admin: 0,
      created_at: '2024-01-01',
    })
  ),
  http.put(`${API}/profil`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      message: 'Profil sikeresen frissítve!',
      felhasznalo: { id: 1, name: body.name, email: body.email, is_admin: 0 },
    });
  }),

  // Rendelések
  http.get(`${API}/rendelesek`, () => HttpResponse.json([])),
  http.post(`${API}/rendelesek`, () =>
    HttpResponse.json({ success: true, rendeles_id: 100 }, { status: 201 })
  ),

  // Hírlevél
  http.post(`${API}/hirlevel`, async ({ request }) => {
    const body = await request.json();
    if (body.email === 'foglalt@pelda.hu') {
      return HttpResponse.json(
        { error: 'Ez az email cím már fel van iratkozva' },
        { status: 409 }
      );
    }
    return HttpResponse.json({ success: true, message: 'Sikeres feliratkozás!' });
  }),

  // Kapcsolat
  http.post(`${API}/kapcsolat`, () =>
    HttpResponse.json({ success: true, message: 'Üzenet elküldve!' })
  ),
];

export const server = setupServer(...handlers);
