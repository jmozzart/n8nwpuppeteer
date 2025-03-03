"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureStringArray = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const not_string_array_error_1 = require("../errors/not-string-array.error");
const ensureStringArray = (values, { env }) => {
    if (!env)
        throw new n8n_workflow_1.ApplicationError('Missing env', { extra: { env } });
    if (!Array.isArray(values))
        throw new not_string_array_error_1.NotStringArrayError(env);
    for (const value of values) {
        if (typeof value !== 'string')
            throw new not_string_array_error_1.NotStringArrayError(env);
    }
};
exports.ensureStringArray = ensureStringArray;
//# sourceMappingURL=utils.js.map