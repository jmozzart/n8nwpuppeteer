"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddUserActivatedProperty1681134145996 = void 0;
class AddUserActivatedProperty1681134145996 {
    async up({ queryRunner, tablePrefix }) {
        const activatedUsers = (await queryRunner.query(`SELECT DISTINCT sw."userId" AS id,
				JSONB_SET(COALESCE(u.settings::jsonb, '{}'), '{userActivated}', 'true', true) as settings
			FROM  ${tablePrefix}workflow_statistics ws
						JOIN ${tablePrefix}shared_workflow sw
							ON ws."workflowId" = sw."workflowId"
						JOIN ${tablePrefix}role r
							ON r.id = sw."roleId"
						JOIN "${tablePrefix}user" u
							ON u.id = sw."userId"
			WHERE ws.name = 'production_success'
						AND r.name = 'owner'
						AND r.scope = 'workflow'`));
        const updatedUserPromises = activatedUsers.map(async (user) => {
            await queryRunner.query(`UPDATE "${tablePrefix}user" SET settings = '${JSON.stringify(user.settings)}' WHERE id = '${user.id}' `);
        });
        await Promise.all(updatedUserPromises);
        if (!activatedUsers.length) {
            await queryRunner.query(`UPDATE "${tablePrefix}user" SET settings = JSONB_SET(COALESCE(settings::jsonb, '{}'), '{userActivated}', 'false', true)`);
        }
        else {
            const activatedUserIds = activatedUsers.map((user) => `'${user.id}'`).join(',');
            await queryRunner.query(`UPDATE "${tablePrefix}user" SET settings = JSONB_SET(COALESCE(settings::jsonb, '{}'), '{userActivated}', 'false', true) WHERE id NOT IN (${activatedUserIds})`);
        }
    }
    async down({ queryRunner, tablePrefix }) {
        await queryRunner.query(`UPDATE "${tablePrefix}user" SET settings = settings::jsonb - 'userActivated'`);
        await queryRunner.query(`UPDATE "${tablePrefix}user" SET settings = NULL WHERE settings::jsonb = '{}'::jsonb`);
    }
}
exports.AddUserActivatedProperty1681134145996 = AddUserActivatedProperty1681134145996;
//# sourceMappingURL=1681134145996-AddUserActivatedProperty.js.map