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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSharedWorkflowIds = getSharedWorkflowIds;
exports.getSharedWorkflow = getSharedWorkflow;
exports.getWorkflowById = getWorkflowById;
exports.createWorkflow = createWorkflow;
exports.setWorkflowAsActive = setWorkflowAsActive;
exports.setWorkflowAsInactive = setWorkflowAsInactive;
exports.deleteWorkflow = deleteWorkflow;
exports.updateWorkflow = updateWorkflow;
exports.parseTagNames = parseTagNames;
exports.getWorkflowTags = getWorkflowTags;
exports.updateTags = updateTags;
const typedi_1 = require("typedi");
const config_1 = __importDefault(require("../../../../config"));
const shared_workflow_1 = require("../../../../databases/entities/shared-workflow");
const workflow_entity_1 = require("../../../../databases/entities/workflow-entity");
const workflow_tag_mapping_1 = require("../../../../databases/entities/workflow-tag-mapping");
const shared_workflow_repository_1 = require("../../../../databases/repositories/shared-workflow.repository");
const tag_repository_1 = require("../../../../databases/repositories/tag.repository");
const workflow_repository_1 = require("../../../../databases/repositories/workflow.repository");
const Db = __importStar(require("../../../../db"));
const license_1 = require("../../../../license");
const workflow_sharing_service_1 = require("../../../../workflows/workflow-sharing.service");
function insertIf(condition, elements) {
    return condition ? elements : [];
}
async function getSharedWorkflowIds(user, scopes, projectId) {
    if (typedi_1.Container.get(license_1.License).isSharingEnabled()) {
        return await typedi_1.Container.get(workflow_sharing_service_1.WorkflowSharingService).getSharedWorkflowIds(user, {
            scopes,
            projectId,
        });
    }
    else {
        return await typedi_1.Container.get(workflow_sharing_service_1.WorkflowSharingService).getSharedWorkflowIds(user, {
            workflowRoles: ['workflow:owner'],
            projectRoles: ['project:personalOwner'],
            projectId,
        });
    }
}
async function getSharedWorkflow(user, workflowId) {
    return await typedi_1.Container.get(shared_workflow_repository_1.SharedWorkflowRepository).findOne({
        where: {
            ...(!['global:owner', 'global:admin'].includes(user.role) && { userId: user.id }),
            ...(workflowId && { workflowId }),
        },
        relations: [...insertIf(!config_1.default.getEnv('workflowTagsDisabled'), ['workflow.tags']), 'workflow'],
    });
}
async function getWorkflowById(id) {
    return await typedi_1.Container.get(workflow_repository_1.WorkflowRepository).findOne({
        where: { id },
    });
}
async function createWorkflow(workflow, user, personalProject, role) {
    return await Db.transaction(async (transactionManager) => {
        const newWorkflow = new workflow_entity_1.WorkflowEntity();
        Object.assign(newWorkflow, workflow);
        const savedWorkflow = await transactionManager.save(newWorkflow);
        const newSharedWorkflow = new shared_workflow_1.SharedWorkflow();
        Object.assign(newSharedWorkflow, {
            role,
            user,
            project: personalProject,
            workflow: savedWorkflow,
        });
        await transactionManager.save(newSharedWorkflow);
        return savedWorkflow;
    });
}
async function setWorkflowAsActive(workflow) {
    await typedi_1.Container.get(workflow_repository_1.WorkflowRepository).update(workflow.id, {
        active: true,
        updatedAt: new Date(),
    });
}
async function setWorkflowAsInactive(workflow) {
    return await typedi_1.Container.get(workflow_repository_1.WorkflowRepository).update(workflow.id, {
        active: false,
        updatedAt: new Date(),
    });
}
async function deleteWorkflow(workflow) {
    return await typedi_1.Container.get(workflow_repository_1.WorkflowRepository).remove(workflow);
}
async function updateWorkflow(workflowId, updateData) {
    return await typedi_1.Container.get(workflow_repository_1.WorkflowRepository).update(workflowId, updateData);
}
function parseTagNames(tags) {
    return tags.split(',').map((tag) => tag.trim());
}
async function getWorkflowTags(workflowId) {
    return await typedi_1.Container.get(tag_repository_1.TagRepository).find({
        select: ['id', 'name', 'createdAt', 'updatedAt'],
        where: {
            workflowMappings: {
                ...(workflowId && { workflowId }),
            },
        },
    });
}
async function updateTags(workflowId, newTags) {
    await Db.transaction(async (transactionManager) => {
        const oldTags = await transactionManager.findBy(workflow_tag_mapping_1.WorkflowTagMapping, { workflowId });
        if (oldTags.length > 0) {
            await transactionManager.delete(workflow_tag_mapping_1.WorkflowTagMapping, oldTags);
        }
        await transactionManager.insert(workflow_tag_mapping_1.WorkflowTagMapping, newTags.map((tagId) => ({ tagId, workflowId })));
    });
}
//# sourceMappingURL=workflows.service.js.map