import pino, { Logger } from 'pino'
import pretty from 'pino-pretty'

/** 日誌等級 */
export enum loggerLevel {
    debug = 'debug',
    info = 'info',
    warn = 'warn',
    error = 'error',
}

/** 建立一個帶有 prefix 的 Pino logger 實例。
 * @param prefix - 記錄訊息時顯示的前綴文字
 * @param logLevel - 日誌等級（預設為 'debug'），例如 'info'、'error'、'warn'
 * @returns Pino logger 實例
 */
export default function getLogger(prefix: string, levelKey = loggerLevel.debug ): Logger {
    return pino(
        pretty({
            levelKey,
            messageFormat: `[${prefix}]: {msg}`,
            colorize: true,
            sync: true,
        })
    )
}
