import { DbEntity } from '../constants/dbEntity';
import { resetTable, seedTable } from './seedUtil';
import { areas, categories } from './dataCommon';
import { getSeedUsers, organizers } from './dataUsers';
import { activities, activitySites, showtimes, showtimeSections } from './dataActivities';
import { orders, orderTickets, tickets } from './dataOrders';

async function reset() {
    await resetTable(DbEntity.Area);
    await resetTable(DbEntity.User);
    await resetTable(DbEntity.Organizer);
    await resetTable(DbEntity.ActivityType);
    await resetTable(DbEntity.Activity);
    await resetTable(DbEntity.ActivitySite);
    await resetTable(DbEntity.Showtimes);
    await resetTable(DbEntity.ShowtimeSections);
    await resetTable(DbEntity.Order);
    await resetTable(DbEntity.OrderTicket);
    await resetTable(DbEntity.Ticket);
}

async function seed() {
    await seedTable(DbEntity.Area, areas);
    const users = await getSeedUsers();
    await seedTable(DbEntity.User, users);
    await seedTable(DbEntity.Organizer, organizers);
    await seedTable(DbEntity.ActivityType, categories);
    await seedTable(DbEntity.Activity, activities);
    await seedTable(DbEntity.ActivitySite, activitySites);
    await seedTable(DbEntity.Showtimes, showtimes);
    await seedTable(DbEntity.ShowtimeSections, showtimeSections);
    await seedTable(DbEntity.Order, orders);
    await seedTable(DbEntity.OrderTicket, orderTickets);
    await seedTable(DbEntity.Ticket, tickets);
}

(async () => {
    await reset();
    await seed();
})();