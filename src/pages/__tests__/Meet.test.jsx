import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Meet from '../Meet';
import * as api from '../../services/api';
import '@testing-library/jest-dom/vitest';

// =========================================================================
// BROWSER API MOCKS
// =========================================================================
global.navigator.mediaDevices = {
  getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] })
};
global.window.AudioContext = vi.fn().mockImplementation(() => ({
  createMediaStreamSource: vi.fn(),
  createMediaStreamDestination: vi.fn().mockReturnValue({ stream: {} })
}));
global.RTCPeerConnection = vi.fn().mockImplementation(() => ({
  addTransceiver: vi.fn(),
  createOffer: vi.fn().mockResolvedValue({}),
  setLocalDescription: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn()
}));
global.MediaRecorder = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  addEventListener: vi.fn()
}));

// --- SOCKET.IO MOCK ---
const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  off: vi.fn(),
  disconnect: vi.fn()
};
vi.mock('socket.io-client', () => ({
  io: () => mockSocket
}));

// --- REACT ROUTER MOCK ---
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: () => ({ user: { _id: 'u1', name: 'Can' } }),
  };
});

// --- API MOCK ---
vi.mock('../../services/api', () => ({
  getConversations: vi.fn(),
  getVoiceRooms: vi.fn(),
  getTeamMembers: vi.fn(),
  getMessages: vi.fn(),
  joinVoiceRoom: vi.fn(),
}));

describe('Meet (Sesli ve Yazılı Sohbet) Bileşeni', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Varsayılan API dönüşleri (Sayfanın çökmemesi için)
    api.getConversations.mockResolvedValue({ data: [] });
    api.getTeamMembers.mockResolvedValue({ data: [] });
    api.getMessages.mockResolvedValue({ data: [] });
  });

  it('Sesli odaları (Voice Rooms) API den çekip listelemeli', async () => {
    const mockRooms = [
      { _id: 'room-1', name: 'Genel Toplantı', participants: [], createdBy: { name: 'Ahmet' } },
      { _id: 'room-2', name: 'Tasarım Odası', participants: [], createdBy: { name: 'Ayşe' } }
    ];
    api.getVoiceRooms.mockResolvedValue({ data: mockRooms });

    render(
      <MemoryRouter>
        <Meet />
      </MemoryRouter>
    );

    // ÇÖZÜM 1: Sayfa ilk açıldığında Loading ekranı vardır. "Voice Rooms" butonunun 
    // ekrana YÜKLENMESİNİ bekliyoruz (findByRole bekletme yapar)
    const voiceTab = await screen.findByRole('button', { name: /Voice Rooms/i });
    
    // Buton yüklendi, artık tıklayabiliriz
    fireEvent.click(voiceTab);

    // Sekme değiştikten sonra odaların ekranda belirmesini bekle
    await waitFor(() => {
      expect(screen.getByText('Genel Toplantı')).toBeInTheDocument();
      expect(screen.getByText('Tasarım Odası')).toBeInTheDocument();
    });
  });

  it('Bir odaya tıklandığında API ve Socket tetiklenmeli', async () => {
    const mockRooms = [
      { _id: 'room-1', name: 'Günlük Standup', participants: [], createdBy: { name: 'Ahmet' } }
    ];
    api.getVoiceRooms.mockResolvedValue({ data: mockRooms });
    api.joinVoiceRoom.mockResolvedValue({ data: { success: true } });

    render(
      <MemoryRouter>
        <Meet />
      </MemoryRouter>
    );

    // Loading'in bitmesini ve sekmenin gelmesini bekle
    const voiceTab = await screen.findByRole('button', { name: /Voice Rooms/i });
    fireEvent.click(voiceTab);

    // ÇÖZÜM 2: Join diye bir buton yok, arayüzde direkt odanın İSMİNE tıklanıyor.
    // Odanın isminin (Günlük Standup) DOM'a yüklenmesini bekle
    const roomCard = await screen.findByText('Günlük Standup');
    
    // Odanın ismine tıkla (Bu eylem Meet.jsx içinde handleJoinRoom'u tetikler)
    fireEvent.click(roomCard);

    // Tıkladıktan sonra API ve Socket doğru parametrelerle çağrıldı mı kontrol ediyoruz
    await waitFor(() => {
      expect(api.joinVoiceRoom).toHaveBeenCalledWith('room-1');
      // expect.objectContaining kullanıyoruz ki isimdeki boşluk ("Can ") yüzünden test patlamasın
      expect(mockSocket.emit).toHaveBeenCalledWith('join-voice-room', expect.objectContaining({ roomId: 'room-1', userId: 'u1' }));
    });
  });
});