"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveExecutionProgress = saveExecutionProgress;
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const execution_repository_1 = require("../databases/repositories/execution.repository");
const to_save_settings_1 = require("../execution-lifecycle-hooks/to-save-settings");
const logger_service_1 = require("../logging/logger.service");
async function saveExecutionProgress(workflowData, executionId, nodeName, data, executionData, pushRef) {
    const saveSettings = (0, to_save_settings_1.toSaveSettings)(workflowData.settings);
    if (!saveSettings.progress)
        return;
    const logger = typedi_1.Container.get(logger_service_1.Logger);
    try {
        logger.debug(`Save execution progress to database for execution ID ${executionId} `, {
            executionId,
            nodeName,
        });
        const fullExecutionData = await typedi_1.Container.get(execution_repository_1.ExecutionRepository).findSingleExecution(executionId, {
            includeData: true,
            unflattenData: true,
        });
        if (!fullExecutionData) {
            return;
        }
        if (fullExecutionData.finished) {
            return;
        }
        if (fullExecutionData.data === undefined) {
            fullExecutionData.data = {
                startData: {},
                resultData: {
                    runData: {},
                },
                executionData: {
                    contextData: {},
                    metadata: {},
                    nodeExecutionStack: [],
                    waitingExecution: {},
                    waitingExecutionSource: {},
                },
            };
        }
        if (Array.isArray(fullExecutionData.data.resultData.runData[nodeName])) {
            fullExecutionData.data.resultData.runData[nodeName].push(data);
        }
        else {
            fullExecutionData.data.resultData.runData[nodeName] = [data];
        }
        fullExecutionData.data.executionData = executionData.executionData;
        fullExecutionData.data.resultData.lastNodeExecuted = nodeName;
        fullExecutionData.status = 'running';
        await typedi_1.Container.get(execution_repository_1.ExecutionRepository).updateExistingExecution(executionId, fullExecutionData);
    }
    catch (e) {
        const error = e instanceof Error ? e : new Error(`${e}`);
        n8n_workflow_1.ErrorReporterProxy.error(error);
        logger.error(`Failed saving execution progress to database for execution ID ${executionId} (hookFunctionsPreExecute, nodeExecuteAfter)`, {
            ...error,
            executionId,
            pushRef,
            workflowId: workflowData.id,
        });
    }
}
//# sourceMappingURL=save-execution-progress.js.map