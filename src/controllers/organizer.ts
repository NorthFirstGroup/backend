import { Response, NextFunction } from 'express'
import { Request as JWTRequest } from 'express-jwt'
import { dataSource } from '../db/data-source'
import { getAuthUser } from '../middlewares/auth'
import getLogger from '../utils/logger'
import responseSend, { initResponseData } from '../utils/serverResponse'
import formidable from 'formidable'
import { uploadPublicImage } from '../utils/uploadFile'
import { DbEntity } from '../constants/dbEntity'
import { ShowtimesEntity } from '../entities/Showtimes'
import { ShowtimeSectionsEntity } from '../entities/ShowtimeSections'
import { ActivityEntity } from '../entities/Activity'
import { ActivitySiteEntity } from '../entities/ActivitySite'
import { OrganizerEntity } from '../entities/Organizer'
import { isNotValidString, isNotValidInteger, isValidDateFormat, isNotValidUrl } from '../utils/validation'
import { seatInventoryService } from '../utils/seatInventory';


import dayjs from 'dayjs';
import 'dayjs/locale/zh-tw';
import { OrderEntity } from '../entities/Order'
dayjs.locale('zh-tw');

class CustomHttpError extends Error {
    statusCode: number;
    errorCode: number;
    constructor(message: string, errorCode: number, statusCode: number = 400) {
        super(message);
        this.name = 'CustomHttpError';
        this.errorCode = errorCode;
        this.statusCode = statusCode;
    }
}

const logger = getLogger('Organizer')

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = {
    'image/jpeg': true,
    'image/png': true,
    'image/gif': true
} as const;
type AllowedMimeTypes = keyof typeof ALLOWED_MIME_TYPES;

export async function getActivity(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { id: userId } = getAuthUser(req);
        const name = req.query.name;
        const categoryId = parseInt(req.query.category as string) || null;
        const status = parseInt(req.query.status as string) || null;
        const offset = parseInt(req.query.offset as string) || 0;
        const limit = parseInt(req.query.limit as string) || 10;
        const qb = dataSource
            .getRepository(ActivityEntity)
            .createQueryBuilder('activity')
            .innerJoin('activity.organizer', 'organizer')
            .leftJoinAndSelect('activity.category', 'category')
            .leftJoinAndSelect('activity.sites', 'sites')
            .where('organizer.user_id = :userId', { userId })
            .andWhere('activity.is_deleted = false');

        // Optional filters
        if (name) {
            qb.andWhere('activity.name ILIKE :name', { name: `%${name}%` });
        }

        if (typeof status === 'number') {
            qb.andWhere('activity.status = :status', { status });
        }

        if (categoryId) {
            qb.andWhere('activity.category_id = :categoryId', { categoryId });
        }

        qb.orderBy('activity.created_at', 'DESC');

        // Pagination
        qb.skip(offset).take(limit);

        const [activities, total_count] = await qb.getManyAndCount();
        const responseData = initResponseData(res, 2000);
        responseData.data = {
            total_count: total_count,
            results: activities
        };
        responseSend(responseData);
    } catch (error) {
        logger.error(`取得廠商活動錯誤：${error}`)
        next(error)
    }
}

export async function getActivityById(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const { id: userId } = getAuthUser(req);
        const activityId = parseInt(req.params.activity_id as string) || null;

        console.log(`activityId: ${activityId}`);
        if (!activityId) {
            responseSend(initResponseData(res, 1000), logger)
            return
        }

        const qb = dataSource
            .getRepository(ActivityEntity)
            .createQueryBuilder('activity')
            .innerJoin('activity.organizer', 'organizer')
            .where('organizer.user_id = :userId', { userId })
            .andWhere('activity.id = :activityId', { activityId })
            .andWhere('activity.is_deleted = false');


        const activity = await qb.getOne();
        if (!activity) {
            return responseSend(initResponseData(res, 1018), logger);
        }

        const responseData = initResponseData(res, 2000);
        responseData.data = {
            ...activity
        };
        responseSend(responseData);
    } catch (error) {
        logger.error(`取得廠商單一活動錯誤：${error}`)
        next(error)
    }
}

/** 上傳圖片 */
export async function postUploadImage(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const form = formidable({
            multiples: false,
            maxFileSize: MAX_FILE_SIZE,
            allowEmptyFiles: false,
            filter: ({ mimetype }) => {
                if (!mimetype) return false
                return !!ALLOWED_MIME_TYPES[mimetype as AllowedMimeTypes]
            }
        })

        const [_fields, files] = await form.parse(req)
        const rawFile = files.file
        const file: formidable.File | undefined = Array.isArray(rawFile) ? rawFile[0] : rawFile;
        if (!file || !file.filepath) {
            logger.error('No file uploaded')
            responseSend(initResponseData(res, 1013), logger)
            return
        }

        const url = await uploadPublicImage(file);
        responseSend(initResponseData(res, 2000, { url }))
    } catch (error) {
        logger.error('上傳圖片錯誤:', error)
        next(error)
    }
}


