import dotenv from 'dotenv';
dotenv.config();

interface RedisConfig {
    host: string;
    port: number;
    password: string;
}

const redissConfig: RedisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || ''
};

export default redissConfig;
export type { RedisConfig };
