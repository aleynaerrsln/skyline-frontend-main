import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import * as api from '../../services/api';
import '@testing-library/jest-dom/vitest';

// 1. React Router'ı Mock'luyoruz (useOutletContext'ten gelen "user" bilgisini taklit etmek için)
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: () => ({ 
      user: { _id: 'user1', name: 'Can', surname: 'Test', email: 'can@test.com' } 
    }),
  };
});

// 2. API'yi Mock'luyoruz
vi.mock('../../services/api', () => ({
  getProjects: vi.fn(),
}));

describe('Dashboard Bileşeni', () => {
  // Her testten önce mock verilerini temizle
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Projeler API den başarıyla çekildiğinde istatistikler doğru hesaplanmalı', async () => {
    // 3. Senaryo: Veritabanından 4 farklı proje geldiğini simüle ediyoruz
    const mockProjects = [
      { _id: 'p1', name: 'E-Ticaret Yenileme', status: 'active', progress: 50, color: '#ff0000' },
      { _id: 'p2', name: 'Mobil Uygulama', status: 'active', progress: 20, color: '#00ff00' },
      { _id: 'p3', name: 'Veritabanı Göçü', status: 'pending', progress: 0, color: '#0000ff' },
      { _id: 'p4', name: 'Logo Tasarımı', status: 'completed', progress: 100, color: '#ffff00' },
    ];

    // Dashboard render edildiğinde getProjects çağrılırsa bu mock listeyi döndürsün
    api.getProjects.mockResolvedValueOnce({ data: mockProjects });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // API çağrıldı mı diye kontrol ediyoruz
    expect(api.getProjects).toHaveBeenCalledTimes(1);

    // useEffect çalıştığı ve asenkron olduğu için arayüzün güncellenmesini "waitFor" ile bekliyoruz
    await waitFor(() => {
      // 4 proje var (Total = 4)
      expect(screen.getByText('4')).toBeInTheDocument();
      // 2 tane "active" proje var (Active = 2)
      expect(screen.getByText('2')).toBeInTheDocument();
      
      // Proje isimlerinin ekranda listelendiğinden emin oluyoruz
      expect(screen.getByText('E-Ticaret Yenileme')).toBeInTheDocument();
      expect(screen.getByText('Logo Tasarımı')).toBeInTheDocument();
    });
  });

  it('Kullanıcının hiç projesi yoksa ekranda boş durum (Empty State) mesajı gösterilmeli', async () => {
    // Bu sefer veritabanından boş dizi döndüğünü simüle ediyoruz
    api.getProjects.mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Sayfa güncellendikten sonra özel uyarı mesajının çıktığını doğruluyoruz
    await waitFor(() => {
      expect(screen.getByText('No projects yet. Create your first one!')).toBeInTheDocument();
    });

    // İstatistiklerin 0 olarak ayarlandığını kontrol ediyoruz (Ekranda en az 4 tane '0' rakamı olmalı)
    await waitFor(() => {
        const zeroElements = screen.getAllByText('0');
        expect(zeroElements.length).toBeGreaterThanOrEqual(4);
    });
  });
});