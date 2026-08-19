// Mock data de precarga de formularios de auth (login y activación).
// Solo queda el placeholder de la contraseña; el flujo de invitación ya es
// real (SPEC 11) y los datos vienen de la BD vía validate_invitation.

export const authDefaults = {
  loginPasswordPlaceholder: "••••••••",
};
