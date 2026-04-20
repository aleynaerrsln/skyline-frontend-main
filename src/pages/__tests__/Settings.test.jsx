import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Settings from '../Settings';
import * as api from '../../services/api';
import '@testing-library/jest-dom/vitest';

// 1. React Router Mock (Patron'un bilgilerini ve rollerini veriyoruz)
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: () => ({
      user: { 
        _id: 'u1', 
        name: 'Patron', 
        surname: 'Test', 
        email: 'patron@skyline.com',
        role: ['admin', 'developer'] // Birden fazla yetki veriyoruz
      } 
    }),
  };
});

// 2. API Mock (Fotoğraf yükleme servisini taklit ediyoruz)
vi.mock('../../services/api', () => ({
  uploadAvatar: vi.fn(),
}));

describe('Settings (Ayarlar) Bileşeni', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Kullanıcı bilgileri ve yetki (role) rozetleri doğru render edilmeli', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    // İsim ve E-postanın sayfada olduğunu doğrulayalım
    expect(screen.getByText('Patron Test')).toBeInTheDocument();
    expect(screen.getByText('patron@skyline.com')).toBeInTheDocument();

    // Veritabanından gelen rollere karşılık gelen etiketlerin (Badge) ekranda olduğunu doğrulayalım
    // Kodunda 'admin' için "Admin", 'developer' için "Developer" etiketleri yazdırılıyor
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
  });

  it('Yeni bir profil fotoğrafı (Avatar) seçildiğinde upload API si çağrılmalı', async () => {
    // API'nin başarıyla çalıştığını ve sahte bir resim URL'si döndürdüğünü varsayalım
    api.uploadAvatar.mockResolvedValueOnce({ data: { avatarUrl: 'http://test.com/yeni-avatar.jpg' } });

    const { container } = render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    // Ekranda gizli olarak tutulan (display: none) dosya yükleme input'unu buluyoruz
    const fileInput = container.querySelector('input[type="file"]');
    
    // Test ortamı için sahte bir görsel dosyası (Mock File) oluşturuyoruz
    const fakeImage = new File(['(⌐□_□)'], 'vesikalik.png', { type: 'image/png' });

    // Kullanıcı dosyayı seçmiş (onChange) gibi tetikliyoruz
    fireEvent.change(fileInput, { target: { files: [fakeImage] } });

    // Component'in onChange eventi çalışıp, uploadAvatar fonksiyonunu o sahte görselle 
    // çağırıp çağırmadığını kontrol ediyoruz.
    await waitFor(() => {
      expect(api.uploadAvatar).toHaveBeenCalledTimes(1);
    });
  });
});