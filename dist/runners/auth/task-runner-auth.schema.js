"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskRunnerAuthRequestBodySchema = void 0;
const zod_1 = require("zod");
exports.taskRunnerAuthRequestBodySchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
});
//# sourceMappingURL=task-runner-auth.schema.js.map