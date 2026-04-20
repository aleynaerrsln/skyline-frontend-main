import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AuthPage from '../AuthPage';
import * as api from '../../services/api';

import '@testing-library/jest-dom/vitest'; 

// 1. React Router'ı Mock'luyoruz (Yönlendirmeleri yakalamak için)
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/login' }),
  };
});

// 2. API Servislerini Mock'luyoruz (Gerçek sunucuya istek atmasını engellemek için)
vi.mock('../../services/api', () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

describe('AuthPage Bileşeni', () => {
  // Her testten önce mock'ları ve localStorage'ı temizle
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('Giriş (Login) formu varsayılan olarak doğru render edilmeli', () => {
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>
    );

    // Ekranda birden fazla Username ve Password inputu olduğu için (Login ve Register formları)
    // getAllByPlaceholderText kullanıp ilk formdakini [0] alıyoruz.
    const usernameInputs = screen.getAllByPlaceholderText('Username');
    const passwordInputs = screen.getAllByPlaceholderText('Password');

    expect(usernameInputs[0]).toBeInTheDocument();
    expect(passwordInputs[0]).toBeInTheDocument();

    // Login butonunun görünür olduğunu kontrol et
    const loginButton = screen.getByRole('button', { name: /login/i });
    expect(loginButton).toBeInTheDocument();
  });

  it('Kayıt Ol (Sign Up) linkine tıklandığında kayıt formuna geçmeli', () => {
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>
    );

    // Sign Up linkini bulup tıklıyoruz
    const signUpLink = screen.getByText('Sign Up');
    fireEvent.click(signUpLink);

    // Kayıt formuna özel input olan "Workspace Name" görünür olmalı
    expect(screen.getByPlaceholderText('Workspace Name')).toBeInTheDocument();
  });

  it('Doğru bilgiler girildiğinde API çağrılmalı, token kaydedilmeli ve yönlendirme yapılmalı', async () => {
    // API'nin başarılı dönüp sahte bir token verdiğini simüle ediyoruz
    api.login.mockResolvedValueOnce({ data: { token: 'fake-jwt-token' } });

    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>
    );

    // Login formundaki inputları seçiyoruz (İlk sıradakiler)
    const emailInput = screen.getAllByPlaceholderText('Username')[0];
    const passwordInput = screen.getAllByPlaceholderText('Password')[0];
    const loginButton = screen.getByRole('button', { name: /login/i });

    // Kullanıcı gibi inputları dolduruyoruz
    fireEvent.change(emailInput, { target: { value: 'test@ekip.com' } });
    fireEvent.change(passwordInput, { target: { value: '123456' } });
    
    // Butona tıklıyoruz
    fireEvent.click(loginButton);

    // Yükleniyor durumuna geçtiğini kontrol ediyoruz (Login butonunun yazısı Signing in... oluyor)
    expect(screen.getByRole('button', { name: /signing in\.\.\./i })).toBeInTheDocument();

    // API çağrısının doğru bilgilerle yapıldığını doğruluyoruz
    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith({ email: 'test@ekip.com', password: '123456' });
    });

    // LocalStorage'a token'ın eklendiğini kontrol ediyoruz
    expect(localStorage.getItem('token')).toBe('fake-jwt-token');

    // Başarılı giriş sonrası uygulamanın ana sayfasına (/app) yönlendirildiğini kontrol ediyoruz
    expect(mockNavigate).toHaveBeenCalledWith('/app');
  });

  it('Giriş başarısız olduğunda (API hata döndüğünde) ekranda hata mesajı gösterilmeli', async () => {
    // API'nin hata fırlattığını simüle ediyoruz
    api.login.mockRejectedValueOnce({ 
      response: { data: { message: 'Kullanıcı bulunamadı veya şifre hatalı' } } 
    });

    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>
    );

    // Login formundaki inputları seçip dolduruyoruz
    const emailInput = screen.getAllByPlaceholderText('Username')[0];
    const passwordInput = screen.getAllByPlaceholderText('Password')[0];
    
    fireEvent.change(emailInput, { target: { value: 'yanlis@mail.com' } });
    fireEvent.change(passwordInput, { target: { value: '111' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // API'den gelen hata mesajının arayüze basıldığını doğruluyoruz
    await waitFor(() => {
      expect(screen.getByText('Kullanıcı bulunamadı veya şifre hatalı')).toBeInTheDocument();
    });
  });
});