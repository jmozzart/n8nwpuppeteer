"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddUserActivatedProperty1681134145996 = void 0;
class AddUserActivatedProperty1681134145996 {
    async up({ queryRunner, tablePrefix }) {
        const activatedUsers = (await queryRunner.query(`SELECT DISTINCT sw.userId AS id,
				JSON_SET(COALESCE(u.settings, '{}'), '$.userActivated', true) AS settings
			FROM ${tablePrefix}workflow_statistics AS ws
						JOIN ${tablePrefix}shared_workflow as sw
							ON ws.workflowId = sw.workflowId
						JOIN ${tablePrefix}role AS r
							ON r.id = sw.roleId
						JOIN ${tablePrefix}user AS u
							ON u.id = sw.userId
			WHERE ws.name = 'production_success'
						AND r.name = 'owner'
						AND r.scope = 'workflow'`));
        const updatedUsers = activatedUsers.map(async (user) => {
            const userSettings = typeof user.settings === 'string' ? user.settings : JSON.stringify(user.settings);
            await queryRunner.query(`UPDATE ${tablePrefix}user SET settings = '${userSettings}' WHERE id = '${user.id}' `);
        });
        await Promise.all(updatedUsers);
        if (!activatedUsers.length) {
            await queryRunner.query(`UPDATE ${tablePrefix}user SET settings = JSON_SET(COALESCE(settings, '{}'), '$.userActivated', false)`);
        }
        else {
            const activatedUserIds = activatedUsers.map((user) => `'${user.id}'`).join(',');
            await queryRunner.query(`UPDATE ${tablePrefix}user SET settings = JSON_SET(COALESCE(settings, '{}'), '$.userActivated', false) WHERE id NOT IN (${activatedUserIds})`);
        }
    }
    async down({ queryRunner, tablePrefix }) {
        await queryRunner.query(`UPDATE ${tablePrefix}user SET settings = JSON_REMOVE(settings, '$.userActivated')`);
        await queryRunner.query(`UPDATE ${tablePrefix}user SET settings = NULL WHERE settings = '{}'`);
    }
}
exports.AddUserActivatedProperty1681134145996 = AddUserActivatedProperty1681134145996;
//# sourceMappingURL=1681134145996-AddUserActivatedProperty.js.map