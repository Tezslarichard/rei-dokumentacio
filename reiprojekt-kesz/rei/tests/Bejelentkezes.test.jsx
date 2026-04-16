import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from './msw-server';
import { AuthProvider } from '../src/context/AuthContext';
import Bejelentkezes from '../src/auth/Bejelentkezes';

// Az useNavigate mockolása
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

const renderBejelentkezes = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <Bejelentkezes />
      </AuthProvider>
    </MemoryRouter>
  );

describe('<Bejelentkezes />', () => {
  it('megjelenik a cím és az input mezők', () => {
    renderBejelentkezes();
    expect(screen.getByRole('heading', { name: /Bejelentkezés/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/pelda@email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bejelentkezés/i })).toBeInTheDocument();
  });

  it('sikeres bejelentkezés: tokent ment a localStorage-be és navigate', async () => {
    const user = userEvent.setup();
    renderBejelentkezes();

    await user.type(screen.getByPlaceholderText(/pelda@email/i), 'jo@pelda.hu');
    await user.type(screen.getByPlaceholderText('••••••••'), 'titok123');
    await user.click(screen.getByRole('button', { name: /Bejelentkezés/i }));

    await waitFor(() => {
      expect(localStorage.getItem('rei_token')).toBe('fake-jwt-token');
    });
    expect(navigateMock).toHaveBeenCalledWith('/profil');
  });

  it('hibás credentials-szel hibaüzenet jelenik meg', async () => {
    const user = userEvent.setup();
    renderBejelentkezes();

    await user.type(screen.getByPlaceholderText(/pelda@email/i), 'rossz@pelda.hu');
    await user.type(screen.getByPlaceholderText('••••••••'), 'rosszjelszo');
    await user.click(screen.getByRole('button', { name: /Bejelentkezés/i }));

    expect(await screen.findByText(/Hibás e-mail cím vagy jelszó/i)).toBeInTheDocument();
    expect(localStorage.getItem('rei_token')).toBeNull();
  });

  it('hálózati hiba esetén hibaüzenet', async () => {
    server.use(
      http.post('http://localhost:5000/api/bejelentkezes', () => HttpResponse.error())
    );
    const user = userEvent.setup();
    renderBejelentkezes();

    await user.type(screen.getByPlaceholderText(/pelda@email/i), 'a@b.hu');
    await user.type(screen.getByPlaceholderText('••••••••'), 'titok123');
    await user.click(screen.getByRole('button', { name: /Bejelentkezés/i }));

    expect(await screen.findByText(/Nem sikerült csatlakozni/i)).toBeInTheDocument();
  });

  it('link a regisztrációhoz látszik és helyes a href', () => {
    renderBejelentkezes();
    const link = screen.getByRole('link', { name: /Regisztrálj/i });
    expect(link).toHaveAttribute('href', '/regisztracio');
  });
});
