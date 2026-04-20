import { test, expect } from '@playwright/test';

test('Giriş sayfası (Login) görsel olarak bozulmamalı', async ({ page }) => {
  // Direkt /login yerine ana dizine gidelim, App.jsx bizi /login'e yönlendirsin
  await page.goto('http://localhost:3000/login');

  // Sayfanın yönlenmesini ve başlığın (veya formun) görünmesini bekleyelim
  // NOT: Eğer sınıf adın auth-container değilse, buraya sayfadaki gerçek bir metni de yazabilirsin
  // Örneğin: await page.getByRole('heading', { name: 'Giriş Yap' }).waitFor();
  await page.waitForSelector('.auth-page-wrapper');

  await expect(page).toHaveScreenshot('login-page-design.png');
});