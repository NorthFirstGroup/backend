interface MailConfig {
    user: string;
    password: string;
    jwtExpiresMinute: string;
}

const mailConfig: MailConfig = {
    user: process.env.MAIL_USER || '',
    password: process.env.DB_PASSWORD || '',
    jwtExpiresMinute: process.env.MAIL_JWT_EXPIRES_MINUTE || '5m'
};

export default mailConfig;
export type { MailConfig };
