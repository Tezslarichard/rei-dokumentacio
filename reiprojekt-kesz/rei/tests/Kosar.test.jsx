import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from './msw-server';
import { AuthProvider } from '../src/context/AuthContext';
import { KosarProvider } from '../src/context/KosarContext';
import Kosar from '../src/kosar/Kosar';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

const renderKosar = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <KosarProvider>
          <Kosar />
        </KosarProvider>
      </AuthProvider>
    </MemoryRouter>
  );

// User bejelentkeztetése localStorage-en át (mount előtt)
const loginLS = () => {
  localStorage.setItem('rei_token', 'fake-jwt');
  localStorage.setItem('rei_felhasznalo', JSON.stringify({ id: 1, email: 'a@b.hu' }));
};

describe('<Kosar />', () => {
  it('kijelentkezve "Bejelentkezés szükséges" üzenet', () => {
    renderKosar();
    expect(screen.getByText(/Bejelentkezés szükséges/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Bejelentkezés/i }))
      .toHaveAttribute('href', '/bejelentkezes');
  });

  it('bejelentkezve, üres kosárra "A kosár üres" üzenet', async () => {
    loginLS();
    renderKosar();
    expect(await screen.findByText(/A kosár üres/i)).toBeInTheDocument();
  });

  it('"Vásárolj most" gomb navigate /termekek-re', async () => {
    loginLS();
    renderKosar();
    const btn = await screen.findByRole('button', { name: /Vásárolj most/i });
    await userEvent.setup().click(btn);
    expect(navigateMock).toHaveBeenCalledWith('/termekek');
  });

  it('tételekkel megjeleníti a neveket, árakat, végösszeget', async () => {
    loginLS();
    server.use(
      http.get('http://localhost:5000/api/kosar', () =>
        HttpResponse.json([
          { id: 1, termek_id: 1, mennyiseg: 2, name: 'Póló A', price: '1 500 Ft', color: 'fekete', stock: 10 },
        ])
      )
    );
    renderKosar();
    await waitFor(() => expect(screen.getByText('Póló A')).toBeInTheDocument());
    expect(screen.getByText('1 500 Ft')).toBeInTheDocument();
    // végösszeg: 3 000 Ft (2*1500)
    expect(screen.getAllByText(/3\D*000/).length).toBeGreaterThan(0);
  });

  it('+ gomb növeli a mennyiséget (API hívás)', async () => {
    loginLS();
    let putCalled = false;
    server.use(
      http.get('http://localhost:5000/api/kosar', () =>
        HttpResponse.json([
          { id: 1, termek_id: 1, mennyiseg: 1, name: 'X', price: '100 Ft', stock: 10 },
        ])
      ),
      http.put('http://localhost:5000/api/kosar/:id', () => {
        putCalled = true;
        return HttpResponse.json({ success: true });
      })
    );
    renderKosar();
    const plus = await screen.findByRole('button', { name: '+' });
    await userEvent.setup().click(plus);
    await waitFor(() => expect(putCalled).toBe(true));
  });

  it('− gomb disabled, ha mennyiség = 1', async () => {
    loginLS();
    server.use(
      http.get('http://localhost:5000/api/kosar', () =>
        HttpResponse.json([
          { id: 1, termek_id: 1, mennyiseg: 1, name: 'X', price: '100 Ft', stock: 10 },
        ])
      )
    );
    renderKosar();
    const minus = await screen.findByRole('button', { name: '−' });
    expect(minus).toBeDisabled();
  });

  it('+ gomb disabled, ha mennyiség = stock', async () => {
    loginLS();
    server.use(
      http.get('http://localhost:5000/api/kosar', () =>
        HttpResponse.json([
          { id: 1, termek_id: 1, mennyiseg: 3, name: 'X', price: '100 Ft', stock: 3 },
        ])
      )
    );
    renderKosar();
    const plus = await screen.findByRole('button', { name: '+' });
    expect(plus).toBeDisabled();
  });

  it('× (törlés) gomb DELETE hívást indít', async () => {
    loginLS();
    let deleted = false;
    server.use(
      http.get('http://localhost:5000/api/kosar', () =>
        HttpResponse.json([
          { id: 1, termek_id: 1, mennyiseg: 2, name: 'X', price: '100 Ft', stock: 10 },
        ])
      ),
      http.delete('http://localhost:5000/api/kosar/:id', () => {
        deleted = true;
        return HttpResponse.json({ success: true });
      })
    );
    renderKosar();
    const del = await screen.findByRole('button', { name: '✕' });
    await userEvent.setup().click(del);
    await waitFor(() => expect(deleted).toBe(true));
  });

  it('"Tovább a fizetéshez" gomb navigate /fizetes-re', async () => {
    loginLS();
    server.use(
      http.get('http://localhost:5000/api/kosar', () =>
        HttpResponse.json([
          { id: 1, termek_id: 1, mennyiseg: 1, name: 'X', price: '100 Ft', stock: 10 },
        ])
      )
    );
    renderKosar();
    const btn = await screen.findByRole('button', { name: /Tovább a fizetéshez/i });
    await userEvent.setup().click(btn);
    expect(navigateMock).toHaveBeenCalledWith('/fizetes');
  });
});
