import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP_USER or SMTP_PASS not set. Emails will not be sent.');
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true' || false, // Support both true/false
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Verify connection configuration on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ SMTP Connection Error:', error);
    } else {
        console.log('✅ SMTP Server is ready to take our messages');
    }
});

export const sendInvitationEmail = async (to: string, inviterName: string, inviteCode: string): Promise<{ success: boolean; error?: any }> => {
    const mailOptions = {
        from: {
            name: "Fourtty",
            address: process.env.SMTP_USER || ""
        },
        to,
        subject: `¡${inviterName} te ha invitado a Fourtty!`,
        text: `Hola,\n\n${inviterName} te ha invitado a unirte a Fourtty, la red social privada.\n\nTu código de invitación es: ${inviteCode}\n\nRegístrate en: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/login\n\n¡Te esperamos!`,
        html: `
            <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                    <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px;">fourtty</h1>
                        <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 16px;">Tu mundo social, rediseñado.</p>
                    </div>
                    <div style="padding: 40px; text-align: center;">
                        <p style="font-size: 18px; color: #1e293b; margin-bottom: 24px;">¡Hola!</p>
                        <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 32px;">
                            <strong>${inviterName}</strong> te ha invitado a formar parte de <strong>Fourtty</strong>, la red social exclusiva donde conectas con lo que de verdad importa.
                        </p>
                        
                        <div style="background-color: #f1f5f9; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                            <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Tu código de acceso exclusivo</p>
                            <p style="margin: 0; font-size: 36px; font-weight: 800; color: #7c3aed; letter-spacing: 4px;">${inviteCode}</p>
                        </div>

                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 16px; font-weight: 700; font-size: 16px; shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.3);">
                            Unirse a Fourtty
                        </a>
                        
                        <p style="font-size: 13px; color: #94a3b8; margin-top: 32px;">
                            Usa este código en la pantalla de registro para activar tu cuenta.
                        </p>
                    </div>
                    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
                        <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; 2026 Fourtty. Todos los derechos reservados.</p>
                    </div>
                </div>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✉️ Invitation email sent: %s', info.messageId);
        return { success: true };
    } catch (error: any) {
        console.error('❌ Error sending invitation email:', {
            error: error.message,
            stack: error.stack,
            code: error.code,
            command: error.command
        });
        return { success: false, error: { message: error.message, code: error.code, command: error.command } };
    }
};

export const sendResetPasswordEmail = async (to: string, resetUrl: string): Promise<{ success: boolean; error?: any }> => {
    const mailOptions = {
        from: {
            name: "Fourtty",
            address: process.env.SMTP_USER || ""
        },
        to,
        subject: 'Restablece tu contraseña de Fourtty',
        text: `Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para hacerlo: ${resetUrl}\n\nSi no has solicitado esto, ignora este email.`,
        html: `
            <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                    <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px;">fourtty</h1>
                    </div>
                    <div style="padding: 40px; text-align: center;">
                        <p style="font-size: 18px; color: #1e293b; margin-bottom: 24px;">Recuperar contraseña</p>
                        <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 32px;">
                            Has solicitado restablecer tu contraseña de <strong>Fourtty</strong>. Haz clic en el siguiente botón para continuar:
                        </p>
                        
                        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 16px; font-weight: 700; font-size: 16px; shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.3);">
                            Restablecer Contraseña
                        </a>
                        
                        <p style="font-size: 12px; color: #94a3b8; margin-top: 40px; margin-bottom: 8px;">
                            Si el botón no funciona, copia y pega este enlace en tu navegador:
                        </p>
                        <p style="font-size: 12px; color: #7c3aed; word-break: break-all;">
                            ${resetUrl}
                        </p>
                        <p style="font-size: 14px; color: #64748b; margin-top: 32px;">
                            Si no has solicitado este cambio, puedes ignorar este correo de forma segura.
                        </p>
                    </div>
                    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
                        <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; 2026 Fourtty. Todos los derechos reservados.</p>
                    </div>
                </div>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✉️ Reset password email sent: %s', info.messageId);
        return { success: true };
    } catch (error: any) {
        console.error('❌ Error sending reset password email:', error);
        return { success: false, error: { message: error.message, code: error.code } };
    }
};
