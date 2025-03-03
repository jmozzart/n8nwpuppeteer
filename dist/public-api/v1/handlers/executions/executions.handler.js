"use strict";
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const active_executions_1 = require("../../../../active-executions");
const concurrency_control_service_1 = require("../../../../concurrency/concurrency-control.service");
const execution_repository_1 = require("../../../../databases/repositories/execution.repository");
const event_service_1 = require("../../../../events/event.service");
const global_middleware_1 = require("../../shared/middlewares/global.middleware");
const pagination_service_1 = require("../../shared/services/pagination.service");
const workflows_service_1 = require("../workflows/workflows.service");
module.exports = {
    deleteExecution: [
        async (req, res) => {
            const sharedWorkflowsIds = await (0, workflows_service_1.getSharedWorkflowIds)(req.user, ['workflow:delete']);
            if (!sharedWorkflowsIds.length) {
                return res.status(404).json({ message: 'Not Found' });
            }
            const { id } = req.params;
            const execution = await typedi_1.Container.get(execution_repository_1.ExecutionRepository).getExecutionInWorkflowsForPublicApi(id, sharedWorkflowsIds, false);
            if (!execution) {
                return res.status(404).json({ message: 'Not Found' });
            }
            if (execution.status === 'running') {
                return res.status(400).json({
                    message: 'Cannot delete a running execution',
                });
            }
            if (execution.status === 'new') {
                typedi_1.Container.get(concurrency_control_service_1.ConcurrencyControlService).remove({
                    executionId: execution.id,
                    mode: execution.mode,
                });
            }
            await typedi_1.Container.get(execution_repository_1.ExecutionRepository).hardDelete({
                workflowId: execution.workflowId,
                executionId: execution.id,
            });
            execution.id = id;
            return res.json((0, n8n_workflow_1.replaceCircularReferences)(execution));
        },
    ],
    getExecution: [
        async (req, res) => {
            const sharedWorkflowsIds = await (0, workflows_service_1.getSharedWorkflowIds)(req.user, ['workflow:read']);
            if (!sharedWorkflowsIds.length) {
                return res.status(404).json({ message: 'Not Found' });
            }
            const { id } = req.params;
            const { includeData = false } = req.query;
            const execution = await typedi_1.Container.get(execution_repository_1.ExecutionRepository).getExecutionInWorkflowsForPublicApi(id, sharedWorkflowsIds, includeData);
            if (!execution) {
                return res.status(404).json({ message: 'Not Found' });
            }
            typedi_1.Container.get(event_service_1.EventService).emit('user-retrieved-execution', {
                userId: req.user.id,
                publicApi: true,
            });
            return res.json((0, n8n_workflow_1.replaceCircularReferences)(execution));
        },
    ],
    getExecutions: [
        global_middleware_1.validCursor,
        async (req, res) => {
            const { lastId = undefined, limit = 100, status = undefined, includeData = false, workflowId = undefined, projectId, } = req.query;
            const sharedWorkflowsIds = await (0, workflows_service_1.getSharedWorkflowIds)(req.user, ['workflow:read'], projectId);
            if (!sharedWorkflowsIds.length || (workflowId && !sharedWorkflowsIds.includes(workflowId))) {
                return res.status(200).json({ data: [], nextCursor: null });
            }
            const runningExecutionsIds = typedi_1.Container.get(active_executions_1.ActiveExecutions)
                .getActiveExecutions()
                .map(({ id }) => id);
            const filters = {
                status,
                limit,
                lastId,
                includeData,
                workflowIds: workflowId ? [workflowId] : sharedWorkflowsIds,
                excludedExecutionsIds: runningExecutionsIds,
            };
            const executions = await typedi_1.Container.get(execution_repository_1.ExecutionRepository).getExecutionsForPublicApi(filters);
            const newLastId = !executions.length ? '0' : executions.slice(-1)[0].id;
            filters.lastId = newLastId;
            const count = await typedi_1.Container.get(execution_repository_1.ExecutionRepository).getExecutionsCountForPublicApi(filters);
            typedi_1.Container.get(event_service_1.EventService).emit('user-retrieved-all-executions', {
                userId: req.user.id,
                publicApi: true,
            });
            return res.json({
                data: (0, n8n_workflow_1.replaceCircularReferences)(executions),
                nextCursor: (0, pagination_service_1.encodeNextCursor)({
                    lastId: newLastId,
                    limit,
                    numberOfNextRecords: count,
                }),
            });
        },
    ],
};
//# sourceMappingURL=executions.handler.js.map