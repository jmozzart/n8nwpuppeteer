"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const typedi_1 = require("typedi");
const uuid_1 = require("uuid");
const project_1 = require("../databases/entities/project");
const shared_workflow_1 = require("../databases/entities/shared-workflow");
const workflow_entity_1 = require("../databases/entities/workflow-entity");
const workflow_tag_mapping_1 = require("../databases/entities/workflow-tag-mapping");
const credentials_repository_1 = require("../databases/repositories/credentials.repository");
const tag_repository_1 = require("../databases/repositories/tag.repository");
const Db = __importStar(require("../db"));
const logger_service_1 = require("../logging/logger.service");
const workflow_helpers_1 = require("../workflow-helpers");
let ImportService = class ImportService {
    constructor(logger, credentialsRepository, tagRepository) {
        this.logger = logger;
        this.credentialsRepository = credentialsRepository;
        this.tagRepository = tagRepository;
        this.dbCredentials = [];
        this.dbTags = [];
    }
    async initRecords() {
        this.dbCredentials = await this.credentialsRepository.find();
        this.dbTags = await this.tagRepository.find();
    }
    async importWorkflows(workflows, projectId) {
        await this.initRecords();
        for (const workflow of workflows) {
            workflow.nodes.forEach((node) => {
                this.toNewCredentialFormat(node);
                if (!node.id)
                    node.id = (0, uuid_1.v4)();
            });
            const hasInvalidCreds = workflow.nodes.some((node) => !node.credentials?.id);
            if (hasInvalidCreds)
                await this.replaceInvalidCreds(workflow);
        }
        await Db.transaction(async (tx) => {
            for (const workflow of workflows) {
                if (workflow.active) {
                    workflow.active = false;
                    this.logger.info(`Deactivating workflow "${workflow.name}". Remember to activate later.`);
                }
                const exists = workflow.id ? await tx.existsBy(workflow_entity_1.WorkflowEntity, { id: workflow.id }) : false;
                const upsertResult = await tx.upsert(workflow_entity_1.WorkflowEntity, workflow, ['id']);
                const workflowId = upsertResult.identifiers.at(0)?.id;
                const personalProject = await tx.findOneByOrFail(project_1.Project, { id: projectId });
                if (!exists) {
                    await tx.upsert(shared_workflow_1.SharedWorkflow, { workflowId, projectId: personalProject.id, role: 'workflow:owner' }, ['workflowId', 'projectId']);
                }
                if (!workflow.tags?.length)
                    continue;
                await this.tagRepository.setTags(tx, this.dbTags, workflow);
                for (const tag of workflow.tags) {
                    await tx.upsert(workflow_tag_mapping_1.WorkflowTagMapping, { tagId: tag.id, workflowId }, [
                        'tagId',
                        'workflowId',
                    ]);
                }
            }
        });
    }
    async replaceInvalidCreds(workflow) {
        try {
            await (0, workflow_helpers_1.replaceInvalidCredentials)(workflow);
        }
        catch (e) {
            this.logger.error('Failed to replace invalid credential', { error: e });
        }
    }
    toNewCredentialFormat(node) {
        if (!node.credentials)
            return;
        for (const [type, name] of Object.entries(node.credentials)) {
            if (typeof name !== 'string')
                continue;
            const nodeCredential = { id: null, name };
            const match = this.dbCredentials.find((c) => c.name === name && c.type === type);
            if (match)
                nodeCredential.id = match.id;
            node.credentials[type] = nodeCredential;
        }
    }
};
exports.ImportService = ImportService;
exports.ImportService = ImportService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [logger_service_1.Logger,
        credentials_repository_1.CredentialsRepository,
        tag_repository_1.TagRepository])
], ImportService);
//# sourceMappingURL=import.service.js.map