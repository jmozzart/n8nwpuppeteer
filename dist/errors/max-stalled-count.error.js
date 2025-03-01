"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaxStalledCountError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class MaxStalledCountError extends n8n_workflow_1.ApplicationError {
    constructor(cause) {
        super('The execution has reached the maximum number of attempts and will no longer retry.', {
            level: 'warning',
            cause,
        });
    }
}
exports.MaxStalledCountError = MaxStalledCountError;
//# sourceMappingURL=max-stalled-count.error.js.map