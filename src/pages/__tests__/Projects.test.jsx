import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Projects from '../Projects';
import * as api from '../../services/api';
import * as perms from '../../utils/permissions';
import '@testing-library/jest-dom/vitest';

// 1. React Router Mock (useOutletContext ve useNavigate için)
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: () => ({ user: { _id: 'user1', name: 'Can', surname: 'Test' } }),
    useNavigate: () => vi.fn(),
  };
});

// 2. API Mock (Gerçek veritabanına bağlanmayı engelliyoruz)
vi.mock('../../services/api', () => ({
  getProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}));

// 3. Permissions Mock (Yetki kontrolünü kontrol etmek için)
vi.mock('../../utils/permissions', () => ({
  hasPerm: vi.fn(),
}));

// 4. Modal Bileşenlerini Mockluyoruz (Testi karmaşıklaştırmaması için)
vi.mock('../../components/CreateProjectModal', () => ({
  default: () => <div data-testid="create-modal">Modal Mock</div>
}));
vi.mock('../../components/EditProjectModal', () => ({
  default: () => <div data-testid="edit-modal">Modal Mock</div>
}));

describe('Projects Bileşeni', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Testlerimizde varsayılan olarak kullanıcının her şeye yetkisi olduğunu varsayalım
    perms.hasPerm.mockReturnValue(true); 
  });

  it('Sayfa yüklendiğinde projeler API den çekilip ekranda listelenmeli', async () => {
    const mockProjects = [
      { 
        _id: 'p1', name: 'Skyline Frontend Yenileme', status: 'active', priority: 'high', 
        startDate: '2026-01-01', endDate: '2026-12-31', members: [] 
      },
      { 
        _id: 'p2', name: 'Skyline Mobil Uygulama', status: 'pending', priority: 'medium', 
        startDate: '2026-02-01', endDate: '2026-10-31', members: [] 
      }
    ];

    // API çağrıldığında bu sahte listeyi döndür
    api.getProjects.mockResolvedValueOnce({ data: mockProjects });

    render(
      <MemoryRouter>
        <Projects />
      </MemoryRouter>
    );

    // İlk yüklemede API'nin çağrıldığından emin olalım
    expect(api.getProjects).toHaveBeenCalled();

    // Verilerin ekranda render edilmesini bekleyelim
    await waitFor(() => {
      expect(screen.getByText('Skyline Frontend Yenileme')).toBeInTheDocument();
      expect(screen.getByText('Skyline Mobil Uygulama')).toBeInTheDocument();
    });
  });

  it('Kategorilere (Sekmelere) tıklandığında API yeni filtre ile tekrar çağrılmalı', async () => {
    // API her çağrıldığında boş dizi dönsün (Amacımız sadece tetiklenip tetiklenmediğini test etmek)
    api.getProjects.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <Projects />
      </MemoryRouter>
    );

    // Sayfa ilk yüklendiğinde 1 kere çağrıldığını onayla (varsayılan "all" sekmesi için)
    await waitFor(() => {
      expect(api.getProjects).toHaveBeenCalledTimes(1);
    });

    // Ekranda "Active" sekmesini (Tab) bul ve ona tıkla
    const activeTab = screen.getByText('Active');
    fireEvent.click(activeTab);

    // Tıkladıktan sonra useEffect'in tetiklenip API'ye "Bana Active olanları getir" diyerek
    // 2. kez istek attığını doğrula
    await waitFor(() => {
      expect(api.getProjects).toHaveBeenCalledTimes(2);
    });
  });
});