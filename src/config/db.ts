import dotenv from 'dotenv'
dotenv.config()

interface DbConfig {
    host: string
    port: number
    username: string
    password: string
    database: string
    synchronize: boolean
    ssl: false | { rejectUnauthorized: boolean }
  }
  
  const dbConfig: DbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || '',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    ssl: process.env.DB_ENABLE_SSL === 'true' ? { rejectUnauthorized: false } : false
  }
  
  export default dbConfig
  export type { DbConfig }