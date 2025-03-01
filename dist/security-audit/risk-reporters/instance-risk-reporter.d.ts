import { GlobalConfig } from '@n8n/config';
import { InstanceSettings } from 'n8n-core';
import type { WorkflowEntity } from '../../databases/entities/workflow-entity';
import { Logger } from '../../logging/logger.service';
import type { RiskReporter, Risk } from '../../security-audit/types';
export declare class InstanceRiskReporter implements RiskReporter {
    private readonly instanceSettings;
    private readonly logger;
    private readonly globalConfig;
    constructor(instanceSettings: InstanceSettings, logger: Logger, globalConfig: GlobalConfig);
    report(workflows: WorkflowEntity[]): Promise<Risk.InstanceReport | null>;
    private getSecuritySettings;
    private hasValidatorChild;
    private getUnprotectedWebhookNodes;
    private getNextVersions;
    private removeIconData;
    private classify;
    private getOutdatedState;
}
