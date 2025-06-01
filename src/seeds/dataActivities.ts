import { organizerIds } from './dataUsers';
import { ActivityStatus } from '@enums/activity';

const activityNum = 29;
export const activityIds = Array.from({ length: activityNum }, (_, i) => i + 1);

export const activitySiteIds = [
    '11111111-1111-1111-3333-111111111111',
    '11111111-1111-1111-3333-111111111112',
    '11111111-1111-1111-3333-111111111113',
    '11111111-1111-1111-3333-111111111114',
    '11111111-1111-1111-3333-111111111115',
    '11111111-1111-1111-3333-111111111116',
    '11111111-1111-1111-3333-111111111117'
];

export const showtimeIds = [
    '11111111-1111-1111-4444-111111111111',
    '11111111-1111-1111-4444-111111111112',
    '11111111-1111-1111-4444-111111111113',
    '11111111-1111-1111-4444-111111111114',
    '11111111-1111-1111-4444-111111111115',
    '11111111-1111-1111-4444-111111111116',
    '11111111-1111-1111-4444-111111111117'
];

export const showtimeSectionIds = [
    '11111111-1111-1111-5555-111111111111',
    '11111111-1111-1111-5555-111111111112',
    '11111111-1111-1111-5555-111111111113',
    '11111111-1111-1111-5555-111111111114',
    '11111111-1111-1111-5555-111111111115',
    '11111111-1111-1111-5555-111111111116',
    '11111111-1111-1111-5555-111111111117',
    '11111111-1111-1111-5555-111111111118',
    '11111111-1111-1111-5555-111111111119',
    '11111111-1111-1111-5555-111111111120',
    '11111111-1111-1111-5555-111111111121',
    '11111111-1111-1111-5555-111111111122',
    '11111111-1111-1111-5555-111111111123',
    '11111111-1111-1111-5555-111111111124',
    '11111111-1111-1111-5555-111111111125',
    '11111111-1111-1111-5555-111111111126',
    '11111111-1111-1111-5555-111111111127',
    '11111111-1111-1111-5555-111111111128',
    '11111111-1111-1111-5555-111111111129',
    '11111111-1111-1111-5555-111111111130'
];

