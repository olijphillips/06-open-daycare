// Mock data de autenticación (login y activación de cuenta).
// Fuente: references/pantallas/login.dc.html y activar-cuenta.dc.html.
// Tipos e identificadores en inglés; contenido visible en español.

export interface Invitation {
  childName: string; // "Mateo"
  classroom: string; // "Sala Soles"
  initial: string; // "M"
  avatarBg: string; // "#A9D9E8"
  avatarColor: string; // "#1F7A93"
}

// Valores de precarga de los formularios, fieles a los mockups.
export const authDefaults = {
  loginEmail: "caro@opendaycare.com",
  loginPasswordPlaceholder: "••••••••",
  invitationCode: "7K4P9",
  accountEmail: "lucia.fernandez@gmail.com",
};

export const invitation: Invitation = {
  childName: "Mateo",
  classroom: "Sala Soles",
  initial: "M",
  avatarBg: "#A9D9E8",
  avatarColor: "#1F7A93",
};

// Perfil del usuario autenticado en la sesión mock.
export interface SessionUser {
  name: string;
  role: string;
  initial: string;
  avatarBg: string;
}

// Registro de usuarios demo del login mock.
// Coincide con los seeds de SPEC 07 (admin/staff) + la maestra del mockup (SPEC 01).
export const mockUsers: Record<string, SessionUser> = {
  "admin@opendaycare.com": {
    name: "Nadia García",
    role: "Admin · Soles",
    initial: "N",
    avatarBg: "#C9B6E8",
  },
  "staff@opendaycare.com": {
    name: "Luis Pérez",
    role: "Maestro · Soles",
    initial: "L",
    avatarBg: "#A9C7E8",
  },
  "caro@opendaycare.com": {
    name: "Caro Giménez",
    role: "Maestra · Soles",
    initial: "C",
    avatarBg: "#F2937A",
  },
};

// Sesión mock en memoria: el login guarda aquí el usuario autenticado.
// Sin persistencia: al recargar la página vuelve al usuario por defecto.
let sessionUser: SessionUser | null = null;
const listeners = new Set<() => void>();

export function getSessionUser(): SessionUser | null {
  return sessionUser;
}

export function subscribeToSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function signIn(email: string): SessionUser {
  sessionUser = mockUsers[email.toLowerCase().trim()] ?? mockUsers[authDefaults.loginEmail];
  listeners.forEach((listener) => listener());
  return sessionUser;
}

export function signOut(): void {
  sessionUser = null;
  listeners.forEach((listener) => listener());
}
