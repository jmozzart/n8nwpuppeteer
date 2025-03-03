import { SecurityConfig } from '@n8n/config';
import type { WorkflowEntity } from '../../databases/entities/workflow-entity';
import { CredentialsRepository } from '../../databases/repositories/credentials.repository';
import { ExecutionDataRepository } from '../../databases/repositories/execution-data.repository';
import { ExecutionRepository } from '../../databases/repositories/execution.repository';
import type { RiskReporter, Risk } from '../../security-audit/types';
export declare class CredentialsRiskReporter implements RiskReporter {
    private readonly credentialsRepository;
    private readonly executionRepository;
    private readonly executionDataRepository;
    private readonly securityConfig;
    constructor(credentialsRepository: CredentialsRepository, executionRepository: ExecutionRepository, executionDataRepository: ExecutionDataRepository, securityConfig: SecurityConfig);
    report(workflows: WorkflowEntity[]): Promise<Risk.StandardReport | null>;
    private getAllCredsInUse;
    private getAllExistingCreds;
    private getExecutedWorkflowsInPastDays;
    private getCredsInRecentlyExecutedWorkflows;
}
