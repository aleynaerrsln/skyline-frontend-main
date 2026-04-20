import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Reports from '../Reports';
import * as api from '../../services/api';
import * as perms from '../../utils/permissions';
import '@testing-library/jest-dom/vitest';

// 1. React Router Mock
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: () => ({ user: { _id: 'u1', name: 'Patron' } }),
  };
});

// 2. API Mock
vi.mock('../../services/api', () => ({
  getProjects: vi.fn(),
  getAllTasks: vi.fn(),
  getTeamMembers: vi.fn()
}));

// 3. Yetki Mock
vi.mock('../../utils/permissions', () => ({
  hasPerm: vi.fn(),
}));

describe('Reports (Raporlar) Bileşeni', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    perms.hasPerm.mockReturnValue(true);
  });

  it('Veritabanından gelen verilerle İş Yükü (Workload) tablosu doğru render edilmeli', async () => {
    api.getProjects.mockResolvedValueOnce({ 
      data: [{ _id: 'p1', status: 'active' }, { _id: 'p2', status: 'completed' }] 
    });
    
    api.getTeamMembers.mockResolvedValueOnce({ 
      data: [{ _id: 'm1', name: 'Ahmet', surname: 'Yılmaz' }] 
    });
    
    api.getAllTasks.mockResolvedValueOnce({ 
      data: [
        { 
          _id: 't1', 
          status: 'done', 
          assignees: [{ _id: 'm1', name: 'Ahmet', surname: 'Yılmaz' }] 
        }
      ] 
    });

    render(
      <MemoryRouter>
        <Reports />
      </MemoryRouter>
    );

    expect(api.getProjects).toHaveBeenCalledTimes(1);
    expect(api.getTeamMembers).toHaveBeenCalledTimes(1);
    expect(api.getAllTasks).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByText('Member')).toBeInTheDocument();
      expect(screen.getByText('Completion %')).toBeInTheDocument();
    });

    // ÇÖZÜM: getAllByText ile tüm "Ahmet Yılmaz" yazılarını bul ve dizinin ilk elemanını doğrula
    const ahmetElements = screen.getAllByText('Ahmet Yılmaz');
    expect(ahmetElements.length).toBeGreaterThan(0);
    expect(ahmetElements[0]).toBeInTheDocument();
  });
});