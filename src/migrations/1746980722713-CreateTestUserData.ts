import { MigrationInterface, QueryRunner } from 'typeorm';
import bcrypt from 'bcrypt';

export class CreateTestUserData1746980722713 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const saltRounds = 10;
        const password_hash = await bcrypt.hash('Qwert2025', saltRounds);

        await queryRunner.query(
            `
            INSERT INTO "User" ("id", "nick_name", "email", "password_hash", "status", "role")
            VALUES ('11111111-1111-1111-1111-111111111111','Test00', 'Testuser@example.com', $1, 1, 'USER'
            );
            `,
            [password_hash]
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "User" WHERE "id" = '11111111-1111-1111-1111-111111111111'
          `);
    }
}
