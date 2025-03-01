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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowRepository = void 0;
const config_1 = require("@n8n/config");
const typeorm_1 = require("@n8n/typeorm");
const typedi_1 = require("typedi");
const config_2 = __importDefault(require("../../config"));
const utils_1 = require("../../utils");
const webhook_entity_1 = require("../entities/webhook-entity");
const workflow_entity_1 = require("../entities/workflow-entity");
let WorkflowRepository = class WorkflowRepository extends typeorm_1.Repository {
    constructor(dataSource, globalConfig) {
        super(workflow_entity_1.WorkflowEntity, dataSource.manager);
        this.globalConfig = globalConfig;
    }
    async get(where, options) {
        return await this.findOne({
            where,
            relations: options?.relations,
        });
    }
    async getAllActive() {
        return await this.find({
            where: { active: true },
            relations: { shared: { project: { projectRelations: true } } },
        });
    }
    async getActiveIds() {
        const activeWorkflows = await this.find({
            select: ['id'],
            where: { active: true },
        });
        return activeWorkflows.map((workflow) => workflow.id);
    }
    async findById(workflowId) {
        return await this.findOne({
            where: { id: workflowId },
            relations: { shared: { project: { projectRelations: true } } },
        });
    }
    async findByIds(workflowIds, { fields } = {}) {
        const options = {
            where: { id: (0, typeorm_1.In)(workflowIds) },
        };
        if (fields?.length)
            options.select = fields;
        return await this.find(options);
    }
    async getActiveTriggerCount() {
        const totalTriggerCount = await this.sum('triggerCount', {
            active: true,
        });
        return totalTriggerCount ?? 0;
    }
    async updateWorkflowTriggerCount(id, triggerCount) {
        const qb = this.createQueryBuilder('workflow');
        const dbType = this.globalConfig.database.type;
        return await qb
            .update()
            .set({
            triggerCount,
            updatedAt: () => {
                if (['mysqldb', 'mariadb'].includes(dbType)) {
                    return 'updatedAt';
                }
                return '"updatedAt"';
            },
        })
            .where('id = :id', { id })
            .execute();
    }
    async getMany(sharedWorkflowIds, options) {
        if (sharedWorkflowIds.length === 0)
            return { workflows: [], count: 0 };
        if (typeof options?.filter?.projectId === 'string' && options.filter.projectId !== '') {
            options.filter.shared = { projectId: options.filter.projectId };
            delete options.filter.projectId;
        }
        const where = {
            ...options?.filter,
            id: (0, typeorm_1.In)(sharedWorkflowIds),
        };
        const reqTags = options?.filter?.tags;
        if ((0, utils_1.isStringArray)(reqTags)) {
            where.tags = reqTags.map((tag) => ({ name: tag }));
        }
        const select = options?.select
            ? { ...options.select }
            : {
                name: true,
                active: true,
                createdAt: true,
                updatedAt: true,
                versionId: true,
                shared: { role: true },
            };
        delete select?.ownedBy;
        const relations = [];
        const areTagsEnabled = !config_2.default.getEnv('workflowTagsDisabled');
        const isDefaultSelect = options?.select === undefined;
        const areTagsRequested = isDefaultSelect || options?.select?.tags === true;
        const isOwnedByIncluded = isDefaultSelect || options?.select?.ownedBy === true;
        if (areTagsEnabled && areTagsRequested) {
            relations.push('tags');
            select.tags = { id: true, name: true };
        }
        if (isOwnedByIncluded)
            relations.push('shared', 'shared.project');
        if (typeof where.name === 'string' && where.name !== '') {
            where.name = (0, typeorm_1.Like)(`%${where.name}%`);
        }
        const findManyOptions = {
            select: { ...select, id: true },
            where,
        };
        if (isDefaultSelect || options?.select?.updatedAt === true) {
            findManyOptions.order = { updatedAt: 'ASC' };
        }
        if (relations.length > 0) {
            findManyOptions.relations = relations;
        }
        if (options?.take) {
            findManyOptions.skip = options.skip;
            findManyOptions.take = options.take;
        }
        const [workflows, count] = (await this.findAndCount(findManyOptions));
        return { workflows, count };
    }
    async findStartingWith(workflowName) {
        return await this.find({
            select: ['name'],
            where: { name: (0, typeorm_1.Like)(`${workflowName}%`) },
        });
    }
    async findIn(workflowIds) {
        return await this.find({
            select: ['id', 'name'],
            where: { id: (0, typeorm_1.In)(workflowIds) },
        });
    }
    async findWebhookBasedActiveWorkflows() {
        return await this.createQueryBuilder('workflow')
            .select('DISTINCT workflow.id, workflow.name')
            .innerJoin(webhook_entity_1.WebhookEntity, 'webhook_entity', 'workflow.id = webhook_entity.workflowId')
            .execute();
    }
    async updateActiveState(workflowId, newState) {
        return await this.update({ id: workflowId }, { active: newState });
    }
    async deactivateAll() {
        return await this.update({ active: true }, { active: false });
    }
    async activateAll() {
        return await this.update({ active: false }, { active: true });
    }
    async findByActiveState(activeState) {
        return await this.findBy({ active: activeState });
    }
};
exports.WorkflowRepository = WorkflowRepository;
exports.WorkflowRepository = WorkflowRepository = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        config_1.GlobalConfig])
], WorkflowRepository);
//# sourceMappingURL=workflow.repository.js.map