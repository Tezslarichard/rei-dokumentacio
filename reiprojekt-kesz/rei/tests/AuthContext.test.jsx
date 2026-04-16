import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  it('kezdetben nincs bejelentkezett felhasználó', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.felhasznalo).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('bejelentkezés után elmenti a tokent és a user-t localStorage-be', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => {
      result.current.bejelentkezes('tok123', { id: 1, email: 'a@b.hu', is_admin: 0 });
    });
    expect(result.current.token).toBe('tok123');
    expect(result.current.felhasznalo).toMatchObject({ id: 1, email: 'a@b.hu' });
    expect(localStorage.getItem('rei_token')).toBe('tok123');
    expect(JSON.parse(localStorage.getItem('rei_felhasznalo'))).toMatchObject({ id: 1 });
  });

  it('kijelentkezés törli a localStorage-et és a state-et', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => {
      result.current.bejelentkezes('tok', { id: 1, email: 'a@b.hu' });
    });
    act(() => {
      result.current.kijelentkezes();
    });
    expect(result.current.felhasznalo).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('rei_token')).toBeNull();
    expect(localStorage.getItem('rei_felhasznalo')).toBeNull();
  });

  it('mount-kor visszatölti az adatokat a localStorage-ből', () => {
    localStorage.setItem('rei_token', 'mentett-token');
    localStorage.setItem('rei_felhasznalo', JSON.stringify({ id: 5, email: 'x@y.hu' }));
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.token).toBe('mentett-token');
    expect(result.current.felhasznalo).toEqual({ id: 5, email: 'x@y.hu' });
  });

  it('sérült JSON esetén tisztítja a localStorage-et', () => {
    localStorage.setItem('rei_token', 't');
    localStorage.setItem('rei_felhasznalo', 'ez-nem-valid-json');
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.felhasznalo).toBeNull();
    expect(localStorage.getItem('rei_token')).toBeNull();
    expect(localStorage.getItem('rei_felhasznalo')).toBeNull();
  });

  it('profilFrissites frissíti a user-t és a localStorage-et', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => {
      result.current.bejelentkezes('tok', { id: 1, name: 'Régi', email: 'a@b.hu' });
    });
    act(() => {
      result.current.profilFrissites({ id: 1, name: 'Új', email: 'a@b.hu' });
    });
    expect(result.current.felhasznalo.name).toBe('Új');
    expect(JSON.parse(localStorage.getItem('rei_felhasznalo')).name).toBe('Új');
  });

  it('useAuth Provider nélkül hibát dob', () => {
    expect(() => renderHook(() => useAuth())).toThrow(/must be used within AuthProvider/);
  });
});
