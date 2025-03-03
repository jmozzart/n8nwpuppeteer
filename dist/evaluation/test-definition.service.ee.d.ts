import type { TestDefinition } from '../databases/entities/test-definition.ee';
import { AnnotationTagRepository } from '../databases/repositories/annotation-tag.repository.ee';
import { TestDefinitionRepository } from '../databases/repositories/test-definition.repository.ee';
import type { ListQuery } from '../requests';
type TestDefinitionLike = Omit<Partial<TestDefinition>, 'workflow' | 'evaluationWorkflow' | 'annotationTag'> & {
    workflow?: {
        id: string;
    };
    evaluationWorkflow?: {
        id: string;
    };
    annotationTag?: {
        id: string;
    };
};
export declare class TestDefinitionService {
    private testDefinitionRepository;
    private annotationTagRepository;
    constructor(testDefinitionRepository: TestDefinitionRepository, annotationTagRepository: AnnotationTagRepository);
    private toEntityLike;
    toEntity(attrs: {
        name?: string;
        workflowId?: string;
        evaluationWorkflowId?: string;
        annotationTagId?: string;
        id?: string;
    }): TestDefinition;
    findOne(id: string, accessibleWorkflowIds: string[]): Promise<TestDefinition | null>;
    save(test: TestDefinition): Promise<TestDefinition>;
    update(id: string, attrs: TestDefinitionLike): Promise<void>;
    delete(id: string, accessibleWorkflowIds: string[]): Promise<void>;
    getMany(options: ListQuery.Options, accessibleWorkflowIds?: string[]): Promise<{
        tests: never[];
        count: number;
        testDefinitions?: undefined;
    } | {
        testDefinitions: TestDefinition[];
        count: number;
        tests?: undefined;
    }>;
}
export {};
