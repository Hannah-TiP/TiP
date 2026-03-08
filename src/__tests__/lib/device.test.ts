import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateDeviceFingerprint, hashDeviceId, getDeviceId, clearDeviceId } from '@/lib/device';

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    Object.keys(store).forEach((k) => delete store[k]);
  }),
  get length() {
    return Object.keys(store).length;
  },
  key: vi.fn(() => null),
};

vi.stubGlobal('localStorage', localStorageMock);

describe('generateDeviceFingerprint', () => {
  it('returns a pipe-delimited string of browser properties', () => {
    const fp = generateDeviceFingerprint();
    const parts = fp.split('|');
    expect(parts.length).toBe(7);
    expect(parts[0]).toBe(navigator.userAgent);
    expect(parts[3]).toMatch(/^\d+x\d+$/);
  });
});

describe('hashDeviceId', () => {
  it('returns a 64-char lowercase hex string (SHA-256)', async () => {
    const hash = await hashDeviceId('test-fingerprint');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces consistent output for same input', async () => {
    const a = await hashDeviceId('same');
    const b = await hashDeviceId('same');
    expect(a).toBe(b);
  });

  it('produces different output for different input', async () => {
    const a = await hashDeviceId('input-a');
    const b = await hashDeviceId('input-b');
    expect(a).not.toBe(b);
  });
});

describe('getDeviceId', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('generates and caches a device ID', async () => {
    const id = await getDeviceId();
    expect(id).toMatch(/^[0-9a-f]{64}$/);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('tip_device_id', id);
  });

  it('returns cached ID on second call', async () => {
    const first = await getDeviceId();
    const second = await getDeviceId();
    expect(first).toBe(second);
  });
});

describe('clearDeviceId', () => {
  it('removes the device ID from localStorage', async () => {
    await getDeviceId();
    clearDeviceId();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('tip_device_id');
  });
});
