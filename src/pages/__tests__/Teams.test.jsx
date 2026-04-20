import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Teams from '../Teams';
import * as api from '../../services/api';
import * as perms from '../../utils/permissions';
import '@testing-library/jest-dom/vitest';

// 1. React Router Mock (useOutletContext için)
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: () => ({ user: { _id: 'admin-1', name: 'Patron' } }),
  };
});

// 2. API Mock
vi.mock('../../services/api', () => ({
  getTeamMembers: vi.fn(),
  createTeamMember: vi.fn(),
  updateTeamMember: vi.fn(),
  deleteTeamMember: vi.fn()
}));

// 3. Permissions Mock (KISMİ MOCKLAMA)
vi.mock('../../utils/permissions', async (importOriginal) => {
  const actual = await importOriginal(); 
  return {
    ...actual,
    hasPerm: vi.fn(), 
  };
});

describe('Teams Bileşeni', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Yetkisi OLAN kullanıcılar için üyeler listelenmeli ve Ekle butonu görünmeli', async () => {
    perms.hasPerm.mockReturnValue(true);

    const mockMembers = [
      { _id: 'm1', name: 'Ahmet', surname: 'Yılmaz', role: 'developer', email: 'ahmet@mail.com', permissions: [] },
      { _id: 'm2', name: 'Ayşe', surname: 'Kaya', role: 'tasarimci', email: 'ayse@mail.com', permissions: [] }
    ];

    api.getTeamMembers.mockResolvedValueOnce({ data: mockMembers });

    render(
      <MemoryRouter>
        <Teams />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Ahmet Yılmaz')).toBeInTheDocument();
      expect(screen.getByText('Ayşe Kaya')).toBeInTheDocument();
    });

    // METİN GÜNCELLENDİ: + New Member
    expect(screen.getByText('+ New Member')).toBeInTheDocument();
  });

  it('Yetkisi OLMAYAN kullanıcılar Add Member butonunu görememeli', async () => {
    perms.hasPerm.mockReturnValue(false);
    api.getTeamMembers.mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <Teams />
      </MemoryRouter>
    );

    // METİN GÜNCELLENDİ: Teams
    await waitFor(() => {
      expect(screen.getByText('Teams')).toBeInTheDocument();
    });

    // METİN GÜNCELLENDİ: + New Member
    expect(screen.queryByText('+ New Member')).toBeNull();
  });
});