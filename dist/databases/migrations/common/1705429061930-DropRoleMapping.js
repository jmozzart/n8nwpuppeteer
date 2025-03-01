"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DropRoleMapping1705429061930 = void 0;
const idColumns = {
    user: 'id',
    shared_credentials: 'credentialsId',
    shared_workflow: 'workflowId',
};
const uidColumns = {
    user: 'id',
    shared_credentials: 'userId',
    shared_workflow: 'userId',
};
const roleScopes = {
    user: 'global',
    shared_credentials: 'credential',
    shared_workflow: 'workflow',
};
const foreignKeySuffixes = {
    user: 'f0609be844f9200ff4365b1bb3d',
    shared_credentials: 'c68e056637562000b68f480815a',
    shared_workflow: '3540da03964527aa24ae014b780',
};
class DropRoleMapping1705429061930 {
    async up(context) {
        await this.migrateUp('user', context);
        await this.migrateUp('shared_workflow', context);
        await this.migrateUp('shared_credentials', context);
    }
    async down(context) {
        await this.migrateDown('shared_workflow', context);
        await this.migrateDown('shared_credentials', context);
        await this.migrateDown('user', context);
    }
    async migrateUp(table, { dbType, escape, runQuery, schemaBuilder: { addNotNull, addColumns, dropColumns, dropForeignKey, column }, tablePrefix, }) {
        await addColumns(table, [column('role').text]);
        const roleTable = escape.tableName('role');
        const tableName = escape.tableName(table);
        const idColumn = escape.columnName(idColumns[table]);
        const uidColumn = escape.columnName(uidColumns[table]);
        const roleColumnName = table === 'user' ? 'globalRoleId' : 'roleId';
        const roleColumn = escape.columnName(roleColumnName);
        const scope = roleScopes[table];
        const isMySQL = ['mariadb', 'mysqldb'].includes(dbType);
        const roleField = isMySQL ? `CONCAT('${scope}:', R.name)` : `'${scope}:' || R.name`;
        const subQuery = `
        SELECT ${roleField} as role, T.${idColumn} as id${table !== 'user' ? `, T.${uidColumn} as uid` : ''}
        FROM ${tableName} T
        LEFT JOIN ${roleTable} R
        ON T.${roleColumn} = R.id and R.scope = '${scope}'`;
        const where = `WHERE ${tableName}.${idColumn} = mapping.id${table !== 'user' ? ` AND ${tableName}.${uidColumn} = mapping.uid` : ''}`;
        const swQuery = isMySQL
            ? `UPDATE ${tableName}, (${subQuery}) as mapping
            SET ${tableName}.role = mapping.role
            ${where}`
            : `UPDATE ${tableName}
            SET role = mapping.role
            FROM (${subQuery}) as mapping
            ${where}`;
        await runQuery(swQuery);
        await addNotNull(table, 'role');
        await dropForeignKey(table, roleColumnName, ['role', 'id'], `FK_${tablePrefix}${foreignKeySuffixes[table]}`);
        await dropColumns(table, [roleColumnName]);
    }
    async migrateDown(table, { dbType, escape, runQuery, schemaBuilder: { addNotNull, addColumns, dropColumns, addForeignKey, column }, tablePrefix, }) {
        const roleColumnName = table === 'user' ? 'globalRoleId' : 'roleId';
        await addColumns(table, [column(roleColumnName).int]);
        const roleTable = escape.tableName('role');
        const tableName = escape.tableName(table);
        const idColumn = escape.columnName(idColumns[table]);
        const uidColumn = escape.columnName(uidColumns[table]);
        const roleColumn = escape.columnName(roleColumnName);
        const scope = roleScopes[table];
        const isMySQL = ['mariadb', 'mysqldb'].includes(dbType);
        const roleField = isMySQL ? `CONCAT('${scope}:', R.name)` : `'${scope}:' || R.name`;
        const subQuery = `
			SELECT R.id as role_id, T.${idColumn} as id${table !== 'user' ? `, T.${uidColumn} as uid` : ''}
			FROM ${tableName} T
			LEFT JOIN ${roleTable} R
			ON T.role = ${roleField} and R.scope = '${scope}'`;
        const where = `WHERE ${tableName}.${idColumn} = mapping.id${table !== 'user' ? ` AND ${tableName}.${uidColumn} = mapping.uid` : ''}`;
        const query = isMySQL
            ? `UPDATE ${tableName}, (${subQuery}) as mapping
				SET ${tableName}.${roleColumn} = mapping.role_id
				${where}`
            : `UPDATE ${tableName}
				SET ${roleColumn} = mapping.role_id
				FROM (${subQuery}) as mapping
				${where}`;
        await runQuery(query);
        await addNotNull(table, roleColumnName);
        await addForeignKey(table, roleColumnName, ['role', 'id'], `FK_${tablePrefix}${foreignKeySuffixes[table]}`);
        await dropColumns(table, ['role']);
    }
}
exports.DropRoleMapping1705429061930 = DropRoleMapping1705429061930;
//# sourceMappingURL=1705429061930-DropRoleMapping.js.map