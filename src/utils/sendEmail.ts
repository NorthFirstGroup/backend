import nodemailer from 'nodemailer';
import getLogger from './logger';
import ConfigManager from '../config';

const logger = getLogger('Email');

// 郵件設定
interface EmailOptions {
    /** 收件人 Email */
    to: string;
    /** 郵件主題 */
    subject: string;
    /** 純文字內容 */
    text?: string;
    /** HTML 內容 */
    html?: string;
}

/** 發送郵件 */
export default async function sendEmail(options: EmailOptions) {
    try {
        const { to, subject, text, html } = options;
        // 建立 Nodemailer 傳輸器
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: ConfigManager.get('mail.user'),
                pass: ConfigManager.get('mail.password')
            }
        });

        const mailOptions = {
            from: 'GoTicket',
            to,
            subject,
            text,
            html
        };

        // 發送郵件
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
    } catch (error) {
        logger.error('sendEmail錯誤:', error);
    }
}
