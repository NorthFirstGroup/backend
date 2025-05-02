import { MigrationInterface, QueryRunner } from 'typeorm';

const taiwanAreas = [
    '基隆市',
    '台北市',
    '新北市',
    '桃園市',
    '新竹市',
    '新竹縣',
    '苗栗縣',
    '台中市',
    '彰化縣',
    '南投縣',
    '雲林縣',
    '嘉義市',
    '嘉義縣',
    '台南市',
    '高雄市',
    '屏東縣',
    '宜蘭縣',
    '花蓮縣',
    '台東縣',
    '澎湖縣',
    '金門縣',
    '連江縣',
]

/** 初始地區種子資料，class名必須為時間戳13位格式，否則會出錯  */
export class InitAreas1746067916000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 檢查是否已存在資料
        const count = await queryRunner.manager
            .createQueryBuilder()
            .select()
            .from('Area', 'area')
            .getCount();

        if (count === 0) {
            // 插入台灣地區資料
            await queryRunner.manager
                .createQueryBuilder()
                .insert()
                .into('Area')
                .values(taiwanAreas.map((name) => ({ name })))
                .execute();
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 回滾操作：刪除所有 Area 資料
        await queryRunner.manager
            .createQueryBuilder()
            .delete()
            .from('Area')
            .execute();
    }
}