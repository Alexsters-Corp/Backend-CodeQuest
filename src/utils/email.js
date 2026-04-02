const nodemailer = require('nodemailer')
const { env } = require('../config/env')

/**
 * Crea un transporter de Nodemailer usando las variables de entorno de SMTP.
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
  })
}

/**
 * Envía un email de recuperación de contraseña con el link que contiene el token.
 * @param {string} toEmail - Email destinatario
 * @param {string} resetToken - Token único de recuperación
 */
async function sendPasswordResetEmail(toEmail, resetToken) {
  const transporter = createTransporter()

  const resetLink = `${env.frontendUrl}/reset-password?token=${resetToken}`

  await transporter.sendMail({
    from: `"CodeQuest" <${env.smtp.user}>`,
    to: toEmail,
    subject: 'Recuperación de contraseña - CodeQuest',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Recupera tu contraseña</h2>
        <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>CodeQuest</strong>.</p>
        <p>Haz clic en el siguiente botón para crear una nueva contraseña. Este enlace expira en <strong>1 hora</strong>.</p>
        <a href="${resetLink}"
           style="display: inline-block; padding: 12px 24px; background-color: #4f46e5;
                  color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Restablecer contraseña
        </a>
        <p>Si no solicitaste este cambio, puedes ignorar este email de forma segura.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #6b7280;">
          Si el botón no funciona, copia y pega este enlace en tu navegador:<br />
          <a href="${resetLink}">${resetLink}</a>
        </p>
      </div>
    `,
  })
}

module.exports = { sendPasswordResetEmail }
