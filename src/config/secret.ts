interface SecretConfig {
    jwtSecret: string
    jwtExpiresDay: string
}

const secretConfig: SecretConfig = {
    jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret',
    jwtExpiresDay: process.env.JWT_EXPIRES_DAY || '7d',
}

export default secretConfig
export type { SecretConfig }
