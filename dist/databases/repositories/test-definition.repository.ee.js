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
exports.TestDefinitionRepository = void 0;
const typeorm_1 = require("@n8n/typeorm");
const typedi_1 = require("typedi");
const test_definition_ee_1 = require("../../databases/entities/test-definition.ee");
let TestDefinitionRepository = class TestDefinitionRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        super(test_definition_ee_1.TestDefinition, dataSource.manager);
    }
    async getMany(accessibleWorkflowIds, options) {
        if (accessibleWorkflowIds.length === 0)
            return { tests: [], count: 0 };
        const where = {
            ...options?.filter,
            workflow: {
                id: (0, typeorm_1.In)(accessibleWorkflowIds),
            },
        };
        const findManyOptions = {
            where,
            relations: ['annotationTag'],
            order: { createdAt: 'DESC' },
        };
        if (options?.take) {
            findManyOptions.skip = options.skip;
            findManyOptions.take = options.take;
        }
        const [testDefinitions, count] = await this.findAndCount(findManyOptions);
        return { testDefinitions, count };
    }
    async getOne(id, accessibleWorkflowIds) {
        return await this.findOne({
            where: {
                id,
                workflow: {
                    id: (0, typeorm_1.In)(accessibleWorkflowIds),
                },
            },
            relations: ['annotationTag'],
        });
    }
    async deleteById(id, accessibleWorkflowIds) {
        return await this.delete({
            id,
            workflow: {
                id: (0, typeorm_1.In)(accessibleWorkflowIds),
            },
        });
    }
};
exports.TestDefinitionRepository = TestDefinitionRepository;
exports.TestDefinitionRepository = TestDefinitionRepository = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], TestDefinitionRepository);
//# sourceMappingURL=test-definition.repository.ee.js.map