// status - 1:未上架, 2:已上架, 3:取消, 4:結束
export const activities = [
    {
        id: activityIds[0],
        name: '憂鬱，不只是藍色',
        organizer_id: organizerIds[0],
        category_id: 1,
        status: ActivityStatus.Published,
        description: '這是一個測試活動',
        information: '活動資訊',
        start_time: '2025-07-19 12:00+08',
        end_time: '2025-07-26 17:00+08',
        sales_start_time: '2025-05-20 12:00+08',
        sales_end_time: '2025-07-31 12:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/15f4d8bd-459e-45a0-ba31-b887674dff04.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/15f4d8bd-459e-45a0-ba31-b887674dff04.png'
    },
    {
        id: activityIds[1],
        name: '伍百 & China Blue 世界巡迴演唱會',
        organizer_id: organizerIds[1],
        category_id: 9,
        status: ActivityStatus.Published,
        description: '這是一個測試活動',
        information: '活動資訊',
        start_time: '2025-07-01 12:00+08',
        end_time: '2025-07-19 17:00+08',
        sales_start_time: '2025-06-02 22:00+08',
        sales_end_time: '2025-07-19 17:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/9e2d7cf2-52ed-4404-85fc-f64ec8cf6ca8.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/9e2d7cf2-52ed-4404-85fc-f64ec8cf6ca8.png'
    },
    {
        id: activityIds[2],
        name: '老派趴踢 Night Old Style Party Night with TJO',
        organizer_id: organizerIds[1],
        category_id: 9,
        status: ActivityStatus.Published,
        description: '這是一個測試活動',
        information: '活動資訊',
        start_time: '2025-07-19 18:00+08',
        end_time: '2025-07-19 21:00+08',
        sales_start_time: '2025-05-01 12:00+08',
        sales_end_time: '2025-07-19 18:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/29c72a6c-14c1-439f-be2e-32c083ebfa3d.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/29c72a6c-14c1-439f-be2e-32c083ebfa3d.png'
    },
    {
        id: activityIds[3],
        name: '蘇打綠《二十年一刻》巡迴演唱會',
        organizer_id: organizerIds[0],
        category_id: 9,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-08-01 12:00+08',
        end_time: '2025-08-15 12:00+08',
        sales_start_time: '2025-07-01 12:00+08',
        sales_end_time: '2025-08-15 12:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/84edbd0e-9494-483f-ac4d-e62bdecee5f6.jpg',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/84edbd0e-9494-483f-ac4d-e62bdecee5f6.jpg'
    },
    {
        id: activityIds[4],
        name: '六角學院同學會',
        organizer_id: organizerIds[0],
        category_id: 1,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-04-26 14:00+08',
        end_time: '2025-04-26 16:00+08',
        sales_start_time: '2025-03-01 12:00+08',
        sales_end_time: '2025-04-26 12:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/ca8c7bb5-9df9-4b8b-9094-75dd50057655.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/ca8c7bb5-9df9-4b8b-9094-75dd50057655.png'
    },
    {
        id: activityIds[5],
        name: '狀喔！狀狀x歐耶 雙人即興漫才',
        organizer_id: organizerIds[0],
        category_id: 3,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-07-22 00:00+08',
        end_time: '2025-07-22 24:00+08',
        sales_start_time: '2025-06-01 12:00+08',
        sales_end_time: '2025-07-22 12:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/528f636b-ab0e-4b73-bab1-43d270f42622.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/528f636b-ab0e-4b73-bab1-43d270f42622.png'
    },
    {
        id: activityIds[6],
        name: '未來奇境：AI 藝術大展',
        organizer_id: organizerIds[0],
        category_id: 4,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-08-09 14:00+08',
        end_time: '2025-08-09 16:00+08',
        sales_start_time: '2025-07-01 12:00+08',
        sales_end_time: '2025-08-09 12:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/e182f89e-c953-4f01-bdad-9741598864dd.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/e182f89e-c953-4f01-bdad-9741598864dd.png'
    },
    {
        id: activityIds[7],
        name: '時代重現！1990年代 經典金曲夜',
        organizer_id: organizerIds[0],
        category_id: 2,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-07-16 14:00+08',
        end_time: '2025-07-16 16:00+08',
        sales_start_time: '2025-06-01 12:00+08',
        sales_end_time: '2025-07-16 12:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/13ee6000-c283-426e-83fa-39ce989e0f7a.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/13ee6000-c283-426e-83fa-39ce989e0f7a.png'
    },
    {
        id: activityIds[8],
        name: '靈光閃舞 2025：跨界身體劇場秀',
        organizer_id: organizerIds[0],
        category_id: 8,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-08-13 14:00+08',
        end_time: '2025-08-13 16:00+08',
        sales_start_time: '2025-07-01 12:00+08',
        sales_end_time: '2025-08-13 12:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/7d989c0a-b3f7-46a3-b8a9-eed68a9328e7.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/7d989c0a-b3f7-46a3-b8a9-eed68a9328e7.png'
    },
    {
        id: activityIds[9],
        name: '綻FUN古典一錠聲銅管五重奏',
        organizer_id: organizerIds[0],
        category_id: 2,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-09-26 18:00+08',
        end_time: '2025-09-26 22:00+08',
        sales_start_time: '2025-07-01 12:00+08',
        sales_end_time: '2025-09-26 18:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/5f639d8e-c30d-4225-b7bc-7c470ee6acf5.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/5f639d8e-c30d-4225-b7bc-7c470ee6acf5.png'
    },
    {
        id: activityIds[10],
        name: '童話科學島：動手玩實驗！',
        organizer_id: organizerIds[0],
        category_id: 7,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-04-26 14:00+08',
        end_time: '2025-04-26 16:00+08',
        sales_start_time: '2025-03-01 12:00+08',
        sales_end_time: '2025-04-26 12:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/ff5346af-4b96-43f6-8b6e-fd906f971ac0.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/ff5346af-4b96-43f6-8b6e-fd906f971ac0.png'
    },
    {
        id: activityIds[11],
        name: '戶外重映：《真愛每一天》春日限定場',
        organizer_id: organizerIds[0],
        category_id: 1,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-08-12 17:00+08',
        end_time: '2025-08-12 19:00+08',
        sales_start_time: '2025-07-01 12:00+08',
        sales_end_time: '2025-08-12 19:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/49446979-5152-4bd7-a171-5ffb094a1ec9.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/49446979-5152-4bd7-a171-5ffb094a1ec9.png'
    },
    {
        id: activityIds[12],
        name: '城市邊界 LIVE｜森林系創作巡演',
        organizer_id: organizerIds[1],
        category_id: 2,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-09-12 09:00+08',
        end_time: '2025-09-12 12:00+08',
        sales_start_time: '2025-08-01 12:00+08',
        sales_end_time: '2025-09-12 12:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/e6ee0f93-dc4e-4dd1-82d2-28ac3073259a.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/e6ee0f93-dc4e-4dd1-82d2-28ac3073259a.png'
    },
    {
        id: activityIds[13],
        name: '光的解構：沉浸式光影藝術展',
        organizer_id: organizerIds[1],
        category_id: 4,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-09-19 09:00+08',
        end_time: '2025-09-19 17:00+08',
        sales_start_time: '2025-08-01 12:00+08',
        sales_end_time: '2025-09-19 17:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/8f406972-dda5-4034-a8ec-8994ff33f628.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/8f406972-dda5-4034-a8ec-8994ff33f628.png'
    },
    {
        id: activityIds[14],
        name: '親子食農學堂：春季田園市集體驗',
        organizer_id: organizerIds[1],
        category_id: 7,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-09-22 09:00+08',
        end_time: '2025-09-22 17:00+08',
        sales_start_time: '2025-08-01 12:00+08',
        sales_end_time: '2025-09-22 17:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/ed96e464-03b2-42ba-8b2c-1090daeeb18b.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/ed96e464-03b2-42ba-8b2c-1090daeeb18b.png'
    },
    {
        id: activityIds[15],
        name: '反重力流動｜現代舞 x 體感實驗場',
        organizer_id: organizerIds[1],
        category_id: 8,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-09-12 09:00+08',
        end_time: '2025-09-12 12:00+08',
        sales_start_time: '2025-08-01 12:00+08',
        sales_end_time: '2025-09-12 12:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/72c4c2a8-8a04-4121-b4d2-7092e9fe16e0.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/72c4c2a8-8a04-4121-b4d2-7092e9fe16e0.png'
    },
    {
        id: activityIds[16],
        name: '自由寫作術：打開文字感知的五堂課',
        organizer_id: organizerIds[1],
        category_id: 1,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-09-11 09:00+08',
        end_time: '2025-09-11 12:00+08',
        sales_start_time: '2025-08-01 12:00+08',
        sales_end_time: '2025-09-11 12:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/c8675876-3615-4c2d-9e53-5a484417b9f6.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/c8675876-3615-4c2d-9e53-5a484417b9f6.png'
    },
    {
        id: activityIds[17],
        name: '城市異想調香課：香氛 × 記憶地圖',
        organizer_id: organizerIds[1],
        category_id: 1,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-07-27 09:00+08',
        end_time: '2025-07-27 12:00+08',
        sales_start_time: '2025-06-25 12:00+08',
        sales_end_time: '2025-07-27 12:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/11320527-9e7b-4064-906d-ba6eacd5c66c.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/11320527-9e7b-4064-906d-ba6eacd5c66c.png'
    },
    {
        id: activityIds[18],
        name: '夜光畫室：一場只在黑夜進行的創作',
        organizer_id: organizerIds[1],
        category_id: 4,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-09-18 16:00+08',
        end_time: '2025-09-18 22:00+08',
        sales_start_time: '2025-08-01 12:00+08',
        sales_end_time: '2025-09-18 17:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/81abb14d-816c-4c02-a1ad-93bfe9b620bb.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/81abb14d-816c-4c02-a1ad-93bfe9b620bb.png'
    },
    {
        id: activityIds[19],
        name: '無聲派對：戴上耳機，在靜默中跳舞',
        organizer_id: organizerIds[1],
        category_id: 1,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-09-11 09:00+08',
        end_time: '2025-09-11 12:00+08',
        sales_start_time: '2025-08-01 12:00+08',
        sales_end_time: '2025-09-11 12:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/e93e8b4d-90b5-46f4-9577-45f14280887e.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/e93e8b4d-90b5-46f4-9577-45f14280887e.png'
    },
    {
        id: activityIds[20],
        name: '山系野營日：手作．煮食．露營光影',
        organizer_id: organizerIds[1],
        category_id: 10,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-10-09 09:00+08',
        end_time: '2025-10-10 12:00+08',
        sales_start_time: '2025-08-01 12:00+08',
        sales_end_time: '2025-10-08 12:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/6a1f2f2a-2a8c-43de-821c-0d3831125b1d.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/6a1f2f2a-2a8c-43de-821c-0d3831125b1d.png'
    },
    {
        id: activityIds[21],
        name: '星空音樂會',
        organizer_id: organizerIds[1],
        category_id: 2,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-07-12 18:00+08',
        end_time: '2025-07-12 21:00+08',
        sales_start_time: '2025-06-01 12:00+08',
        sales_end_time: '2025-07-12 12:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/fa174fae-3660-4efa-9a23-34a3ba0af2f3.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/fa174fae-3660-4efa-9a23-34a3ba0af2f3.png'
    },
    {
        id: activityIds[22],
        name: '爵士午後',
        organizer_id: organizerIds[1],
        category_id: 2,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-08-03 12:00+08',
        end_time: '2025-08-03 15:00+08',
        sales_start_time: '2025-07-01 12:00+08',
        sales_end_time: '2025-08-03 12:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/b73112ee-5d74-4053-af63-eb284ae9015b.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/b73112ee-5d74-4053-af63-eb284ae9015b.png'
    },
    {
        id: activityIds[23],
        name: '電音夜狂潮',
        organizer_id: organizerIds[1],
        category_id: 2,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-09-15 17:00+08',
        end_time: '2025-09-15 22:00+08',
        sales_start_time: '2025-07-01 12:00+08',
        sales_end_time: '2025-09-15 12:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/c32314ef-c5bb-4fd3-b1bc-c28d21dad402.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/c32314ef-c5bb-4fd3-b1bc-c28d21dad402.png'
    },
    {
        id: activityIds[24],
        name: '森林民謠',
        organizer_id: organizerIds[1],
        category_id: 2,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-10-21 13:00+08',
        end_time: '2025-10-21 17:00+08',
        sales_start_time: '2025-08-01 12:00+08',
        sales_end_time: '2025-10-21 17:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/05a89316-9e32-4f33-9fe6-264f21e58923.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/05a89316-9e32-4f33-9fe6-264f21e58923.png'
    },
    {
        id: activityIds[25],
        name: '古典之夜',
        organizer_id: organizerIds[1],
        category_id: 1,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-11-01 18:00+08',
        end_time: '2025-11-01 21:00+08',
        sales_start_time: '2025-08-01 12:00+08',
        sales_end_time: '2025-11-01 18:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/daa7b6a0-3717-4bae-a66b-d1839db5e34e.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/daa7b6a0-3717-4bae-a66b-d1839db5e34e.png'
    },
    {
        id: activityIds[26],
        name: '親子音樂會：音樂動物園',
        organizer_id: organizerIds[1],
        category_id: 7,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-12-05 09:00+08',
        end_time: '2025-12-05 17:00+08',
        sales_start_time: '2025-09-01 12:00+08',
        sales_end_time: '2025-12-05 17:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/44ff68e8-540e-4f73-a6d3-dda8e7a63c70.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/44ff68e8-540e-4f73-a6d3-dda8e7a63c70.png'
    },
    {
        id: activityIds[27],
        name: '城市搖滾',
        organizer_id: organizerIds[0],
        category_id: 2,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2025-12-05 17:00+08',
        end_time: '2026-01-17 21:00+08',
        sales_start_time: '2025-10-01 12:00+08',
        sales_end_time: '2026-01-17 17:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/a50ac2f8-0e84-4057-8947-73f168aceb69.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/a50ac2f8-0e84-4057-8947-73f168aceb69.png'
    },
    {
        id: activityIds[28],
        name: '冬日詩歌音樂會',
        organizer_id: organizerIds[0],
        category_id: 1,
        status: ActivityStatus.Published,
        description: '測試活動',
        information: '活動資訊',
        start_time: '2026-02-28 15:00+08',
        end_time: '2026-02-28 18:00+08',
        sales_start_time: '2025-12-01 12:00+08',
        sales_end_time: '2026-02-28 17:00+08',
        cover_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/122635c6-47e8-4718-95f8-b1f7b62f63a0.png',
        banner_image:
            'https://goticket-bucket.s3.ap-northeast-1.amazonaws.com/public/images/122635c6-47e8-4718-95f8-b1f7b62f63a0.png'
    }
];

