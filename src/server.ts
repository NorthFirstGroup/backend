import http from 'http';
import config from './config';
import getLogger from './utils/logger';
import app from './app';
import { dataSource } from './db/data-source';
import { redis } from './db/redis-source';
import { initAreaCache } from './utils/areaCache';
import { initSeatInventoryService } from './utils/seatInventory';

const logger = getLogger('www');

const port = config.get('web.port') || 3000;
app.set('port', port);

const server = http.createServer(app);

/** 處理伺服器啟動錯誤 */
function onError(error: NodeJS.ErrnoException) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

    switch (error.code) {
        case 'EACCES':
            logger.error(`${bind} requires elevated privileges`);
            return process.exit(1);
        case 'EADDRINUSE':
            logger.error(`${bind} is already in use`);
            return process.exit(1);
        default:
            logger.error(`exception on ${bind}: ${error.code}`);
            return process.exit(1);
    }
}

// 綁定錯誤處理事件
server.on('error', onError);

// 啟動伺服器並初始化資料庫
server.listen(port, async () => {
    try {
        await dataSource.initialize();
        logger.info(`資料庫連線成功`);

        // 資料庫沒有資料時建立種子資料
        await dataSource.runMigrations();
        logger.info(`資料庫遷移完成`);
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error(`資料庫連線失敗: ${error.message}`);
        } else {
            logger.error(`資料庫連線失敗: ${String(error)}`);
        }
        process.exit(1);
    }

    try {
        await redis.ping();
        logger.info('Redis 連線成功');
        await initAreaCache(dataSource, redis);
        initSeatInventoryService(redis);
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error(`Redis 連線失敗: ${error.message}`);
        } else {
            logger.error(`Redis 連線失敗: ${String(error)}`);
        }
        process.exit(1);
    }

    logger.info(`伺服器運作中. port: ${port}`);
});
