import type { PushType, WorkerStatus } from '@n8n/api-types';
import type { IWorkflowDb } from '../../interfaces';
export type PubSubEventMap = PubSubCommandMap & PubSubWorkerResponseMap;
export type PubSubCommandMap = {
    'reload-license': never;
    'restart-event-bus': never;
    'reload-external-secrets-providers': never;
    'community-package-install': {
        packageName: string;
        packageVersion: string;
    };
    'community-package-update': {
        packageName: string;
        packageVersion: string;
    };
    'community-package-uninstall': {
        packageName: string;
    };
    'get-worker-id': never;
    'get-worker-status': never;
    'add-webhooks-triggers-and-pollers': {
        workflowId: string;
    };
    'remove-triggers-and-pollers': {
        workflowId: string;
    };
    'display-workflow-activation': {
        workflowId: string;
    };
    'display-workflow-deactivation': {
        workflowId: string;
    };
    'display-workflow-activation-error': {
        workflowId: string;
        errorMessage: string;
    };
    'relay-execution-lifecycle-event': {
        type: PushType;
        args: Record<string, unknown>;
        pushRef: string;
    };
    'clear-test-webhooks': {
        webhookKey: string;
        workflowEntity: IWorkflowDb;
        pushRef: string;
    };
};
export type PubSubWorkerResponseMap = {
    'response-to-get-worker-status': WorkerStatus;
};
