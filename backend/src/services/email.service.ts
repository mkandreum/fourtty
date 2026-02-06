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
            name: "Twenty",
            address: process.env.SMTP_USER || ""
        },
        to,
        subject: `¡${inviterName} te ha invitado a Twenty!`,
        text: `Hola,\n\n${inviterName} te ha invitado a unirte a Twenty, la red social privada.\n\nTu código de invitación es: ${inviteCode}\n\nRegístrate en: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/login\n\n¡Te esperamos!`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #dce5ed; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #005599; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">;) twenty</h1>
                </div>
                <div style="padding: 30px; background-color: white;">
                    <p style="font-size: 16px; color: #333;">Hola,</p>
                    <p style="font-size: 16px; color: #333;"><strong>${inviterName}</strong> te ha invitado a unirte a <strong>Twenty</strong>, la red social privada que revive los mejores momentos.</p>
                    <div style="background-color: #f2f6f9; border: 1px dashed #005599; padding: 20px; text-align: center; margin: 30px 0;">
                        <p style="margin: 0; font-size: 14px; color: #555;">Tu código de invitación exclusivo:</p>
                        <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #005599; letter-spacing: 5px;">${inviteCode}</p>
                    </div>
                    <p style="font-size: 14px; color: #555; text-align: center;">Usa este código en la pantalla de registro.</p>
                    <div style="text-align: center; margin-top: 40px;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background-color: #59B200; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">Unirse a Twenty</a>
                    </div>
                </div>
                <div style="background-color: #f9fbfd; padding: 15px; text-align: center; border-top: 1px solid #dce5ed;">
                    <p style="margin: 0; font-size: 12px; color: #999;">© Twenty 2010. Todos los derechos reservados.</p>
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
