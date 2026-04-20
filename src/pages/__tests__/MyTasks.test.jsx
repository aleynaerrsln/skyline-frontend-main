import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import MyTasks from '../MyTasks';
import * as api from '../../services/api';
import '@testing-library/jest-dom/vitest';

// 1. React Router Mock (Navigasyonu ve Kullanıcıyı taklit ediyoruz)
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useOutletContext: () => ({ user: { _id: 'u1', name: 'Can', surname: 'Test' } }),
  };
});

// 2. API Mock
vi.mock('../../services/api', () => ({
  getMyTasks: vi.fn(),
}));

describe('MyTasks Bileşeni', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTasks = [
    {
      _id: 'task-1',
      title: 'Kullanıcı Girişi Animasyonları',
      status: 'in_progress',
      priority: 'high',
      project: { _id: 'proj-123', name: 'Skyline Frontend' },
      assignees: [{ _id: 'u1', name: 'Can', surname: 'Test', role: 'developer' }],
      dueDate: '2026-05-01'
    },
    {
      _id: 'task-2',
      title: 'Veritabanı Optimizasyonu',
      status: 'todo',
      priority: 'medium',
      project: { _id: 'proj-456', name: 'Skyline Backend' },
      assignees: [{ _id: 'u1', name: 'Can', surname: 'Test', role: 'developer' }]
    }
  ];

  it('API den gelen görevler doğru şekilde listelenmeli', async () => {
    // API çağrıldığında sahte görevleri döndür
    api.getMyTasks.mockResolvedValueOnce({ data: mockTasks });

    render(
      <MemoryRouter>
        <MyTasks />
      </MemoryRouter>
    );

    // useEffect içinde API'nin çağrıldığını onayla
    expect(api.getMyTasks).toHaveBeenCalledTimes(1);

    // Görev başlıklarının ekranda belirmesini bekle
    await waitFor(() => {
      expect(screen.getByText('Kullanıcı Girişi Animasyonları')).toBeInTheDocument();
      expect(screen.getByText('Veritabanı Optimizasyonu')).toBeInTheDocument();
    });

    // Proje isimlerinin de ekranda olduğunu onayla
    expect(screen.getByText('Skyline Frontend')).toBeInTheDocument();
  });

  it('Bir göreve tıklandığında detayları açılmalı ve Board a yönlendirme butonu çalışmalı', async () => {
    api.getMyTasks.mockResolvedValueOnce({ data: mockTasks });

    render(
      <MemoryRouter>
        <MyTasks />
      </MemoryRouter>
    );

    // Görevlerin yüklenmesini bekle
    await waitFor(() => {
      expect(screen.getByText('Kullanıcı Girişi Animasyonları')).toBeInTheDocument();
    });

    // Görev başlığına tıkla (Bu işlem sağ panelde detayı açmalı)
    const taskCard = screen.getByText('Kullanıcı Girişi Animasyonları');
    fireEvent.click(taskCard);

    // Detay panelindeki "Go to board →" butonunun ekranda belirdiğini onayla
    await waitFor(() => {
      expect(screen.getByText('Go to board →')).toBeInTheDocument();
    });

    // Butona tıkla
    const goToBoardBtn = screen.getByText('Go to board →');
    fireEvent.click(goToBoardBtn);

    // useNavigate kancasının doğru Proje ID'si ile çağrıldığını test et
    // Bizim task-1'in proje ID'si 'proj-123' idi. 
    // Yönlendirme adresi: /app/projects/proj-123 olmalı
    expect(mockNavigate).toHaveBeenCalledWith('/app/projects/proj-123');
  });
});