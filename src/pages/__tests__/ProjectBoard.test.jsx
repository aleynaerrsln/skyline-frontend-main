import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ProjectBoard from '../ProjectBoard';
import * as api from '../../services/api';
import * as perms from '../../utils/permissions';
import '@testing-library/jest-dom/vitest';

// 1. React Router Mock (Bu sefer useParams'ı da taklit ediyoruz!)
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ projectId: 'proje-123' }), // URL'de proje-123 yazıyormuş gibi davran
    useOutletContext: () => ({ user: { _id: 'user1', name: 'Can' } }),
    useNavigate: () => vi.fn(),
  };
});

// 2. API Mock (Kanban tahtasının tüm isteklerini engelliyoruz)
vi.mock('../../services/api', () => ({
  getProject: vi.fn(),
  getTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  reorderTasks: vi.fn()
}));

// 3. Yetkilendirme Mock
vi.mock('../../utils/permissions', () => ({
  hasPerm: vi.fn()
}));

describe('ProjectBoard (Kanban) Bileşeni', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    perms.hasPerm.mockReturnValue(true); // Test için tüm yetkileri açtık
  });

  it('Proje detaylarını ve Kanban sütunlarını boş olarak doğru render etmeli', async () => {
    // API'den projenin başlığı ve özellikleri gelsin
    api.getProject.mockResolvedValueOnce({ data: { _id: 'proje-123', name: 'Skyline Beta Sürümü' } });
    // Henüz hiç görev (task) eklenmemiş olsun
    api.getTasks.mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <ProjectBoard />
      </MemoryRouter>
    );

    // useEffect içinde API isteklerinin atıldığını doğrulayalım
    expect(api.getProject).toHaveBeenCalledWith('proje-123');
    expect(api.getTasks).toHaveBeenCalledWith('proje-123');

    // API'den gelen proje adının ekrana basılmasını bekliyoruz
    await waitFor(() => {
      expect(screen.getByText('Skyline Beta Sürümü')).toBeInTheDocument();
    });

    // 5 Ana Kanban Sütununun (Kolonunun) ekranda var olduğunu doğruluyoruz
    expect(screen.getByText('Backlog')).toBeInTheDocument();
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('In Review')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('API den gelen görevler (Tasks) Kanban tahtasında listelenmeli', async () => {
    api.getProject.mockResolvedValueOnce({ data: { _id: 'proje-123', name: 'Skyline Beta Sürümü' } });
    
    // Veritabanından iki farklı görev (biri To Do, biri Done sütununda) geliyormuş gibi yapalım
    const mockTasks = [
      { _id: 'task-1', title: 'Login Animasyonlarını Ekle', status: 'todo', priority: 'high' },
      { _id: 'task-2', title: 'Veritabanı Şemasını Çiz', status: 'done', priority: 'low' }
    ];
    api.getTasks.mockResolvedValueOnce({ data: mockTasks });

    render(
      <MemoryRouter>
        <ProjectBoard />
      </MemoryRouter>
    );

    // Görev başlıklarının sorunsuz bir şekilde ekranda listelendiğinden emin oluyoruz
    await waitFor(() => {
      expect(screen.getByText('Login Animasyonlarını Ekle')).toBeInTheDocument();
      expect(screen.getByText('Veritabanı Şemasını Çiz')).toBeInTheDocument();
    });
  });
});