"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrateTestDefinitionKeyToString1731582748663 = void 0;
class MigrateTestDefinitionKeyToString1731582748663 {
    async up(context) {
        const { queryRunner, tablePrefix } = context;
        await queryRunner.query(`ALTER TABLE ${tablePrefix}test_definition CHANGE id tmp_id int NOT NULL AUTO_INCREMENT;`);
        await queryRunner.query(`ALTER TABLE ${tablePrefix}test_definition ADD COLUMN id varchar(36) NOT NULL;`);
        await queryRunner.query(`UPDATE ${tablePrefix}test_definition SET id = CONVERT(tmp_id, CHAR);`);
        await queryRunner.query(`CREATE INDEX \`TMP_idx_${tablePrefix}test_definition_id\` ON ${tablePrefix}test_definition (\`id\`);`);
    }
}
exports.MigrateTestDefinitionKeyToString1731582748663 = MigrateTestDefinitionKeyToString1731582748663;
//# sourceMappingURL=1731582748663-MigrateTestDefinitionKeyToString.js.map