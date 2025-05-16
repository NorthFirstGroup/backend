import { DataSource } from 'typeorm'
import ConfigManager from '../config'
// import { AreaEntity } from '../entities/Area'
// import { UserEntity } from '../entities/User'
import { join } from 'path'

/** 建立資料庫連線設定 */
export const dataSource = new DataSource({
    type: 'postgres',
    host: ConfigManager.get('db.host'),
    port: ConfigManager.get('db.port'),
    username: ConfigManager.get('db.username'),
    password: ConfigManager.get('db.password'),
    database: ConfigManager.get('db.database'),
    synchronize: ConfigManager.get('db.synchronize'),
    ssl: ConfigManager.get('db.ssl'),
    poolSize: 10,
    entities: [join(__dirname, '../entities/**/*.{ts,js}')], // 調整自動抓取 Entity檔案
    migrations: [join(__dirname,'../migrations/*')], // 指向遷移檔案
    migrationsTableName: 'migrations', // 確保遷移表名稱
})