export const activitySites = [
    {
        id: activitySiteIds[0],
        activity_id: activityIds[0],
        area_id: 2,
        name: '台北小巨蛋',
        address: '台北市松山區南京東路四段2號',
        seating_map_url: '',
        seat_capacity: 10000,
        prices: [
            { section: 'A區', price: 2000, capacity: 5000 },
            { section: 'B區', price: 1500, capacity: 3000 },
            { section: 'C區', price: 1000, capacity: 2000 }
        ]
    },
    {
        id: activitySiteIds[1],
        activity_id: activityIds[0],
        area_id: 8,
        name: '台中巨蛋',
        address: '台中市北區建國北路2號',
        seating_map_url: '',
        seat_capacity: 15000,
        prices: [
            { section: 'A區', price: 2500, capacity: 6000 },
            { section: 'B區', price: 2000, capacity: 4000 },
            { section: 'C區', price: 1500, capacity: 5000 }
        ]
    },
    {
        id: activitySiteIds[2],
        activity_id: activityIds[0],
        area_id: 15,
        name: '高雄巨蛋',
        address: '高雄市前鎮區成功二路2號',
        seating_map_url: '',
        seat_capacity: 12000,
        prices: [
            { section: 'A區', price: 2200, capacity: 5500 },
            { section: 'B區', price: 1800, capacity: 3500 },
            { section: 'C區', price: 1300, capacity: 3000 }
        ]
    },
    {
        id: activitySiteIds[3],
        activity_id: activityIds[1],
        area_id: 2,
        name: '台北小巨蛋',
        address: '台北市松山區南京東路四段2號',
        seating_map_url: '',
        seat_capacity: 10000,
        prices: [
            { section: 'A區', price: 3000, capacity: 5000 },
            { section: 'B區', price: 2500, capacity: 3000 },
            { section: 'C區', price: 2000, capacity: 2000 }
        ]
    },
    {
        id: activitySiteIds[4],
        activity_id: activityIds[1],
        area_id: 8,
        name: '台中巨蛋',
        address: '台中市北區建國北路2號',
        seating_map_url: '',
        seat_capacity: 15000,
        prices: [
            { section: 'A區', price: 3500, capacity: 6000 },
            { section: 'B區', price: 3000, capacity: 4000 },
            { section: 'C區', price: 2500, capacity: 5000 }
        ]
    },
    {
        id: activitySiteIds[5],
        activity_id: activityIds[2],
        area_id: 15,
        name: '高雄巨蛋',
        address: '高雄市前鎮區成功二路2號',
        seating_map_url: '',
        seat_capacity: 12000,
        prices: [
            { section: 'A區', price: 2800, capacity: 5500 },
            { section: 'B區', price: 2300, capacity: 3500 },
            { section: 'C區', price: 1800, capacity: 3000 }
        ]
    },
    {
        id: activitySiteIds[6],
        activity_id: activityIds[3],
        area_id: 15,
        name: '高雄巨蛋',
        address: '高雄市前鎮區成功二路2號',
        seating_map_url: '',
        seat_capacity: 12000,
        prices: [
            { section: '特一區', price: 5380, capacity: 2500 },
            { section: '特二區', price: 4980, capacity: 2500 }
        ]
    }
];

