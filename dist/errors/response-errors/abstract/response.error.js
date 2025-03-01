"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class ResponseError extends n8n_workflow_1.ApplicationError {
    constructor(message, httpStatusCode, errorCode = httpStatusCode, hint = undefined) {
        super(message);
        this.httpStatusCode = httpStatusCode;
        this.errorCode = errorCode;
        this.hint = hint;
        this.name = 'ResponseError';
    }
}
exports.ResponseError = ResponseError;
//# sourceMappingURL=response.error.js.map