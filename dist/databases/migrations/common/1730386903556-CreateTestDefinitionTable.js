"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTestDefinitionTable1730386903556 = void 0;
const testEntityTableName = 'test_definition';
class CreateTestDefinitionTable1730386903556 {
    async up({ schemaBuilder: { createTable, column } }) {
        await createTable(testEntityTableName)
            .withColumns(column('id').int.notNull.primary.autoGenerate, column('name').varchar(255).notNull, column('workflowId').varchar(36).notNull, column('evaluationWorkflowId').varchar(36), column('annotationTagId').varchar(16))
            .withIndexOn('workflowId')
            .withIndexOn('evaluationWorkflowId')
            .withForeignKey('workflowId', {
            tableName: 'workflow_entity',
            columnName: 'id',
            onDelete: 'CASCADE',
        })
            .withForeignKey('evaluationWorkflowId', {
            tableName: 'workflow_entity',
            columnName: 'id',
            onDelete: 'SET NULL',
        })
            .withForeignKey('annotationTagId', {
            tableName: 'annotation_tag_entity',
            columnName: 'id',
            onDelete: 'SET NULL',
        }).withTimestamps;
    }
    async down({ schemaBuilder: { dropTable } }) {
        await dropTable(testEntityTableName);
    }
}
exports.CreateTestDefinitionTable1730386903556 = CreateTestDefinitionTable1730386903556;
//# sourceMappingURL=1730386903556-CreateTestDefinitionTable.js.map