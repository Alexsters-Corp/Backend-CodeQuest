const nodemailer = require('nodemailer')
const { env } = require('../config/env')

let transporter

function getTransporter() {
  if (!env.smtp.user || !env.smtp.pass) {
    return null
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    })
  }

  return transporter
}

async function sendMail({ to, subject, html, text }) {
  const smtpTransporter = getTransporter()
  if (!smtpTransporter) {
    return false
  }

  try {
    await smtpTransporter.sendMail({
      from: env.smtp.from || env.smtp.user,
      to,
      subject,
      html,
      text,
    })
  } catch (error) {
    console.error('[Mailer] SMTP delivery error:', error?.code || error?.message || error)
    return false
  }

  return true
}

module.exports = {
  sendMail,
}