/* 取得廠商單一活動場次資料 */
// 包含: 演出時間 地點 地址 票價
export async function getActivityShowtimes(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const activity_id = parseInt(req.params.activity_id, 10)
        const user = getAuthUser(req)
        const userId = user.id

        // const showtimeRepo = dataSource.getRepository(DbEntity.Showtimes)

        const activityRepo = dataSource.getRepository(ActivityEntity);
        const organizerRepo = dataSource.getRepository(OrganizerEntity);
        // const activity = await activityRepo.findOneBy({ id: Number(activity_id) });
        // 取得活動資料
        const activity = await activityRepo.findOne({
            where: {
                id: activity_id                    
            }
        });
        // 取得廠商資料
        const organizer = await organizerRepo.findOne({
            where: {
                user_id: userId,
                status: 1,
                is_deleted: false,
            },
            relations: {
                user: true, // 同時加載 User 資訊
            },
        });

        // 檢查活動是否已建立
        if (!activity) {
            logger.error('無此活動')
            responseSend(initResponseData(res, 3001), logger)
            return
          }            
        
        if (!organizer || activity.organizer_id !== organizer.id) {
            logger.error('無權限察看或修改該活動')
            responseSend(initResponseData(res, 3003))
            return 
        }

        // const showtimes = await showtimeRepo.find({
        //     where: {
        //         activity_id: activity_id,
        //     },
        //     relations: [
        //         'site',
        //         'showtimeSections'
        //     ],
        //     order: { start_time: 'ASC' }
        // });

        const showtimes = await dataSource
            .getRepository(ShowtimesEntity)
            .createQueryBuilder('showtime')
            .leftJoinAndSelect('showtime.site', 'site')
            .leftJoinAndSelect('showtime.showtimeSections', 'section')
            .where('showtime.activity_id = :activityId', { activityId: activity_id })
            .orderBy('site.name', 'ASC')
            .addOrderBy('showtime.start_time', 'ASC')
            .getMany();
        
        // 結構轉換
        const formattedData = showtimes.map(showtime => {
            return {
                id: showtime.id,
                start_at: dayjs(showtime.start_time).format('YYYY/MM/DD (dd) HH:mm'),
                location: showtime.site.name,
                address: showtime.site.address,
                price: showtime.showtimeSections.map(section => section.price)
            };
        })

        responseSend(initResponseData(res, 2000, formattedData))
    } catch (error) {
        logger.error('取得廠商指定活動場次錯誤:', error)
        next(error)
    }
}

// 訂單請求 Body 介面
interface ShowtimeRequestBody {
    start_at: string; // 'YYYY-MM-DD HH:mm'
    site_id: string;  
}
// 新增活動場次
export async function postActivityShowtime(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const activity_id = parseInt(req.params.activity_id);
        const { start_at, site_id } = req.body as { site_id: string, start_at: string };
        const user = getAuthUser(req)
        const userId = user.id
        // let showtime: ShowtimesEntity;
        // // let site: ActivitySiteEntity;
        // let zones: { section: string; capacity: number }[];

        // 
        if (isNotValidInteger(activity_id)) {
            logger.error('活動Id格式錯誤')
            responseSend(initResponseData(res, 1000))
            return  
        }
        // 檢查日期格式
        const format = 'YYYY-MM-DD HH:mm'
        if (!isValidDateFormat(start_at, format)) {
            logger.error('日期時間格式錯誤，請填寫正確的時間')
            responseSend(initResponseData(res, 1010))
            return            
        }

        const newStart = dayjs(start_at, format);
        const newEnd = dayjs(newStart, format).add(3, 'hour'); // 假設每場 3 小時緩衝時間
        const formattedStartTime = newStart.toDate();
        await dataSource.transaction(async (manager) => {
            // 檢查廠商身分是否正確
            const organizer = await manager.findOne(OrganizerEntity, {
                where: {
                    user_id: userId,
                    status: 1,
                    is_deleted: false,
                } 
            });

            if (!organizer) {
                logger.error('廠商不存在或尚未通過驗證')
                responseSend(initResponseData(res, 1019))
                return
              }
            // 檢查活動是否已建立
            const activity = await manager.findOne(ActivityEntity, {
                where: {
                    id: activity_id                    
                }
            });

            if (!activity) {
                logger.error('無此活動')
                responseSend(initResponseData(res, 3001))
                return
              }
            
            if (activity.organizer_id !== organizer.id) {
                logger.error('無權限新增或修改該活動場次')
                responseSend(initResponseData(res, 3003))
                return 
            } 
      
            // 檢查活動場地是否已建立
            const site = await manager.findOne(ActivitySiteEntity, {
              where: { id: site_id },
            });
            if (!site) {
                logger.error('活動場地尚未建立')
                responseSend(initResponseData(res, 3002))
                return 
            }
            // 檢查場地是否為該活動所有
            if (site.activity_id !== activity_id) {
                logger.error('場地無效或與指定的活動不相符')
                responseSend(initResponseData(res, 3005))
                return 
            }
            
            // 檢查場次時間是否有衝突, 場次的start_at 應介於 avtivity.start_time ~  avtivity.end_time
            if (formattedStartTime < activity.start_time || formattedStartTime > activity.sales_end_time) {
                logger.error('場次開始時間異常')
                responseSend(initResponseData(res, 3006), logger);
                return;
            }

            // 檢查場次的時間地點是否重複
            const showtimeExist = await manager
                .createQueryBuilder(ShowtimesEntity, 'showtime')
                .where('showtime.site_id = :site_id', { site_id })
                .andWhere(
                    `showtime.start_time < :newEnd AND :newStart < showtime.start_time + interval '3 hours'`,
                    {
                      newStart: newStart.toDate(),
                      newEnd: newEnd.toDate(),
                    }
                  )
                  .getOne();            

            if (showtimeExist) {
                logger.error('該地點與時段已有其他場次，請選擇其他時間')
                responseSend(initResponseData(res, 3007), logger);
                return;                
            }

            // 建立場次
            const showtime = manager.create(ShowtimesEntity, {
                activity_id,
                site_id,
                start_time: formattedStartTime,
                seat_image: site.seating_map_url
            });
            await manager.save(showtime);

            // 建立場次區域票價資料
            const sections = site.prices.map((price) =>
                manager.create(ShowtimeSectionsEntity, {
                    activity_id,
                    site_id,
                    showtime,
                    section: price.section,
                    price: price.price,
                    capacity: price.capacity,
                    vacancy: price.capacity
                })
            );
            await manager.save(sections);

            const zones = sections.map((section) => ({
                section: section.section,
                capacity: section.capacity!,
              }));
            
            try {
                // 將新增場次寫入redis
                await seatInventoryService.initializeActivitySeats(showtime.id, zones);
            } catch (error) {
                logger.warn(`寫入 Redis 失敗，但不影響資料庫：${(error as Error).message}`);         
            }
            });       
        
        logger.info('場次建立成功');
        responseSend(initResponseData(res, 2000, undefined, '場次建立成功'))
    } catch (error) {
        logger.error('新增活動場次錯誤:', error)
        next(error)
    }
}