export const showtimes = [
    {
        id: showtimeIds[0],
        site_id: activitySiteIds[0],
        activity_id: activityIds[0],
        start_time: '2025-07-19 17:00+08',
        seat_image: ''
    },
    {
        id: showtimeIds[1],
        site_id: activitySiteIds[1],
        activity_id: activityIds[0],
        start_time: '2025-07-20 17:00+08',
        seat_image: ''
    },
    {
        id: showtimeIds[2],
        site_id: activitySiteIds[2],
        activity_id: activityIds[0],
        start_time: '2025-07-26 17:00+08',
        seat_image: ''
    },
    {
        id: showtimeIds[3],
        site_id: activitySiteIds[3],
        activity_id: activityIds[1],
        start_time: '2025-07-19 17:00+08',
        seat_image: ''
    },
    {
        id: showtimeIds[4],
        site_id: activitySiteIds[4],
        activity_id: activityIds[1],
        start_time: '2025-07-12 12:00+08',
        seat_image: ''
    },
    {
        id: showtimeIds[5],
        site_id: activitySiteIds[5],
        activity_id: activityIds[2],
        start_time: '2025-07-05 12:00+08',
        seat_image: ''
    },
    {
        id: showtimeIds[6],
        site_id: activitySiteIds[6],
        activity_id: activityIds[3],
        start_time: '2025-08-01 12:00+08',
        seat_image: ''
    }
];

