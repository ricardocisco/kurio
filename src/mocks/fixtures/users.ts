export interface UserRecord {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  ensName: string | null;
  passwordSalt: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export const DEMO_CREDENTIALS = [
  { email: 'colecionador@kurio.dev', password: 'Kurio@123' },
  { email: 'artista@kurio.dev', password: 'Kurio@456' },
] as const;

export function createUserFixtures(): UserRecord[] {
  return [
    {
      id: 'user-nova',
      username: 'nova.sato',
      displayName: 'Nova Sato',
      email: 'colecionador@kurio.dev',
      avatarUrl: null,
      ensName: 'nova',
      passwordSalt: '9f2c1a7e',
      passwordHash: '08c33a251ba195b33ea78aeb1fac58b8bf093d5a5c18114bf6881d634a0a3501',
      createdAt: '2026-03-14T15:00:00.000Z',
      updatedAt: '2026-03-14T15:00:00.000Z',
    },
    {
      id: 'user-rafa',
      username: 'rafa.lima',
      displayName: 'Rafa Lima',
      email: 'artista@kurio.dev',
      avatarUrl: null,
      ensName: null,
      passwordSalt: '4b8d3e60',
      passwordHash: 'e38b101997493c0e5e0e0bf9d879b13c8c89c9c6cdaba3ac81d56570067c5044',
      createdAt: '2026-05-02T18:30:00.000Z',
      updatedAt: '2026-05-02T18:30:00.000Z',
    },
  ];
}

export const RESERVED_USERNAMES = ['admin', 'kurio', 'suporte', 'root'];
