import { dataSource } from '@db/data-source';
import { redis } from '@db/redis-source';
import { showtimes } from './dataActivities';
import { initRedisShowtimeInventory } from '../scripts/init-redis-inventtory';
import getLogger from '@utils/logger';

const logger = getLogger('Seed');

export async function resetTable(tableName: string) {
    await dataSource.initialize();
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
        await queryRunner.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
        await queryRunner.commitTransaction();
        logger.info(`Reset '${tableName}' table completed.`);
    } catch (error) {
        await queryRunner.rollbackTransaction();
        logger.error(`Error during reset: ${error}`);
        process.exit(1);
    } finally {
        await queryRunner.release();
        await dataSource.destroy();
    }
}

export async function seedTable<T>(tableName: string, data: T[]) {
    if (!Array.isArray(data) || data.length === 0) {
        logger.error(`No '${tableName}' data provided for seeding.`);
        return;
    }

    await dataSource.initialize();
    const queryRunner = dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const repo = queryRunner.manager.getRepository(tableName);
        await repo.save(data);

        await queryRunner.commitTransaction();
        logger.info(`Seeding '${tableName}' table completed.`);
    } catch (error) {
        await queryRunner.rollbackTransaction();
        logger.error('Error during seeding:', error);
        process.exit(1);
    } finally {
        await queryRunner.release();
        await dataSource.destroy();
    }
}

export async function runSeedRedisScript() {
    try {
        logger.info('Starting seeding redis process...');

        // --- Initialize Database Connection ONCE ---
        if (!dataSource.isInitialized) {
            await dataSource.initialize();
            logger.info('Database DataSource initialized.');
        }

        try {
            await redis.ping();
            logger.info('Redis client connected successfully.');
        } catch (error) {
            logger.error(`Failed to connect to Redis: ${error}`);
            throw new Error('Redis connection failed. Aborting redis seed.');
        }

        await Promise.all(showtimes.map(showtime => initRedisShowtimeInventory(showtime.id)));

        logger.info('All Redis showtime inventories initialized successfully.');
    } catch (error) {
        logger.error(`Seeding process failed: ${error}`);
    } finally {
        // --- Destroy Database Connection ONCE ---
        if (dataSource.isInitialized) {
            await dataSource.destroy();
            logger.info('Database DataSource closed.');
        }

        // --- Close Redis Connection ONCE ---
        // Use quit() to gracefully close the connection.
        redis.quit();
        logger.info('Redis client disconnected.');
    }
}
