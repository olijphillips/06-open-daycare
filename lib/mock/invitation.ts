// Mock data de invitación para la pantalla de activación de cuenta (visual).
// Fuente: references/pantallas/activar-cuenta.dc.html.
// El flujo real de invitaciones (tabla `invitations`) es spec futura.

export interface Invitation {
  childName: string; // "Mateo"
  classroom: string; // "Sala Soles"
  initial: string; // "M"
  avatarBg: string; // "#A9D9E8"
  avatarColor: string; // "#1F7A93"
}

// Valores de precarga de los formularios, fieles a los mockups.
export const authDefaults = {
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
