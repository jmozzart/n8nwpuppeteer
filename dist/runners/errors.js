"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskError = exports.TaskDeferredError = exports.TaskRejectError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class TaskRejectError extends n8n_workflow_1.ApplicationError {
    constructor(reason) {
        super(`Task rejected with reason: ${reason}`, { level: 'info' });
        this.reason = reason;
    }
}
exports.TaskRejectError = TaskRejectError;
class TaskDeferredError extends n8n_workflow_1.ApplicationError {
    constructor() {
        super('Task deferred until runner is ready', { level: 'info' });
    }
}
exports.TaskDeferredError = TaskDeferredError;
class TaskError extends n8n_workflow_1.ApplicationError {
}
exports.TaskError = TaskError;
//# sourceMappingURL=errors.js.map