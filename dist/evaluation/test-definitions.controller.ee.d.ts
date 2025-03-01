import express from 'express';
import { TestDefinitionService } from './test-definition.service.ee';
import { TestDefinitionsRequest } from './test-definitions.types.ee';
export declare class TestDefinitionsController {
    private readonly testDefinitionService;
    constructor(testDefinitionService: TestDefinitionService);
    getMany(req: TestDefinitionsRequest.GetMany): Promise<{
        tests: never[];
        count: number;
        testDefinitions?: undefined;
    } | {
        testDefinitions: import("../databases/entities/test-definition.ee").TestDefinition[];
        count: number;
        tests?: undefined;
    }>;
    getOne(req: TestDefinitionsRequest.GetOne): Promise<import("../databases/entities/test-definition.ee").TestDefinition>;
    create(req: TestDefinitionsRequest.Create, res: express.Response): Promise<import("../databases/entities/test-definition.ee").TestDefinition | undefined>;
    delete(req: TestDefinitionsRequest.Delete): Promise<{
        success: boolean;
    }>;
    patch(req: TestDefinitionsRequest.Patch, res: express.Response): Promise<import("../databases/entities/test-definition.ee").TestDefinition | undefined>;
}