export const showtimeSections = [
    {
        id: showtimeSectionIds[0],
        showtime_id: showtimeIds[0],
        site_id: activitySiteIds[0],
        activity_id: activityIds[0],
        section: 'A區',
        price: 2000,
        capacity: 5000,
        vacancy: 4998 // 假設有2張已售出
    },
    {
        id: showtimeSectionIds[1],
        showtime_id: showtimeIds[0],
        site_id: activitySiteIds[0],
        activity_id: activityIds[0],
        section: 'B區',
        price: 1500,
        capacity: 3000,
        vacancy: 3000
    },
    {
        id: showtimeSectionIds[2],
        showtime_id: showtimeIds[0],
        site_id: activitySiteIds[0],
        activity_id: activityIds[0],
        section: 'C區',
        price: 1000,
        capacity: 2000,
        vacancy: 2000
    },
    {
        id: showtimeSectionIds[3],
        showtime_id: showtimeIds[1],
        site_id: activitySiteIds[1],
        activity_id: activityIds[0],
        section: 'A區',
        price: 2500,
        capacity: 6000,
        vacancy: 5998 // 假設有2張已售出
    },
    {
        id: showtimeSectionIds[4],
        showtime_id: showtimeIds[1],
        site_id: activitySiteIds[1],
        activity_id: activityIds[0],
        section: 'B區',
        price: 2000,
        capacity: 4000,
        vacancy: 3998 // 假設有2張已售出
    },
    {
        id: showtimeSectionIds[5],
        showtime_id: showtimeIds[1],
        site_id: activitySiteIds[1],
        activity_id: activityIds[0],
        section: 'C區',
        price: 1500,
        capacity: 3000,
        vacancy: 2996 // 假設有4張已售出
    },
    {
        id: showtimeSectionIds[6],
        showtime_id: showtimeIds[2],
        site_id: activitySiteIds[2],
        activity_id: activityIds[0],
        section: 'A區',
        price: 2200,
        capacity: 5500,
        vacancy: 5500
    },
    {
        id: showtimeSectionIds[7],
        showtime_id: showtimeIds[2],
        site_id: activitySiteIds[2],
        activity_id: activityIds[0],
        section: 'B區',
        price: 1800,
        capacity: 3500,
        vacancy: 3500
    },
    {
        id: showtimeSectionIds[8],
        showtime_id: showtimeIds[2],
        site_id: activitySiteIds[2],
        activity_id: activityIds[0],
        section: 'C區',
        price: 1300,
        capacity: 3000,
        vacancy: 3000
    },
    {
        id: showtimeSectionIds[9],
        showtime_id: showtimeIds[3],
        site_id: activitySiteIds[3],
        activity_id: activityIds[1],
        section: 'A區',
        price: 3000,
        capacity: 5000,
        vacancy: 5000
    },
    {
        id: showtimeSectionIds[10],
        showtime_id: showtimeIds[3],
        site_id: activitySiteIds[3],
        activity_id: activityIds[1],
        section: 'B區',
        price: 2500,
        capacity: 3000,
        vacancy: 2998 // 假設有2張已售出
    },
    {
        id: showtimeSectionIds[11],
        showtime_id: showtimeIds[3],
        site_id: activitySiteIds[3],
        activity_id: activityIds[1],
        section: 'C區',
        price: 2000,
        capacity: 2000,
        vacancy: 2000
    },
    {
        id: showtimeSectionIds[12],
        showtime_id: showtimeIds[4],
        site_id: activitySiteIds[4],
        activity_id: activityIds[1],
        section: 'A區',
        price: 3500,
        capacity: 6000,
        vacancy: 6000
    },
    {
        id: showtimeSectionIds[13],
        showtime_id: showtimeIds[4],
        site_id: activitySiteIds[4],
        activity_id: activityIds[1],
        section: 'B區',
        price: 3000,
        capacity: 4000,
        vacancy: 4000
    },
    {
        id: showtimeSectionIds[14],
        showtime_id: showtimeIds[4],
        site_id: activitySiteIds[4],
        activity_id: activityIds[1],
        section: 'C區',
        price: 2500,
        capacity: 5000,
        vacancy: 5000
    },
    {
        id: showtimeSectionIds[15],
        showtime_id: showtimeIds[5],
        site_id: activitySiteIds[5],
        activity_id: activityIds[2],
        section: 'A區',
        price: 2800,
        capacity: 5500,
        vacancy: 5500
    },
    {
        id: showtimeSectionIds[16],
        showtime_id: showtimeIds[5],
        site_id: activitySiteIds[5],
        activity_id: activityIds[2],
        section: 'B區',
        price: 2300,
        capacity: 3500,
        vacancy: 3500
    },
    {
        id: showtimeSectionIds[17],
        showtime_id: showtimeIds[5],
        site_id: activitySiteIds[5],
        activity_id: activityIds[2],
        section: 'C區',
        price: 1800,
        capacity: 3000,
        vacancy: 2999 // 假設有1張已售出
    },
    {
        id: showtimeSectionIds[18],
        showtime_id: showtimeIds[6],
        site_id: activitySiteIds[6],
        activity_id: activityIds[3],
        section: '特一區',
        price: 5380,
        capacity: 2500,
        vacancy: 2500 //
    },
    {
        id: showtimeSectionIds[19],
        showtime_id: showtimeIds[6],
        site_id: activitySiteIds[6],
        activity_id: activityIds[3],
        section: '特二區',
        price: 4980,
        capacity: 2500,
        vacancy: 2500 //
    }
];
