// Construcción del correo de invitación (SPEC 10).
// HTML inline (sin React-Email); el from lo fija la Server Action.

export interface InvitationEmail {
  subject: string;
  html: string;
}

// URL base del enlace a /activar-cuenta. La env NEXT_PUBLIC_APP_URL la define
// el entorno; en desarrollo se usa localhost.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Crea el asunto y el HTML del correo de invitación que recibe el padre.
export function buildInvitationEmail(input: {
  parentName: string; // "Diego Fernández"
  childFirstName: string; // "Mateo"
  code: string; // "7K4P9"
  expiresInDays: number; // 7
}): InvitationEmail {
  const { parentName, childFirstName, code, expiresInDays } = input;
  const activationUrl = `${APP_URL}/activar-cuenta?code=${code}`;

  return {
    subject: `Te invitaron a seguir el día de ${childFirstName}`,
    html: `
      <div style="background:#F6ECDF;padding:32px 16px;font-family:Nunito,Arial,sans-serif;color:#3F362E">
        <div style="max-width:480px;margin:0 auto;background:#FBF4EC;border:1px solid #ECE0D0;border-radius:20px;overflow:hidden">
          <div style="padding:28px 32px;border-bottom:1px solid #ECE0D0">
            <div style="font-family:Fredoka,Arial,sans-serif;font-weight:600;font-size:22px;color:#3F362E">OpenDayCare</div>
            <div style="font-size:13px;color:#A89A8B">Tu guardería</div>
          </div>
          <div style="padding:24px 32px">
            <p style="margin:0 0 12px;font-size:15px;line-height:1.55">Hola <strong>${parentName}</strong>,</p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.55">La guardería te invitó a seguir el día de
              <strong>${childFirstName}</strong>. Usá este código para activar tu cuenta:</p>
            <div style="background:#FBF1D6;border:1.5px dashed #E6D08A;border-radius:16px;padding:18px;text-align:center;margin:0 0 20px">
              <div style="font-size:12px;font-weight:800;letter-spacing:.7px;color:#A88526;margin-bottom:8px">CÓDIGO DE INVITACIÓN</div>
              <div style="font-family:Fredoka,Arial,sans-serif;font-weight:600;font-size:34px;letter-spacing:7px;color:#8A7234">${code}</div>
              <div style="font-size:13px;color:#A88526;margin-top:6px">Vence en ${expiresInDays} días</div>
            </div>
            <a href="${activationUrl}" style="display:block;text-align:center;padding:14px 16px;border-radius:14px;background:#EE8164;color:#fff;font-weight:800;font-size:15px;text-decoration:none">
              Activar mi cuenta
            </a>
            <p style="margin:16px 0 0;font-size:13px;color:#A89A8B;text-align:center">
              O copiá este enlace en tu navegador:<br>
              <a href="${activationUrl}" style="color:#C5503A">${activationUrl}</a>
            </p>
          </div>
        </div>
      </div>
    `,
  };
}
