"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowStatisticsRepository = void 0;
const config_1 = require("@n8n/config");
const typeorm_1 = require("@n8n/typeorm");
const typedi_1 = require("typedi");
const workflow_statistics_1 = require("../entities/workflow-statistics");
let WorkflowStatisticsRepository = class WorkflowStatisticsRepository extends typeorm_1.Repository {
    constructor(dataSource, globalConfig) {
        super(workflow_statistics_1.WorkflowStatistics, dataSource.manager);
        this.globalConfig = globalConfig;
    }
    async insertWorkflowStatistics(eventName, workflowId) {
        try {
            const exists = await this.findOne({
                where: {
                    workflowId,
                    name: eventName,
                },
            });
            if (exists)
                return 'alreadyExists';
            await this.insert({
                workflowId,
                name: eventName,
                count: 1,
                latestEvent: new Date(),
            });
            return 'insert';
        }
        catch (error) {
            if (!(error instanceof typeorm_1.QueryFailedError)) {
                throw error;
            }
            return 'failed';
        }
    }
    async upsertWorkflowStatistics(eventName, workflowId) {
        const dbType = this.globalConfig.database.type;
        const { tableName } = this.metadata;
        try {
            if (dbType === 'sqlite') {
                await this.query(`INSERT INTO "${tableName}" ("count", "name", "workflowId", "latestEvent")
					VALUES (1, "${eventName}", "${workflowId}", CURRENT_TIMESTAMP)
					ON CONFLICT (workflowId, name)
					DO UPDATE SET count = count + 1, latestEvent = CURRENT_TIMESTAMP`);
                const counter = await this.findOne({
                    select: ['count'],
                    where: {
                        name: eventName,
                        workflowId,
                    },
                });
                return counter?.count === 1 ? 'insert' : 'failed';
            }
            else if (dbType === 'postgresdb') {
                const queryResult = (await this.query(`INSERT INTO "${tableName}" ("count", "name", "workflowId", "latestEvent")
					VALUES (1, '${eventName}', '${workflowId}', CURRENT_TIMESTAMP)
					ON CONFLICT ("name", "workflowId")
					DO UPDATE SET "count" = "${tableName}"."count" + 1, "latestEvent" = CURRENT_TIMESTAMP
					RETURNING *;`));
                return queryResult[0].count === 1 ? 'insert' : 'update';
            }
            else {
                const queryResult = (await this.query(`INSERT INTO \`${tableName}\` (count, name, workflowId, latestEvent)
					VALUES (1, "${eventName}", "${workflowId}", NOW())
					ON DUPLICATE KEY
					UPDATE count = count + 1, latestEvent = NOW();`));
                return queryResult.affectedRows === 1 ? 'insert' : 'update';
            }
        }
        catch (error) {
            if (error instanceof typeorm_1.QueryFailedError)
                return 'failed';
            throw error;
        }
    }
    async queryNumWorkflowsUserHasWithFiveOrMoreProdExecs(userId) {
        return await this.count({
            where: {
                workflow: {
                    shared: {
                        role: 'workflow:owner',
                        project: { projectRelations: { userId, role: 'project:personalOwner' } },
                    },
                    active: true,
                },
                name: "production_success",
                count: (0, typeorm_1.MoreThanOrEqual)(5),
            },
        });
    }
};
exports.WorkflowStatisticsRepository = WorkflowStatisticsRepository;
exports.WorkflowStatisticsRepository = WorkflowStatisticsRepository = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        config_1.GlobalConfig])
], WorkflowStatisticsRepository);
//# sourceMappingURL=workflow-statistics.repository.js.map