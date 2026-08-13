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
