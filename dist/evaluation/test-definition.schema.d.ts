import { z } from 'zod';
export declare const testDefinitionCreateRequestBodySchema: z.ZodObject<{
    name: z.ZodString;
    workflowId: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    evaluationWorkflowId: z.ZodOptional<z.ZodString>;
    annotationTagId: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    name: string;
    workflowId: string;
    description?: string | undefined;
    evaluationWorkflowId?: string | undefined;
    annotationTagId?: string | undefined;
}, {
    name: string;
    workflowId: string;
    description?: string | undefined;
    evaluationWorkflowId?: string | undefined;
    annotationTagId?: string | undefined;
}>;
export declare const testDefinitionPatchRequestBodySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    evaluationWorkflowId: z.ZodOptional<z.ZodString>;
    annotationTagId: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    evaluationWorkflowId?: string | undefined;
    annotationTagId?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    evaluationWorkflowId?: string | undefined;
    annotationTagId?: string | undefined;
}>;
