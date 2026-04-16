import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from './msw-server';
import Hirlevel from '../src/components/hirlevel/Hirlevel';

describe('<Hirlevel />', () => {
  it('megjelenik az email input és a gomb', () => {
    render(<Hirlevel />);
    expect(screen.getByPlaceholderText(/Email címed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Feliratkozás/i })).toBeInTheDocument();
  });

  it('sikeres feliratkozás esetén success üzenet', async () => {
    const user = userEvent.setup();
    render(<Hirlevel />);
    await user.type(screen.getByPlaceholderText(/Email címed/i), 'uj@pelda.hu');
    await user.click(screen.getByRole('button', { name: /Feliratkozás/i }));
    expect(await screen.findByText(/Sikeres feliratkozás/i)).toBeInTheDocument();
  });

  it('foglalt email esetén hibaüzenet', async () => {
    const user = userEvent.setup();
    render(<Hirlevel />);
    await user.type(screen.getByPlaceholderText(/Email címed/i), 'foglalt@pelda.hu');
    await user.click(screen.getByRole('button', { name: /Feliratkozás/i }));
    expect(await screen.findByText(/már fel van iratkozva/i)).toBeInTheDocument();
  });

  it('hálózati hiba esetén hibaüzenet', async () => {
    server.use(
      http.post('http://localhost:5000/api/hirlevel', () => HttpResponse.error())
    );
    const user = userEvent.setup();
    render(<Hirlevel />);
    await user.type(screen.getByPlaceholderText(/Email címed/i), 'a@b.hu');
    await user.click(screen.getByRole('button', { name: /Feliratkozás/i }));
    expect(await screen.findByText(/Hálózati hiba/i)).toBeInTheDocument();
  });

  it('sikeres feliratkozás után kiürül az email mező', async () => {
    const user = userEvent.setup();
    render(<Hirlevel />);
    const input = screen.getByPlaceholderText(/Email címed/i);
    await user.type(input, 'uj@pelda.hu');
    await user.click(screen.getByRole('button', { name: /Feliratkozás/i }));
    await screen.findByText(/Sikeres feliratkozás/i);
    expect(input.value).toBe('');
  });
});
