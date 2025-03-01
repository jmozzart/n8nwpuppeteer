"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDefinitionPatchRequestBodySchema = exports.testDefinitionCreateRequestBodySchema = void 0;
const zod_1 = require("zod");
exports.testDefinitionCreateRequestBodySchema = zod_1.z
    .object({
    name: zod_1.z.string().min(1).max(255),
    workflowId: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    evaluationWorkflowId: zod_1.z.string().min(1).optional(),
    annotationTagId: zod_1.z.string().min(1).optional(),
})
    .strict();
exports.testDefinitionPatchRequestBodySchema = zod_1.z
    .object({
    name: zod_1.z.string().min(1).max(255).optional(),
    description: zod_1.z.string().optional(),
    evaluationWorkflowId: zod_1.z.string().min(1).optional(),
    annotationTagId: zod_1.z.string().min(1).optional(),
})
    .strict();
//# sourceMappingURL=test-definition.schema.js.map