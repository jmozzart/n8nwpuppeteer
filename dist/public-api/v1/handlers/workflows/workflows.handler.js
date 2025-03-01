"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const typeorm_1 = require("@n8n/typeorm");
const typedi_1 = require("typedi");
const uuid_1 = require("uuid");
const zod_1 = require("zod");
const active_workflow_manager_1 = require("../../../../active-workflow-manager");
const config_1 = __importDefault(require("../../../../config"));
const workflow_entity_1 = require("../../../../databases/entities/workflow-entity");
const project_repository_1 = require("../../../../databases/repositories/project.repository");
const shared_workflow_repository_1 = require("../../../../databases/repositories/shared-workflow.repository");
const tag_repository_1 = require("../../../../databases/repositories/tag.repository");
const workflow_repository_1 = require("../../../../databases/repositories/workflow.repository");
const event_service_1 = require("../../../../events/event.service");
const external_hooks_1 = require("../../../../external-hooks");
const workflow_helpers_1 = require("../../../../workflow-helpers");
const workflow_history_service_ee_1 = require("../../../../workflows/workflow-history/workflow-history.service.ee");
const workflow_service_1 = require("../../../../workflows/workflow.service");
const workflow_service_ee_1 = require("../../../../workflows/workflow.service.ee");
const workflows_service_1 = require("./workflows.service");
const global_middleware_1 = require("../../shared/middlewares/global.middleware");
const pagination_service_1 = require("../../shared/services/pagination.service");
module.exports = {
    createWorkflow: [
        async (req, res) => {
            const workflow = req.body;
            workflow.active = false;
            workflow.versionId = (0, uuid_1.v4)();
            await (0, workflow_helpers_1.replaceInvalidCredentials)(workflow);
            (0, workflow_helpers_1.addNodeIds)(workflow);
            const project = await typedi_1.Container.get(project_repository_1.ProjectRepository).getPersonalProjectForUserOrFail(req.user.id);
            const createdWorkflow = await (0, workflows_service_1.createWorkflow)(workflow, req.user, project, 'workflow:owner');
            await typedi_1.Container.get(workflow_history_service_ee_1.WorkflowHistoryService).saveVersion(req.user, createdWorkflow, createdWorkflow.id);
            await typedi_1.Container.get(external_hooks_1.ExternalHooks).run('workflow.afterCreate', [createdWorkflow]);
            typedi_1.Container.get(event_service_1.EventService).emit('workflow-created', {
                workflow: createdWorkflow,
                user: req.user,
                publicApi: true,
                projectId: project.id,
                projectType: project.type,
            });
            return res.json(createdWorkflow);
        },
    ],
    transferWorkflow: [
        (0, global_middleware_1.projectScope)('workflow:move', 'workflow'),
        async (req, res) => {
            const { id: workflowId } = req.params;
            const body = zod_1.z.object({ destinationProjectId: zod_1.z.string() }).parse(req.body);
            await typedi_1.Container.get(workflow_service_ee_1.EnterpriseWorkflowService).transferOne(req.user, workflowId, body.destinationProjectId);
            res.status(204).send();
        },
    ],
    deleteWorkflow: [
        (0, global_middleware_1.projectScope)('workflow:delete', 'workflow'),
        async (req, res) => {
            const { id: workflowId } = req.params;
            const workflow = await typedi_1.Container.get(workflow_service_1.WorkflowService).delete(req.user, workflowId);
            if (!workflow) {
                return res.status(404).json({ message: 'Not Found' });
            }
            return res.json(workflow);
        },
    ],
    getWorkflow: [
        (0, global_middleware_1.projectScope)('workflow:read', 'workflow'),
        async (req, res) => {
            const { id } = req.params;
            const workflow = await typedi_1.Container.get(shared_workflow_repository_1.SharedWorkflowRepository).findWorkflowForUser(id, req.user, ['workflow:read'], { includeTags: !config_1.default.getEnv('workflowTagsDisabled') });
            if (!workflow) {
                return res.status(404).json({ message: 'Not Found' });
            }
            typedi_1.Container.get(event_service_1.EventService).emit('user-retrieved-workflow', {
                userId: req.user.id,
                publicApi: true,
            });
            return res.json(workflow);
        },
    ],
    getWorkflows: [
        global_middleware_1.validCursor,
        async (req, res) => {
            const { offset = 0, limit = 100, active, tags, name, projectId } = req.query;
            const where = {
                ...(active !== undefined && { active }),
                ...(name !== undefined && { name: (0, typeorm_1.Like)('%' + name.trim() + '%') }),
            };
            if (['global:owner', 'global:admin'].includes(req.user.role)) {
                if (tags) {
                    const workflowIds = await typedi_1.Container.get(tag_repository_1.TagRepository).getWorkflowIdsViaTags((0, workflows_service_1.parseTagNames)(tags));
                    where.id = (0, typeorm_1.In)(workflowIds);
                }
                if (projectId) {
                    const workflows = await typedi_1.Container.get(shared_workflow_repository_1.SharedWorkflowRepository).findAllWorkflowsForUser(req.user, ['workflow:read']);
                    const workflowIds = workflows
                        .filter((workflow) => workflow.projectId === projectId)
                        .map((workflow) => workflow.id);
                    where.id = (0, typeorm_1.In)(workflowIds);
                }
            }
            else {
                const options = {};
                if (tags) {
                    options.workflowIds = await typedi_1.Container.get(tag_repository_1.TagRepository).getWorkflowIdsViaTags((0, workflows_service_1.parseTagNames)(tags));
                }
                let workflows = await typedi_1.Container.get(shared_workflow_repository_1.SharedWorkflowRepository).findAllWorkflowsForUser(req.user, ['workflow:read']);
                if (options.workflowIds) {
                    const workflowIds = options.workflowIds;
                    workflows = workflows.filter((wf) => workflowIds.includes(wf.id));
                }
                if (projectId) {
                    workflows = workflows.filter((w) => w.projectId === projectId);
                }
                if (!workflows.length) {
                    return res.status(200).json({
                        data: [],
                        nextCursor: null,
                    });
                }
                const workflowsIds = workflows.map((wf) => wf.id);
                where.id = (0, typeorm_1.In)(workflowsIds);
            }
            const [workflows, count] = await typedi_1.Container.get(workflow_repository_1.WorkflowRepository).findAndCount({
                skip: offset,
                take: limit,
                where,
                ...(!config_1.default.getEnv('workflowTagsDisabled') && { relations: ['tags'] }),
            });
            typedi_1.Container.get(event_service_1.EventService).emit('user-retrieved-all-workflows', {
                userId: req.user.id,
                publicApi: true,
            });
            return res.json({
                data: workflows,
                nextCursor: (0, pagination_service_1.encodeNextCursor)({
                    offset,
                    limit,
                    numberOfTotalRecords: count,
                }),
            });
        },
    ],
    updateWorkflow: [
        (0, global_middleware_1.projectScope)('workflow:update', 'workflow'),
        async (req, res) => {
            const { id } = req.params;
            const updateData = new workflow_entity_1.WorkflowEntity();
            Object.assign(updateData, req.body);
            updateData.id = id;
            updateData.versionId = (0, uuid_1.v4)();
            const workflow = await typedi_1.Container.get(shared_workflow_repository_1.SharedWorkflowRepository).findWorkflowForUser(id, req.user, ['workflow:update']);
            if (!workflow) {
                return res.status(404).json({ message: 'Not Found' });
            }
            await (0, workflow_helpers_1.replaceInvalidCredentials)(updateData);
            (0, workflow_helpers_1.addNodeIds)(updateData);
            const workflowManager = typedi_1.Container.get(active_workflow_manager_1.ActiveWorkflowManager);
            if (workflow.active) {
                await workflowManager.remove(id);
            }
            try {
                await (0, workflows_service_1.updateWorkflow)(workflow.id, updateData);
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(400).json({ message: error.message });
                }
            }
            if (workflow.active) {
                try {
                    await workflowManager.add(workflow.id, 'update');
                }
                catch (error) {
                    if (error instanceof Error) {
                        return res.status(400).json({ message: error.message });
                    }
                }
            }
            const updatedWorkflow = await (0, workflows_service_1.getWorkflowById)(workflow.id);
            if (updatedWorkflow) {
                await typedi_1.Container.get(workflow_history_service_ee_1.WorkflowHistoryService).saveVersion(req.user, updatedWorkflow, workflow.id);
            }
            await typedi_1.Container.get(external_hooks_1.ExternalHooks).run('workflow.afterUpdate', [updateData]);
            typedi_1.Container.get(event_service_1.EventService).emit('workflow-saved', {
                user: req.user,
                workflow: updateData,
                publicApi: true,
            });
            return res.json(updatedWorkflow);
        },
    ],
    activateWorkflow: [
        (0, global_middleware_1.projectScope)('workflow:update', 'workflow'),
        async (req, res) => {
            const { id } = req.params;
            const workflow = await typedi_1.Container.get(shared_workflow_repository_1.SharedWorkflowRepository).findWorkflowForUser(id, req.user, ['workflow:update']);
            if (!workflow) {
                return res.status(404).json({ message: 'Not Found' });
            }
            if (!workflow.active) {
                try {
                    await typedi_1.Container.get(active_workflow_manager_1.ActiveWorkflowManager).add(workflow.id, 'activate');
                }
                catch (error) {
                    if (error instanceof Error) {
                        return res.status(400).json({ message: error.message });
                    }
                }
                await (0, workflows_service_1.setWorkflowAsActive)(workflow);
                workflow.active = true;
                return res.json(workflow);
            }
            return res.json(workflow);
        },
    ],
    deactivateWorkflow: [
        (0, global_middleware_1.projectScope)('workflow:update', 'workflow'),
        async (req, res) => {
            const { id } = req.params;
            const workflow = await typedi_1.Container.get(shared_workflow_repository_1.SharedWorkflowRepository).findWorkflowForUser(id, req.user, ['workflow:update']);
            if (!workflow) {
                return res.status(404).json({ message: 'Not Found' });
            }
            const activeWorkflowManager = typedi_1.Container.get(active_workflow_manager_1.ActiveWorkflowManager);
            if (workflow.active) {
                await activeWorkflowManager.remove(workflow.id);
                await (0, workflows_service_1.setWorkflowAsInactive)(workflow);
                workflow.active = false;
                return res.json(workflow);
            }
            return res.json(workflow);
        },
    ],
    getWorkflowTags: [
        (0, global_middleware_1.projectScope)('workflow:read', 'workflow'),
        async (req, res) => {
            const { id } = req.params;
            if (config_1.default.getEnv('workflowTagsDisabled')) {
                return res.status(400).json({ message: 'Workflow Tags Disabled' });
            }
            const workflow = await typedi_1.Container.get(shared_workflow_repository_1.SharedWorkflowRepository).findWorkflowForUser(id, req.user, ['workflow:read']);
            if (!workflow) {
                return res.status(404).json({ message: 'Not Found' });
            }
            const tags = await (0, workflows_service_1.getWorkflowTags)(id);
            return res.json(tags);
        },
    ],
    updateWorkflowTags: [
        (0, global_middleware_1.projectScope)('workflow:update', 'workflow'),
        async (req, res) => {
            const { id } = req.params;
            const newTags = req.body.map((newTag) => newTag.id);
            if (config_1.default.getEnv('workflowTagsDisabled')) {
                return res.status(400).json({ message: 'Workflow Tags Disabled' });
            }
            const sharedWorkflow = await typedi_1.Container.get(shared_workflow_repository_1.SharedWorkflowRepository).findWorkflowForUser(id, req.user, ['workflow:update']);
            if (!sharedWorkflow) {
                return res.status(404).json({ message: 'Not Found' });
            }
            let tags;
            try {
                await (0, workflows_service_1.updateTags)(id, newTags);
                tags = await (0, workflows_service_1.getWorkflowTags)(id);
            }
            catch (error) {
                if (error instanceof typeorm_1.QueryFailedError) {
                    return res.status(404).json({ message: 'Some tags not found' });
                }
                else {
                    throw error;
                }
            }
            return res.json(tags);
        },
    ],
};
//# sourceMappingURL=workflows.handler.js.map