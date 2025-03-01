import { WorkflowEntity } from '../databases/entities/workflow-entity';
import { CredentialsRepository } from '../databases/repositories/credentials.repository';
import { TagRepository } from '../databases/repositories/tag.repository';
import { Logger } from '../logging/logger.service';
export declare class ImportService {
    private readonly logger;
    private readonly credentialsRepository;
    private readonly tagRepository;
    private dbCredentials;
    private dbTags;
    constructor(logger: Logger, credentialsRepository: CredentialsRepository, tagRepository: TagRepository);
    initRecords(): Promise<void>;
    importWorkflows(workflows: WorkflowEntity[], projectId: string): Promise<void>;
    replaceInvalidCreds(workflow: WorkflowEntity): Promise<void>;
    private toNewCredentialFormat;
}