// 更新活動場次
export async function putActivityShowtime(req: JWTRequest, res: Response, next: NextFunction) {
    try {
        const activity_id = Number(req.params.activity_id);
        const showtime_id = req.params.showtime_id; // UUID
        const { site_id, start_at } = req.body as { site_id: string, start_at: string };

        const user = getAuthUser(req)
        const userId = user.id

        await dataSource.transaction(async (manager) => {
            const organizer = await manager.findOne(OrganizerEntity, {
                where: {
                    user_id: userId,
                    status: 1,
                    is_deleted: false,
                } 
            });

            if (!organizer) {
                logger.error('廠商不存在或尚未通過驗證')
                responseSend(initResponseData(res, 1019))
                return
              }
            
            const activity = await manager.findOne(ActivityEntity, {
                where: {
                    id: activity_id                    
                }
            });

            if (!activity) {
                logger.error('無此活動')
                responseSend(initResponseData(res, 3001))
                return
              }
            
            if (activity.organizer_id !== organizer.id) {
                logger.error('無權限修改該活動')
                responseSend(initResponseData(res, 3003))
                return 
            }       

            // 檢查場次是否存在
            const showtime = await manager
                .createQueryBuilder(ShowtimesEntity, 'showtime')
                .innerJoin('showtime.activity', 'activity')
                .where('showtime.id = :showtime_id', { showtime_id })
                .andWhere('activity.id = :activity_id', { activity_id })
                .getOne();
          
            if (!showtime) {
                logger.error('找不到此場次')
                responseSend(initResponseData(res, 3004))
                return             }            

            // 檢查日期格式
            if (!isValidDateFormat(start_at, 'YYYY-MM-DD HH:mm')) {
                responseSend(initResponseData(res, 1010))
                return            
            }            


            // 檢查該場次是否已開放售票或已有訂單


            // 檢查場次時間是否衝突

            // 檢查場地是否存在


            
            // 
            
            
            

              
        })

        

        responseSend(initResponseData(res, 2000))
    } catch (error) {
        logger.error('更新活動場次錯誤:', error)
        next(error)
    }
}

// 刪除活動場次
export async function deleteActivityShowtime(req: JWTRequest, res: Response, next: NextFunction) {
    try {

        responseSend(initResponseData(res, 2000))
    } catch (error) {
        logger.error('刪除活動場次錯誤:', error)
        next(error)
    }
}

// 取得票券座位資料 (驗證票券資料用)
export async function getTicket(req: JWTRequest, res: Response, next: NextFunction) {
    try {

        responseSend(initResponseData(res, 2000))
    } catch (error) {
        logger.error('取得票券資料錯誤:', error)
        next(error)
    }
}

// 更新票券座位資料 (驗證票券資料用)
export async function putTicket(req: JWTRequest, res: Response, next: NextFunction) {
    try {

        responseSend(initResponseData(res, 2000))
    } catch (error) {
        logger.error('更新票券資料錯誤:', error)
        next(error)
    }
}



