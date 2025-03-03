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
exports.WorkflowStaticDataService = void 0;
const config_1 = require("@n8n/config");
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const workflow_repository_1 = require("../databases/repositories/workflow.repository");
const logger_service_1 = require("../logging/logger.service");
const utils_1 = require("../utils");
let WorkflowStaticDataService = class WorkflowStaticDataService {
    constructor(globalConfig, logger, workflowRepository) {
        this.globalConfig = globalConfig;
        this.logger = logger;
        this.workflowRepository = workflowRepository;
    }
    async getStaticDataById(workflowId) {
        const workflowData = await this.workflowRepository.findOne({
            select: ['staticData'],
            where: { id: workflowId },
        });
        return workflowData?.staticData ?? {};
    }
    async saveStaticData(workflow) {
        if (workflow.staticData.__dataChanged === true) {
            if ((0, utils_1.isWorkflowIdValid)(workflow.id)) {
                try {
                    await this.saveStaticDataById(workflow.id, workflow.staticData);
                    workflow.staticData.__dataChanged = false;
                }
                catch (error) {
                    n8n_workflow_1.ErrorReporterProxy.error(error);
                    this.logger.error(`There was a problem saving the workflow with id "${workflow.id}" to save changed Data: "${error.message}"`, { workflowId: workflow.id });
                }
            }
        }
    }
    async saveStaticDataById(workflowId, newStaticData) {
        const qb = this.workflowRepository.createQueryBuilder('workflow');
        await qb
            .update()
            .set({
            staticData: newStaticData,
            updatedAt: () => {
                if (['mysqldb', 'mariadb'].includes(this.globalConfig.database.type)) {
                    return 'updatedAt';
                }
                return '"updatedAt"';
            },
        })
            .where('id = :id', { id: workflowId })
            .execute();
    }
};
exports.WorkflowStaticDataService = WorkflowStaticDataService;
exports.WorkflowStaticDataService = WorkflowStaticDataService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig,
        logger_service_1.Logger,
        workflow_repository_1.WorkflowRepository])
], WorkflowStaticDataService);
//# sourceMappingURL=workflow-static-data.service.js.map