const { env } = require('../config/env')
const { sendMail } = require('../utils/mailer')

class EmailService {
  async sendPasswordReset({ email, rawToken }) {
    const resetUrl = `${env.frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`

    const sent = await sendMail({
      to: email,
      subject: 'CodeQuest - Restablecer contrasena',
      text: `Usa este enlace para restablecer tu contrasena: ${resetUrl}`,
      html: `<p>Usa este enlace para restablecer tu contrasena:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    })

    if (!sent) {
      console.info(`[AuthService] SMTP no configurado. Reset token para ${email}: ${rawToken}`)
    }
  }

  async sendVerifyEmail({ email, rawToken }) {
    const verifyUrl = `${env.frontendUrl}/verify-email?token=${encodeURIComponent(rawToken)}`

    const sent = await sendMail({
      to: email,
      subject: 'CodeQuest - Verifica tu email',
      text: `Verifica tu cuenta con este enlace: ${verifyUrl}`,
      html: `<p>Verifica tu cuenta con este enlace:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    })

    if (!sent) {
      console.info(`[AuthService] SMTP no configurado. Verify token para ${email}: ${rawToken}`)
    }
  }
}

module.exports = EmailService
