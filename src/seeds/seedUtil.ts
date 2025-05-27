import { dataSource } from '../db/data-source'

export async function resetTable(tableName: string) {
    await dataSource.initialize();
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
        await queryRunner.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
        await queryRunner.commitTransaction();
        console.log(`Reset '${tableName}' table completed.`);
    } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error('Error during reset:', error);
        process.exit(1);
    } finally {
        await queryRunner.release();
        await dataSource.destroy();
    }
}

export async function seedTable<T>(tableName: string, data: T[]) {
    if (!Array.isArray(data) || data.length === 0) {
        console.error(`No '${tableName}' data provided for seeding.`);
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
        console.log(`Seeding '${tableName}' table completed.`);
    } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error('Error during seeding:', error);
        process.exit(1);
    } finally {
        await queryRunner.release();
        await dataSource.destroy();
    }
}