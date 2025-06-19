import { userIds } from './dataUsers';
import { showtimeIds, showtimeSectionIds } from './dataActivities';

export const orderIds = [1, 2, 3, 4, 5];

export const orderTicketIds = [
    '11111111-1111-1111-6666-111111111111',
    '11111111-1111-1111-6666-111111111112',
    '11111111-1111-1111-6666-111111111113',
    '11111111-1111-1111-6666-111111111114',
    '11111111-1111-1111-6666-111111111115',
    '11111111-1111-1111-6666-111111111116'
];

export const orders = [
    {
        id: orderIds[0],
        user_id: userIds[0],
        showtime_id: showtimeIds[0],
        order_number: '2025060300001',
        total_count: 2,
        total_price: 4000,
        status: 'PROCESSING',
        payment_status: 'PENDING',
        created_at: new Date('2025-06-03 12:00+08')
    },
    {
        id: orderIds[1],
        user_id: userIds[0],
        showtime_id: showtimeIds[1],
        order_number: '2025060300002',
        total_count: 8,
        total_price: 15000,
        status: 'COMPLETED',
        payment_method: 'CREDIT_CARD',
        payment_status: 'PAID',
        paid_at: new Date('2025-06-03 18:04:03.2612+08'),
        created_at: new Date('2025-06-03 18:00+08')
    },
    {
        id: orderIds[2],
        user_id: userIds[0],
        showtime_id: showtimeIds[2],
        order_number: '2025061000001',
        total_count: 2,
        total_price: 3600,
        status: 'CANCELLED',
        payment_status: 'FAILED',
        created_at: new Date('2025-06-10 17:30+08')
    },
    {
        id: orderIds[3],
        user_id: userIds[1],
        showtime_id: showtimeIds[3],
        order_number: '2025061500001',
        total_count: 2,
        total_price: 5000,
        status: 'COMPLETED',
        payment_method: 'CREDIT_CARD',
        payment_status: 'PAID',
        paid_at: new Date('2025-06-15 09:04+08'),
        created_at: new Date('2025-06-15 09:00+08')
    },
    {
        id: orderIds[4],
        user_id: userIds[1],
        showtime_id: showtimeIds[5],
        order_number: '2025061800001',
        total_count: 1,
        total_price: 1800,
        status: 'COMPLETED',
        payment_method: 'CREDIT_CARD',
        payment_status: 'PAID',
        paid_at: new Date('2025-06-18 19:35+08'),
        created_at: new Date('2025-06-18 19:30+08')
    }
];

export const orderTickets = [
    {
        id: orderTicketIds[0],
        order_id: orderIds[0],
        section_id: showtimeSectionIds[0],
        price: 2000,
        quantity: 2,
        ticket_type: 1 // 電子票券
    },
    {
        id: orderTicketIds[1],
        order_id: orderIds[1],
        section_id: showtimeSectionIds[3],
        price: 2500,
        quantity: 2,
        ticket_type: 1 // 電子票券
    },
    {
        id: orderTicketIds[2],
        order_id: orderIds[1],
        section_id: showtimeSectionIds[4],
        price: 2000,
        quantity: 2,
        ticket_type: 1 // 電子票券
    },
    {
        id: orderTicketIds[3],
        order_id: orderIds[1],
        section_id: showtimeSectionIds[5],
        price: 1500,
        quantity: 4,
        ticket_type: 1 // 電子票券
    },
    {
        id: orderTicketIds[4],
        order_id: orderIds[3],
        section_id: showtimeSectionIds[10],
        price: 2500,
        quantity: 2,
        ticket_type: 1 // 電子票券
    },
    {
        id: orderTicketIds[5],
        order_id: orderIds[4],
        section_id: showtimeSectionIds[17],
        price: 1800,
        quantity: 1,
        ticket_type: 1 // 電子票券
    }
];

export const tickets = [
    {
        order_id: orderIds[1],
        order_ticket_id: orderTicketIds[1],
        order_number: '2025060300002',
        section: 'A區',
        price: 2500,
        ticket_code: '',
        status: 0, // 未使用
        certificate_url: ''
    },
    {
        order_id: orderIds[1],
        order_ticket_id: orderTicketIds[1],
        order_number: '2025060300002',
        section: 'A區',
        price: 2500,
        ticket_code: '',
        status: 0, // 未使用
        certificate_url: ''
    },
    {
        order_id: orderIds[1],
        order_ticket_id: orderTicketIds[2],
        order_number: '2025060300002',
        section: 'B區',
        price: 2000,
        ticket_code: '',
        status: 0, // 未使用
        certificate_url: ''
    },
    {
        order_id: orderIds[1],
        order_ticket_id: orderTicketIds[2],
        order_number: '2025060300002',
        section: 'B區',
        price: 2000,
        ticket_code: '',
        status: 0, // 未使用
        certificate_url: ''
    },
    {
        order_id: orderIds[1],
        order_ticket_id: orderTicketIds[3],
        order_number: '2025060300002',
        section: 'C區',
        price: 1500,
        ticket_code: '',
        status: 0, // 未使用
        certificate_url: ''
    },
    {
        order_id: orderIds[1],
        order_ticket_id: orderTicketIds[3],
        order_number: '2025060300002',
        section: 'C區',
        price: 1500,
        ticket_code: '',
        status: 0, // 未使用
        certificate_url: ''
    },
    {
        order_id: orderIds[1],
        order_ticket_id: orderTicketIds[3],
        order_number: '2025060300002',
        section: 'C區',
        price: 1500,
        ticket_code: '',
        status: 0, // 未使用
        certificate_url: ''
    },
    {
        order_id: orderIds[1],
        order_ticket_id: orderTicketIds[3],
        order_number: '2025060300002',
        section: 'C區',
        price: 1500,
        ticket_code: '',
        status: 0, // 未使用
        certificate_url: ''
    },
    {
        order_id: orderIds[3],
        order_ticket_id: orderTicketIds[4],
        order_number: '2025061500001',
        section: 'B區',
        price: 2500,
        ticket_code: '',
        status: 0, // 未使用
        certificate_url: ''
    },
    {
        order_id: orderIds[3],
        order_ticket_id: orderTicketIds[4],
        order_number: '2025061500001',
        section: 'B區',
        price: 2500,
        ticket_code: '',
        status: 0, // 未使用
        certificate_url: ''
    },
    {
        order_id: orderIds[4],
        order_ticket_id: orderTicketIds[5],
        order_number: '2025061800001',
        section: 'C區',
        price: 1800,
        ticket_code: '',
        status: 0, // 未使用
        certificate_url: ''
    }
];
