import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from './msw-server';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { KosarProvider, useKosar } from '../src/context/KosarContext';

const wrapper = ({ children }) => (
  <AuthProvider>
    <KosarProvider>{children}</KosarProvider>
  </AuthProvider>
);

// Kombinált hook - mindkét context-hez hozzáférünk
const useAll = () => ({ auth: useAuth(), kosar: useKosar() });

describe('KosarContext', () => {
  it('kijelentkezve üres a kosár', () => {
    const { result } = renderHook(() => useAll(), { wrapper });
    expect(result.current.kosar.kosarTetelek).toEqual([]);
    expect(result.current.kosar.kosarDarab).toBe(0);
    expect(result.current.kosar.kosarOsszeg).toBe(0);
  });

  it('bejelentkezés után betölti a kosarat', async () => {
    server.use(
      http.get('http://localhost:5000/api/kosar', () =>
        HttpResponse.json([
          { id: 1, termek_id: 1, mennyiseg: 2, name: 'A', price: '1 500 Ft', color: 'fekete', stock: 10 },
          { id: 2, termek_id: 2, mennyiseg: 1, name: 'B', price: '2 000 Ft', color: 'kék', stock: 5 },
        ])
      )
    );
    const { result } = renderHook(() => useAll(), { wrapper });
    act(() => {
      result.current.auth.bejelentkezes('tok', { id: 1, email: 'a@b.hu' });
    });
    await waitFor(() => {
      expect(result.current.kosar.kosarTetelek).toHaveLength(2);
    });
    // 2*1500 + 1*2000 = 5000
    expect(result.current.kosar.kosarOsszeg).toBe(5000);
    expect(result.current.kosar.kosarDarab).toBe(3);
  });

  it('kosarbaAd bejelentkezés nélkül hibát ad vissza', async () => {
    const { result } = renderHook(() => useAll(), { wrapper });
    const ret = await result.current.kosar.kosarbaAd(1, 1);
    expect(ret.error).toMatch(/Bejelentkezés/);
  });

  it('kosarbaAd bejelentkezve success-t ad vissza', async () => {
    const { result } = renderHook(() => useAll(), { wrapper });
    act(() => {
      result.current.auth.bejelentkezes('tok', { id: 1 });
    });
    let ret;
    await act(async () => {
      ret = await result.current.kosar.kosarbaAd(5, 2);
    });
    expect(ret.success).toBe(true);
  });

  it('kosarbaAd hibát ad vissza, ha a szerver 400-at küld', async () => {
    server.use(
      http.post('http://localhost:5000/api/kosar', () =>
        HttpResponse.json({ error: 'Nincs elegendő készlet!' }, { status: 400 })
      )
    );
    const { result } = renderHook(() => useAll(), { wrapper });
    act(() => {
      result.current.auth.bejelentkezes('tok', { id: 1 });
    });
    let ret;
    await act(async () => {
      ret = await result.current.kosar.kosarbaAd(5, 999);
    });
    expect(ret.error).toMatch(/készlet/i);
  });

  it('kosarUrit kiüríti a tételek listáját', async () => {
    server.use(
      http.get('http://localhost:5000/api/kosar', () =>
        HttpResponse.json([
          { id: 1, termek_id: 1, mennyiseg: 1, name: 'A', price: '100 Ft', stock: 10 },
        ])
      )
    );
    const { result } = renderHook(() => useAll(), { wrapper });
    act(() => {
      result.current.auth.bejelentkezes('tok', { id: 1 });
    });
    await waitFor(() => expect(result.current.kosar.kosarTetelek).toHaveLength(1));
    await act(async () => {
      await result.current.kosar.kosarUrit();
    });
    expect(result.current.kosar.kosarTetelek).toEqual([]);
  });

  it('ár parse: "1 500 Ft" formátumot helyesen olvas', async () => {
    server.use(
      http.get('http://localhost:5000/api/kosar', () =>
        HttpResponse.json([
          { id: 1, termek_id: 1, mennyiseg: 3, name: 'A', price: '1 500 Ft', stock: 10 },
        ])
      )
    );
    const { result } = renderHook(() => useAll(), { wrapper });
    act(() => {
      result.current.auth.bejelentkezes('tok', { id: 1 });
    });
    await waitFor(() => expect(result.current.kosar.kosarOsszeg).toBe(4500));
  });

  it('useKosar Provider nélkül hibát dob', () => {
    expect(() => renderHook(() => useKosar())).toThrow(/KosarProvider/);
  });
});
