import { CredentialsRepository } from './databases/repositories/credentials.repository';
import { SettingsRepository } from './databases/repositories/settings.repository';
import { UserRepository } from './databases/repositories/user.repository';
import { WorkflowRepository } from './databases/repositories/workflow.repository';
export declare class ExternalHooks {
    externalHooks: {
        [key: string]: Array<() => {}>;
    };
    private initDidRun;
    private dbCollections;
    constructor(userRepository: UserRepository, settingsRepository: SettingsRepository, credentialsRepository: CredentialsRepository, workflowRepository: WorkflowRepository);
    init(): Promise<void>;
    private loadHooksFiles;
    private loadHooks;
    run(hookName: string, hookParameters?: any[]): Promise<void>;
    exists(hookName: string): boolean;
}
