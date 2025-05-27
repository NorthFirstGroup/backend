import { UserRole } from '../entities/User';
import bcrypt from 'bcrypt'

const saltRounds = 10;

export const userIds = [
    '11111111-1111-1111-1111-111111111121', // User 1
    '11111111-1111-1111-1111-111111111122', // User 2
    '11111111-1111-1111-1111-111111111131', // Organizer 1
    '11111111-1111-1111-1111-111111111132', // Organizer 2
    '11111111-1111-1111-1111-111111111141', // Admin
];

export const organizerIds = [
    '11111111-1111-1111-2222-111111111131',
    '11111111-1111-1111-2222-111111111132',
];

export async function getSeedUsers() {
  const hashedUserPassword = await bcrypt.hash('User123456789', saltRounds);
  const hashedOrganizerPassword = await bcrypt.hash('Org123456789', saltRounds);
  const hashedAdminPassword = await bcrypt.hash('Admin123456789', saltRounds);
  const users = [
    {
      id: userIds[0],
      nick_name: 'user001',
      email: 'user001@gmail.com',
      password_hash: hashedUserPassword,
      status: 1,
      role: UserRole.USER,
      phone: '0912345678',
    },
    {
      id: userIds[1],
      nick_name: 'user002',
      email: 'user002@gmail.com',
      password_hash: hashedUserPassword,
      status: 1,
      role: UserRole.USER,
      phone: '0932345678',
    },
    {
      id: userIds[2],
      nick_name: 'organizer001',
      email: 'organizer001@gmail.com',
      password_hash: hashedOrganizerPassword,
      status: 1,
      role: UserRole.ORGANIZER,
      phone: '0931345679',
    },
    {
      id: userIds[3],
      nick_name: 'organizer002',
      email: 'organizer002@gmail.com',
      password_hash: hashedOrganizerPassword,
      status: 1,
      role: UserRole.ORGANIZER,
      phone: '0912345679',
    },
    {
      id: userIds[4],
      nick_name: 'admin',
      email: 'admin@example.com',
      password_hash: hashedAdminPassword,
      status: 1,
      role: UserRole.ADMIN,
      phone: '0987654321',
    },
  ];
  return users;
}

export const organizers = [
    {
        id: organizerIds[0],
        name: '活動一組',
        user_id: userIds[2],
        status: 1,
        ubn: '12345678',
        president: '王小明',
        phone: '0912345678',
        address: '臺北市松山區民族東路28號',
    },
    {
        id: organizerIds[1],
        name: '活動二組',
        user_id: userIds[3],
        status: 1,
        ubn: '99887766',
        president: '陳聰明',
        phone: '0912678123',
        address: '高雄市鳳山區文湖街27號',
    },
];