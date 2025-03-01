"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRunnerDisconnectedError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class TaskRunnerDisconnectedError extends n8n_workflow_1.ApplicationError {
    constructor(runnerId) {
        super(`Task runner (${runnerId}) disconnected`);
    }
}
exports.TaskRunnerDisconnectedError = TaskRunnerDisconnectedError;
//# sourceMappingURL=task-runner-disconnected-error.js.map