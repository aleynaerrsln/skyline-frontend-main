import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Calendar from '../Calendar';
import * as api from '../../services/api';
import * as perms from '../../utils/permissions';
import '@testing-library/jest-dom/vitest';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: () => ({ user: { _id: 'u1', name: 'Can' } }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../../services/api', () => ({
  getAllTasks: vi.fn(),
  getEvents: vi.fn(),
  createEvent: vi.fn(),
  deleteEvent: vi.fn(),
}));

vi.mock('../../utils/permissions', () => ({
  hasPerm: vi.fn(),
}));

describe('Calendar (Takvim) Bileşeni', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    perms.hasPerm.mockReturnValue(true);
  });

  it('Sayfa yüklendiğinde API den gelen görevler ve etkinlikler takvimde listelenmeli', async () => {
    const simdi = new Date();
    // Ayın 15'i öğlen 12'ye sabitliyoruz (Gün kaymasını önlemek için)
    const garantiTarih = new Date(simdi.getFullYear(), simdi.getMonth(), 15, 12, 0, 0).toISOString();
    
    const mockTasks = [
      { 
        _id: 't1', 
        title: 'Yedekleme', 
        status: 'todo', 
        endDate: garantiTarih, // <--- HATAYI BURADA ÇÖZDÜK! (dueDate yerine endDate yazdık)
        project: { _id: 'p1', name: 'Altyapı' },
        assignees: [] 
      }
    ];
    
    const mockEvents = [
      { 
        _id: 'e1', 
        title: 'Toplanti', 
        date: garantiTarih, 
        color: '#ff6b6b' 
      }
    ];

    api.getAllTasks.mockResolvedValueOnce({ data: mockTasks });
    api.getEvents.mockResolvedValueOnce({ data: mockEvents });

    render(
      <MemoryRouter>
        <Calendar />
      </MemoryRouter>
    );

    // Artık hem Yedekleme (Task) hem Toplanti (Event) ekranda olmalı!
    await waitFor(() => {
      expect(screen.getByText(/Yedekleme/i)).toBeInTheDocument();
      expect(screen.getByText(/Toplanti/i)).toBeInTheDocument();
    });
  });

  it('Veritabanında hiç görev veya etkinlik yoksa sayfa yine de çökmeden render edilmeli', async () => {
    api.getAllTasks.mockResolvedValueOnce({ data: [] });
    api.getEvents.mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <Calendar />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Mon/i)).toBeInTheDocument();
    });
  });
});