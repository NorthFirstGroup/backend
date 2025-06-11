import Redis from 'ioredis';
import ConfigManager from '../config';

/** 建立 Redis 連線設定 */
export const redis = new Redis({
    host: ConfigManager.get('redis.host'),
    port: ConfigManager.get('redis.port'),
    password: ConfigManager.get('redis.password')
});
