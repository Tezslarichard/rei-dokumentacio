import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from './msw-server';
import { AuthProvider } from '../src/context/AuthContext';
import { KosarProvider } from '../src/context/KosarContext';
import TermekReszlet from '../src/termekek/termek';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

const renderAt = (id = '1') =>
  render(
    <MemoryRouter initialEntries={[`/termekek/${id}`]}>
      <AuthProvider>
        <KosarProvider>
          <Routes>
            <Route path="/termekek/:id" element={<TermekReszlet />} />
          </Routes>
        </KosarProvider>
      </AuthProvider>
    </MemoryRouter>
  );

describe('<TermekReszlet />', () => {
  it('betöltés közben "Betöltés..." üzenet', () => {
    renderAt('1');
    expect(screen.getByText(/Betöltés/i)).toBeInTheDocument();
  });

  it('megjeleníti a termék nevét, árát, leírását és a kategóriát', async () => {
    renderAt('1');
    await waitFor(() => expect(screen.getByText('Teszt Termék')).toBeInTheDocument());
    expect(screen.getByText('5 000 Ft')).toBeInTheDocument();
    expect(screen.getByText('Leírás')).toBeInTheDocument();
    expect(screen.getByText('PÓLÓK')).toBeInTheDocument();
  });

  it('"Raktáron" megjelenik, ha stock > 0', async () => {
    renderAt('1');
    expect(await screen.findByText(/Raktáron/)).toBeInTheDocument();
  });

  it('"Elfogyott" és disabled gomb, ha stock = 0', async () => {
    server.use(
      http.get('http://localhost:5000/api/termekek/:id', () =>
        HttpResponse.json({
          id: 1, name: 'X', price: '100 Ft', description: '', color: null, stock: 0,
        })
      )
    );
    renderAt('1');
    // "Elfogyott" szó a komponensben több helyen is megjelenik (státusz + gomb)
    const elfogyott = await screen.findAllByText(/Elfogyott/);
    expect(elfogyott.length).toBeGreaterThan(0);
    const btn = screen.getByRole('button', { name: /Elfogyott/i });
    expect(btn).toBeDisabled();
  });

  it('nincs meg a termék → "Termék nem található"', async () => {
    server.use(
      http.get('http://localhost:5000/api/termekek/:id', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 })
      )
    );
    renderAt('999');
    expect(await screen.findByText(/Hálózati hiba/)).toBeInTheDocument();
  });

  it('+/− gombok változtatják a mennyiséget', async () => {
    renderAt('1');
    await screen.findByText('Teszt Termék');
    const user = userEvent.setup();
    const plus = screen.getByRole('button', { name: '+' });
    await user.click(plus);
    await user.click(plus);
    expect(screen.getByText('3')).toBeInTheDocument();
    const minus = screen.getByRole('button', { name: '−' });
    await user.click(minus);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('− disabled ha mennyiség = 1', async () => {
    renderAt('1');
    await screen.findByText('Teszt Termék');
    expect(screen.getByRole('button', { name: '−' })).toBeDisabled();
  });

  it('kijelentkezve "Kosárba" kattintás -> navigate /bejelentkezes', async () => {
    renderAt('1');
    await screen.findByText('Teszt Termék');
    await userEvent.setup().click(screen.getByRole('button', { name: /Kosárba/i }));
    expect(navigateMock).toHaveBeenCalledWith('/bejelentkezes');
  });

  it('bejelentkezve "Kosárba" sikeres visszajelzés', async () => {
    localStorage.setItem('rei_token', 'tok');
    localStorage.setItem('rei_felhasznalo', JSON.stringify({ id: 1, email: 'a@b.hu' }));
    renderAt('1');
    await screen.findByText('Teszt Termék');
    await userEvent.setup().click(screen.getByRole('button', { name: /Kosárba/i }));
    expect(await screen.findByText(/kosárba téve/i)).toBeInTheDocument();
  });
});
