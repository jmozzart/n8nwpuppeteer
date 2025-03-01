"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnrecognizedNodeTypeError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class UnrecognizedNodeTypeError extends n8n_workflow_1.ApplicationError {
    constructor(nodeType) {
        super(`Unrecognized node type: ${nodeType}".`);
        this.severity = 'warning';
    }
}
exports.UnrecognizedNodeTypeError = UnrecognizedNodeTypeError;
//# sourceMappingURL=unrecognized-node-type.error.js.map