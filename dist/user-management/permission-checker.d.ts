import type { INode } from 'n8n-workflow';
import { SharedCredentialsRepository } from '../databases/repositories/shared-credentials.repository';
import { OwnershipService } from '../services/ownership.service';
import { ProjectService } from '../services/project.service';
export declare class PermissionChecker {
    private readonly sharedCredentialsRepository;
    private readonly ownershipService;
    private readonly projectService;
    constructor(sharedCredentialsRepository: SharedCredentialsRepository, ownershipService: OwnershipService, projectService: ProjectService);
    check(workflowId: string, nodes: INode[]): Promise<void>;
    private mapCredIdsToNodes;
}
