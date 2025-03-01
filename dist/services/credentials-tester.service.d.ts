import type { ICredentialsDecrypted, ICredentialTestFunction, ICredentialTestRequestData, INodeCredentialTestResult } from 'n8n-workflow';
import { CredentialTypes } from '../credential-types';
import type { User } from '../databases/entities/user';
import { Logger } from '../logging/logger.service';
import { NodeTypes } from '../node-types';
import { CredentialsHelper } from '../credentials-helper';
export declare class CredentialsTester {
    private readonly logger;
    private readonly credentialTypes;
    private readonly nodeTypes;
    private readonly credentialsHelper;
    constructor(logger: Logger, credentialTypes: CredentialTypes, nodeTypes: NodeTypes, credentialsHelper: CredentialsHelper);
    private static hasAccessToken;
    getCredentialTestFunction(credentialType: string): ICredentialTestFunction | ICredentialTestRequestData | undefined;
    testCredentials(user: User, credentialType: string, credentialsDecrypted: ICredentialsDecrypted): Promise<INodeCredentialTestResult>;
}
