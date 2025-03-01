import type { WorkflowEntity as Workflow } from '../../databases/entities/workflow-entity';
import type { RiskReporter, Risk } from '../../security-audit/types';
export declare class DatabaseRiskReporter implements RiskReporter {
    report(workflows: Workflow[]): Promise<Risk.StandardReport | null>;
    private getIssues;
}
