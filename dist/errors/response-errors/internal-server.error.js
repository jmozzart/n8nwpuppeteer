"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerError = void 0;
const response_error_1 = require("./abstract/response.error");
class InternalServerError extends response_error_1.ResponseError {
    constructor(message, errorCode = 500) {
        super(message, 500, errorCode);
    }
}
exports.InternalServerError = InternalServerError;
//# sourceMappingURL=internal-server.error.js.map