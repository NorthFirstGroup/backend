import { DataSource } from 'typeorm';
import getLogger from './logger';
import Redis from 'ioredis';
import { dbEntityNameArea } from '../entities/Area';

const logger = getLogger('AreaCacheService');

export interface AreaCacheData {
    /** 對應 Area 資料表的 id */
    id: number;
    /** 地區名稱 */
    name: string;
}

/** 區域快取機制 */
class AreaCache {
    /** Redis 儲存 Area 資料的 Key */
    private readonly REDIS_KEY = 'areaHash';
    private readonly dataSource: DataSource;
    private readonly redis: Redis;

    constructor(dataSource: DataSource, redis: Redis) {
        this.dataSource = dataSource;
        this.redis = redis;
    }

    /** 初始化 Area 資料到 Redis */
    async initAreasToRedis(): Promise<AreaCacheData[]> {
        try {
            this.clearAreas();

            // 從 DB 獲取所有 Area 資料
            const areaRepository = this.dataSource.getRepository(dbEntityNameArea);
            const areas = await areaRepository.find();

            if (areas.length === 0) {
                logger.warn('Area 表中無資料，無法初始化到 Redis');
                return [];
            }

            // 批次存入 Redis
            const multi = this.redis.multi();
            const areaCache: AreaCacheData[] = areas.map(area => {
                multi.hset(this.REDIS_KEY, area.id, area.name);
                return { id: area.id, name: area.name };
            });
            await multi.exec();

            logger.info(`成功將 ${areas.length} 筆 Area 資料存入 Redis`);
            return areaCache;
        } catch (error) {
            logger.error(`initAreasToRedis Error: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }

    /** 從 Redis 獲取 Area 資料 */
    async getAreas(): Promise<AreaCacheData[]> {
        try {
            // 嘗試從 Redis 獲取資料
            const areasRedis = await this.redis.hgetall(this.REDIS_KEY);
            let areas: AreaCacheData[] = [];
            if (areasRedis) {
                areas = Object.entries(areasRedis).map(([id, name]) => ({
                    id: Number(id), // 將字串 ID 轉為數字
                    name
                }));
            } else areas = await this.initAreasToRedis();

            return areas;
        } catch (error) {
            logger.error(`getAreas Error: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /** 清空 Redis 中的 Area 資料 */
    private async clearAreas() {
        try {
            await this.redis.del(this.REDIS_KEY);
            logger.info('已清空 Redis 中的 Area 資料');
        } catch (error) {
            logger.error(`clearAreas Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /** 透過 id 查詢地區名稱
     * @param id Area 的 id (可傳入一個 id 或多個 id)
     * @returns 地區名稱或 null（若未找到）
     */
    async getAreaNameById(id: number | number[]): Promise<string | string[] | null> {
        try {
            const areas = await this.getAreas();
            if (Array.isArray(id)) return areas.filter(a => id.includes(a.id)).map(a => a.name);

            const area = areas.find(a => a.id === id);

            if (!area) return null;

            return area.name;
        } catch (error) {
            logger.error(`getAreaNameById Error: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /** 透過地區名稱查詢 id
     * @param name 地區名稱
     * @returns Area 的 id（number）或 null（若未找到）
     */
    async getAreaIdByName(name: string): Promise<number | null> {
        try {
            const areas = await this.getAreas();
            const area = areas.find(a => a.name === name);

            if (!area) return null;

            return area.id;
        } catch (error) {
            logger.error(`getAreaIdByName Error: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /** 判斷 id 是否為無效的地區 id
     * @param id Area 的 id (可傳入一個 id 或多個 id)
     * @returns 是否為無效的地區 id
     */
    async isNotValidAreaId(id: number | number[]): Promise<boolean> {
        try {
            const areas = await this.getAreas();
            if (Array.isArray(id)) return !id.every(i => areas.some(a => i === a.id));
            else return !areas.some(a => id === a.id);
        } catch (error) {
            logger.error(`isNotValidAreaId Error: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
}

export let areaCache: AreaCache;
/** 初始化 AreaCache */
export async function initAreaCache(dataSource: DataSource, redis: Redis) {
    areaCache = new AreaCache(dataSource, redis);
    await areaCache.initAreasToRedis();
}
