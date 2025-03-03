import type { IDataObject, INodeProperties } from 'n8n-workflow';
import { CredentialsEntity } from '../../../../databases/entities/credentials-entity';
import { SharedCredentials } from '../../../../databases/entities/shared-credentials';
import type { User } from '../../../../databases/entities/user';
import type { ICredentialsDb } from '../../../../interfaces';
import type { CredentialRequest } from '../../../../requests';
export declare function getCredentials(credentialId: string): Promise<ICredentialsDb | null>;
export declare function getSharedCredentials(userId: string, credentialId: string): Promise<SharedCredentials | null>;
export declare function createCredential(properties: CredentialRequest.CredentialProperties): Promise<CredentialsEntity>;
export declare function saveCredential(credential: CredentialsEntity, user: User, encryptedData: ICredentialsDb): Promise<CredentialsEntity>;
export declare function removeCredential(user: User, credentials: CredentialsEntity): Promise<ICredentialsDb>;
export declare function encryptCredential(credential: CredentialsEntity): Promise<ICredentialsDb>;
export declare function sanitizeCredentials(credentials: CredentialsEntity): Partial<CredentialsEntity>;
export declare function sanitizeCredentials(credentials: CredentialsEntity[]): Array<Partial<CredentialsEntity>>;
export declare function toJsonSchema(properties: INodeProperties[]): IDataObject;
