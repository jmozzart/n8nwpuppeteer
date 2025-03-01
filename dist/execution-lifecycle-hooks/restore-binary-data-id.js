"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreBinaryDataId = restoreBinaryDataId;
const n8n_core_1 = require("n8n-core");
const typedi_1 = __importDefault(require("typedi"));
const config_1 = __importDefault(require("../config"));
const logger_service_1 = require("../logging/logger.service");
async function restoreBinaryDataId(run, executionId, workflowExecutionMode) {
    if (workflowExecutionMode !== 'webhook' ||
        config_1.default.getEnv('binaryDataManager.mode') === 'default') {
        return;
    }
    try {
        const { runData } = run.data.resultData;
        const promises = Object.keys(runData).map(async (nodeName) => {
            const binaryDataId = runData[nodeName]?.[0]?.data?.main?.[0]?.[0]?.binary?.data?.id;
            if (!binaryDataId)
                return;
            const [mode, fileId] = binaryDataId.split(':');
            const isMissingExecutionId = fileId.includes('/temp/');
            if (!isMissingExecutionId)
                return;
            const correctFileId = fileId.replace('temp', executionId);
            await typedi_1.default.get(n8n_core_1.BinaryDataService).rename(fileId, correctFileId);
            const correctBinaryDataId = `${mode}:${correctFileId}`;
            run.data.resultData.runData[nodeName][0].data.main[0][0].binary.data.id = correctBinaryDataId;
        });
        await Promise.all(promises);
    }
    catch (e) {
        const error = e instanceof Error ? e : new Error(`${e}`);
        const logger = typedi_1.default.get(logger_service_1.Logger);
        if (error.message.includes('ENOENT')) {
            logger.warn('Failed to restore binary data ID - No such file or dir', {
                executionId,
                error,
            });
            return;
        }
        logger.error('Failed to restore binary data ID - Unknown error', { executionId, error });
    }
}
//# sourceMappingURL=restore-binary-data-id.js.map