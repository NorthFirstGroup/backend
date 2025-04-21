import dotenv from 'dotenv'
import db, { DbConfig } from './db'
import redis, { RedisConfig } from './redis'
import web, { WebConfig } from './web'
import secret, { SecretConfig } from './secret'

dotenv.config()

// 定義設定物件結構
const config: Config = {
    db,
    redis,
    web,
    secret,
}

type Config = {
    db: DbConfig,
    redis: RedisConfig,
    web: WebConfig,
    secret: SecretConfig,
}

type DeepValue<T, Path extends string > = Path extends `${infer Key}.${infer Rest}`
    ? Key extends keyof T
        ? DeepValue<T[Key], Rest>
        : never
    : Path extends keyof T
    ? T[Path]
    : never

class ConfigManager {
    /** 根據提供的 dot path 拿到對應的設定值，回傳正確型別
     * @param path - 例如 'db.host'、'web.port'
     */
    static get<Path extends string>(path: Path): DeepValue<Config, Path> {
        const keys = path.split('.')
        let configValue: unknown = config

        for (const key of keys) {
            if (
                typeof configValue === 'object' &&
                configValue !== null &&
                key in configValue
            ) {
                configValue = (configValue as Record<string, unknown>)[key]
            } else {
                throw new Error(`Config "${path}" not found`)
            }
        }

        return configValue as DeepValue<Config, Path>
    }
}

export default ConfigManager
