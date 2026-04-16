import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../src/context/AuthContext';
import Regisztracio from '../src/auth/Regisztracio';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

const renderReg = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <Regisztracio />
      </AuthProvider>
    </MemoryRouter>
  );

describe('<Regisztracio />', () => {
  it('megjelennek a form mezők', () => {
    renderReg();
    expect(screen.getByRole('heading', { name: /Regisztráció/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Kovács/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/pelda@email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Min\. 6/i)).toBeInTheDocument();
  });

  it('hibát ad, ha a két jelszó nem egyezik', async () => {
    const user = userEvent.setup();
    renderReg();
    await user.type(screen.getByPlaceholderText(/Kovács/i), 'Teszt');
    await user.type(screen.getByPlaceholderText(/pelda@email/i), 'a@b.hu');
    await user.type(screen.getByPlaceholderText(/Min\. 6/i), 'titok123');
    await user.type(screen.getByPlaceholderText('••••••••'), 'masik123');
    await user.click(screen.getByRole('button', { name: /Regisztráció/i }));
    expect(await screen.findByText(/nem egyezik/i)).toBeInTheDocument();
  });

  it('hibát ad, ha a jelszó rövidebb mint 6 karakter', async () => {
    const user = userEvent.setup();
    renderReg();
    await user.type(screen.getByPlaceholderText(/Kovács/i), 'X');
    await user.type(screen.getByPlaceholderText(/pelda@email/i), 'a@b.hu');
    await user.type(screen.getByPlaceholderText(/Min\. 6/i), '12345');
    await user.type(screen.getByPlaceholderText('••••••••'), '12345');
    await user.click(screen.getByRole('button', { name: /Regisztráció/i }));
    expect(await screen.findByText(/6 karakter/i)).toBeInTheDocument();
  });

  it('sikeres regisztráció: token mentődik és navigate /profil', async () => {
    const user = userEvent.setup();
    renderReg();
    await user.type(screen.getByPlaceholderText(/Kovács/i), 'Új User');
    await user.type(screen.getByPlaceholderText(/pelda@email/i), 'uj@pelda.hu');
    await user.type(screen.getByPlaceholderText(/Min\. 6/i), 'titok123');
    await user.type(screen.getByPlaceholderText('••••••••'), 'titok123');
    await user.click(screen.getByRole('button', { name: /Regisztráció/i }));
    await waitFor(() => {
      expect(localStorage.getItem('rei_token')).toBe('fake-jwt-token');
    });
    expect(navigateMock).toHaveBeenCalledWith('/profil');
  });

  it('foglalt email-re 409 hibaüzenet jelenik meg', async () => {
    const user = userEvent.setup();
    renderReg();
    await user.type(screen.getByPlaceholderText(/Kovács/i), 'X');
    await user.type(screen.getByPlaceholderText(/pelda@email/i), 'foglalt@pelda.hu');
    await user.type(screen.getByPlaceholderText(/Min\. 6/i), 'titok123');
    await user.type(screen.getByPlaceholderText('••••••••'), 'titok123');
    await user.click(screen.getByRole('button', { name: /Regisztráció/i }));
    expect(await screen.findByText(/már regisztrálva/i)).toBeInTheDocument();
  });

  it('bejelentkezés link megjelenik', () => {
    renderReg();
    const link = screen.getByRole('link', { name: /Jelentkezz be/i });
    expect(link).toHaveAttribute('href', '/bejelentkezes');
  });
});
