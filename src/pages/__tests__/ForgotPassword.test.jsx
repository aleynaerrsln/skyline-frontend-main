import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from '../ForgotPassword';
import * as api from '../../services/api';
import '@testing-library/jest-dom/vitest';

// 1. Router Mock
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// 2. API Mock
vi.mock('../../services/api', () => ({
  forgotPassword: vi.fn(),
  verifyResetCode: vi.fn(),
  resetPassword: vi.fn(),
}));

describe('ForgotPassword (Şifremi Unuttum) Bileşeni', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('3 adımlı şifre sıfırlama sürecini uçtan uca başarıyla tamamlamalı', async () => {
    api.forgotPassword.mockResolvedValueOnce({ data: { success: true } });
    api.verifyResetCode.mockResolvedValueOnce({ data: { success: true } });
    api.resetPassword.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    // ==========================================
    // 1. ADIM: E-Posta Gönderme
    // ==========================================
    const emailInput = screen.getByPlaceholderText('email@example.com');
    fireEvent.change(emailInput, { target: { value: 'patron@skyline.com' } });
    
    const sendCodeBtn = screen.getByRole('button', { name: /Send Reset Code/i });
    fireEvent.click(sendCodeBtn);

    await waitFor(() => {
      expect(api.forgotPassword).toHaveBeenCalledWith('patron@skyline.com');
      // ÇÖZÜM: Tam ve kesin metin araması yapıyoruz
      expect(screen.getByText('Reset code sent to your email')).toBeInTheDocument();
    });

    // ==========================================
    // 2. ADIM: Kodu Doğrulama
    // ==========================================
    const codeInput = screen.getByPlaceholderText('000000');
    fireEvent.change(codeInput, { target: { value: '123456' } });
    
    const verifyBtn = screen.getByRole('button', { name: /Verify Code/i });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(api.verifyResetCode).toHaveBeenCalledWith('123456');
      // ÇÖZÜM: Regex yerine direkt başarı mesajını arıyoruz, böylece 1 tane bulacak!
      expect(screen.getByText('Code verified! Set your new password')).toBeInTheDocument();
    });

    // ==========================================
    // 3. ADIM: Yeni Şifre Belirleme
    // ==========================================
    const passInput = screen.getByPlaceholderText('Min 6 characters');
    const confirmInput = screen.getByPlaceholderText('Confirm password');

    fireEvent.change(passInput, { target: { value: 'yenisifrem123' } });
    fireEvent.change(confirmInput, { target: { value: 'yenisifrem123' } });
    
    const resetBtn = screen.getByRole('button', { name: /Reset Password/i });
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(api.resetPassword).toHaveBeenCalledWith('123456', 'yenisifrem123');
    });

    // ==========================================
    // FİNAL: Yönlendirme (Uzun Bekleme ile)
    // ==========================================
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    }, { timeout: 3000 });
  });
});