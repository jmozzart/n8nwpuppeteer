import type { WorkflowEntity } from '../../databases/entities/workflow-entity';
import type { RiskReporter, Risk } from '../../security-audit/types';
export declare class FilesystemRiskReporter implements RiskReporter {
    report(workflows: WorkflowEntity[]): Promise<Risk.StandardReport | null>;
}
