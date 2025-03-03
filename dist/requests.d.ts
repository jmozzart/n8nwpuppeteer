import type { Scope } from '@n8n/permissions';
import type { AiAssistantSDK } from '@n8n_io/ai-assistant-sdk';
import type express from 'express';
import type { BannerName, ICredentialDataDecryptedObject, IDataObject, ILoadOptions, INodeCredentialTestRequest, INodeCredentials, INodeParameters, INodeTypeNameVersion, IPersonalizationSurveyAnswersV4, IUser } from 'n8n-workflow';
import type { CredentialsEntity } from './databases/entities/credentials-entity';
import type { Project, ProjectType } from './databases/entities/project';
import type { AssignableRole, GlobalRole, User } from './databases/entities/user';
import type { Variables } from './databases/entities/variables';
import type { WorkflowEntity } from './databases/entities/workflow-entity';
import type { WorkflowHistory } from './databases/entities/workflow-history';
import type { PublicUser, SecretsProvider, SecretsProviderState } from './interfaces';
import type { ProjectRole } from './databases/entities/project-relation';
import type { ScopesField } from './services/role.service';
export type APIRequest<RouteParams = {}, ResponseBody = {}, RequestBody = {}, RequestQuery = {}> = express.Request<RouteParams, ResponseBody, RequestBody, RequestQuery> & {
    browserId?: string;
};
export type AuthlessRequest<RouteParams = {}, ResponseBody = {}, RequestBody = {}, RequestQuery = {}> = APIRequest<RouteParams, ResponseBody, RequestBody, RequestQuery>;
export type AuthenticatedRequest<RouteParams = {}, ResponseBody = {}, RequestBody = {}, RequestQuery = {}> = Omit<APIRequest<RouteParams, ResponseBody, RequestBody, RequestQuery>, 'user' | 'cookies'> & {
    user: User;
    cookies: Record<string, string | undefined>;
    headers: express.Request['headers'] & {
        'push-ref': string;
    };
};
export declare namespace ListQuery {
    type Request = AuthenticatedRequest<{}, {}, {}, Params> & {
        listQueryOptions?: Options;
    };
    type Params = {
        filter?: string;
        skip?: string;
        take?: string;
        select?: string;
    };
    type Options = {
        filter?: Record<string, unknown>;
        select?: Record<string, true>;
        skip?: number;
        take?: number;
    };
    namespace Workflow {
        type OptionalBaseFields = 'name' | 'active' | 'versionId' | 'createdAt' | 'updatedAt' | 'tags';
        type BaseFields = Pick<WorkflowEntity, 'id'> & Partial<Pick<WorkflowEntity, OptionalBaseFields>>;
        type SharedField = Partial<Pick<WorkflowEntity, 'shared'>>;
        type OwnedByField = {
            ownedBy: SlimUser | null;
            homeProject: SlimProject | null;
        };
        export type Plain = BaseFields;
        export type WithSharing = BaseFields & SharedField;
        export type WithOwnership = BaseFields & OwnedByField;
        type SharedWithField = {
            sharedWith: SlimUser[];
            sharedWithProjects: SlimProject[];
        };
        export type WithOwnedByAndSharedWith = BaseFields & OwnedByField & SharedWithField & SharedField;
        export type WithScopes = BaseFields & ScopesField & SharedField;
        export {};
    }
    namespace Credentials {
        type OwnedByField = {
            homeProject: SlimProject | null;
        };
        type SharedField = Partial<Pick<CredentialsEntity, 'shared'>>;
        type SharedWithField = {
            sharedWithProjects: SlimProject[];
        };
        export type WithSharing = CredentialsEntity & SharedField;
        export type WithOwnedByAndSharedWith = CredentialsEntity & OwnedByField & SharedWithField & SharedField;
        export type WithScopes = CredentialsEntity & ScopesField & SharedField;
        export {};
    }
}
type SlimUser = Pick<IUser, 'id' | 'email' | 'firstName' | 'lastName'>;
export type SlimProject = Pick<Project, 'id' | 'type' | 'name'>;
export declare function hasSharing(workflows: ListQuery.Workflow.Plain[] | ListQuery.Workflow.WithSharing[]): workflows is ListQuery.Workflow.WithSharing[];
export declare namespace CredentialRequest {
    type CredentialProperties = Partial<{
        id: string;
        name: string;
        type: string;
        data: ICredentialDataDecryptedObject;
        projectId?: string;
    }>;
    type Create = AuthenticatedRequest<{}, {}, CredentialProperties>;
    type Get = AuthenticatedRequest<{
        credentialId: string;
    }, {}, {}, Record<string, string>>;
    type GetMany = AuthenticatedRequest<{}, {}, {}, ListQuery.Params & {
        includeScopes?: string;
    }> & {
        listQueryOptions: ListQuery.Options;
    };
    type Delete = Get;
    type GetAll = AuthenticatedRequest<{}, {}, {}, {
        filter: string;
    }>;
    type Update = AuthenticatedRequest<{
        credentialId: string;
    }, {}, CredentialProperties>;
    type NewName = AuthenticatedRequest<{}, {}, {}, {
        name?: string;
    }>;
    type Test = AuthenticatedRequest<{}, {}, INodeCredentialTestRequest>;
    type Share = AuthenticatedRequest<{
        credentialId: string;
    }, {}, {
        shareWithIds: string[];
    }>;
    type Transfer = AuthenticatedRequest<{
        credentialId: string;
    }, {}, {
        destinationProjectId: string;
    }>;
    type ForWorkflow = AuthenticatedRequest<{}, {}, {}, {
        workflowId: string;
    } | {
        projectId: string;
    }>;
}
export declare namespace ApiKeysRequest {
    type DeleteAPIKey = AuthenticatedRequest<{
        id: string;
    }>;
}
export declare namespace MeRequest {
    type SurveyAnswers = AuthenticatedRequest<{}, {}, IPersonalizationSurveyAnswersV4>;
}
export interface UserSetupPayload {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    mfaEnabled?: boolean;
    mfaSecret?: string;
    mfaRecoveryCodes?: string[];
}
export declare namespace OwnerRequest {
    type Post = AuthenticatedRequest<{}, {}, UserSetupPayload, {}>;
    type DismissBanner = AuthenticatedRequest<{}, {}, Partial<{
        bannerName: BannerName;
    }>, {}>;
}
export declare namespace PasswordResetRequest {
    type Email = AuthlessRequest<{}, {}, Pick<PublicUser, 'email'>>;
    type Credentials = AuthlessRequest<{}, {}, {}, {
        userId?: string;
        token?: string;
    }>;
    type NewPassword = AuthlessRequest<{}, {}, Pick<PublicUser, 'password'> & {
        token?: string;
        userId?: string;
        mfaToken?: string;
    }>;
}
export declare namespace UserRequest {
    type Invite = AuthenticatedRequest<{}, {}, Array<{
        email: string;
        role?: AssignableRole;
    }>>;
    type InviteResponse = {
        user: {
            id: string;
            email: string;
            inviteAcceptUrl?: string;
            emailSent: boolean;
            role: AssignableRole;
        };
        error?: string;
    };
    type ResolveSignUp = AuthlessRequest<{}, {}, {}, {
        inviterId?: string;
        inviteeId?: string;
    }>;
    type SignUp = AuthenticatedRequest<{
        id: string;
    }, {
        inviterId?: string;
        inviteeId?: string;
    }>;
    type Delete = AuthenticatedRequest<{
        id: string;
        email: string;
        identifier: string;
    }, {}, {}, {
        transferId?: string;
        includeRole: boolean;
    }>;
    type Get = AuthenticatedRequest<{
        id: string;
        email: string;
        identifier: string;
    }, {}, {}, {
        limit?: number;
        offset?: number;
        cursor?: string;
        includeRole?: boolean;
        projectId?: string;
    }>;
    type PasswordResetLink = AuthenticatedRequest<{
        id: string;
    }, {}, {}, {}>;
    type Reinvite = AuthenticatedRequest<{
        id: string;
    }>;
    type Update = AuthlessRequest<{
        id: string;
    }, {}, {
        inviterId: string;
        firstName: string;
        lastName: string;
        password: string;
    }>;
}
export type LoginRequest = AuthlessRequest<{}, {}, {
    email: string;
    password: string;
    mfaToken?: string;
    mfaRecoveryCode?: string;
}>;
export declare namespace MFA {
    type Verify = AuthenticatedRequest<{}, {}, {
        token: string;
    }, {}>;
    type Activate = AuthenticatedRequest<{}, {}, {
        token: string;
    }, {}>;
    type Disable = AuthenticatedRequest<{}, {}, {
        token: string;
    }, {}>;
    type Config = AuthenticatedRequest<{}, {}, {
        login: {
            enabled: boolean;
        };
    }, {}>;
    type ValidateRecoveryCode = AuthenticatedRequest<{}, {}, {
        recoveryCode: {
            enabled: boolean;
        };
    }, {}>;
}
export declare namespace OAuthRequest {
    namespace OAuth1Credential {
        type Auth = AuthenticatedRequest<{}, {}, {}, {
            id: string;
        }>;
        type Callback = AuthenticatedRequest<{}, {}, {}, {
            oauth_verifier: string;
            oauth_token: string;
            state: string;
        }> & {
            user?: User;
        };
    }
    namespace OAuth2Credential {
        type Auth = AuthenticatedRequest<{}, {}, {}, {
            id: string;
        }>;
        type Callback = AuthenticatedRequest<{}, {}, {}, {
            code: string;
            state: string;
        }>;
    }
}
export declare namespace DynamicNodeParametersRequest {
    type BaseRequest<RequestBody = {}> = AuthenticatedRequest<{}, {}, {
        path: string;
        nodeTypeAndVersion: INodeTypeNameVersion;
        currentNodeParameters: INodeParameters;
        methodName?: string;
        credentials?: INodeCredentials;
    } & RequestBody, {}>;
    type Options = BaseRequest<{
        loadOptions?: ILoadOptions;
    }>;
    type ResourceLocatorResults = BaseRequest<{
        methodName: string;
        filter?: string;
        paginationToken?: string;
    }>;
    type ResourceMapperFields = BaseRequest<{
        methodName: string;
    }>;
    type ActionResult = BaseRequest<{
        handler: string;
        payload: IDataObject | string | undefined;
    }>;
}
export declare namespace TagsRequest {
    type GetAll = AuthenticatedRequest<{}, {}, {}, {
        withUsageCount: string;
    }>;
    type Create = AuthenticatedRequest<{}, {}, {
        name: string;
    }>;
    type Update = AuthenticatedRequest<{
        id: string;
    }, {}, {
        name: string;
    }>;
    type Delete = AuthenticatedRequest<{
        id: string;
    }>;
}
export declare namespace AnnotationTagsRequest {
    type GetAll = AuthenticatedRequest<{}, {}, {}, {
        withUsageCount: string;
    }>;
    type Create = AuthenticatedRequest<{}, {}, {
        name: string;
    }>;
    type Update = AuthenticatedRequest<{
        id: string;
    }, {}, {
        name: string;
    }>;
    type Delete = AuthenticatedRequest<{
        id: string;
    }>;
}
export declare namespace NodeRequest {
    type GetAll = AuthenticatedRequest;
    type Post = AuthenticatedRequest<{}, {}, {
        name?: string;
    }>;
    type Delete = AuthenticatedRequest<{}, {}, {}, {
        name: string;
    }>;
    type Update = Post;
}
export declare namespace LicenseRequest {
    type Activate = AuthenticatedRequest<{}, {}, {
        activationKey: string;
    }, {}>;
}
export type BinaryDataRequest = AuthenticatedRequest<{}, {}, {}, {
    id: string;
    action: 'view' | 'download';
    fileName?: string;
    mimeType?: string;
}>;
export declare namespace VariablesRequest {
    type CreateUpdatePayload = Omit<Variables, 'id'> & {
        id?: unknown;
    };
    type GetAll = AuthenticatedRequest;
    type Get = AuthenticatedRequest<{
        id: string;
    }, {}, {}, {}>;
    type Create = AuthenticatedRequest<{}, {}, CreateUpdatePayload, {}>;
    type Update = AuthenticatedRequest<{
        id: string;
    }, {}, CreateUpdatePayload, {}>;
    type Delete = Get;
}
export declare namespace ExternalSecretsRequest {
    type GetProviderResponse = Pick<SecretsProvider, 'displayName' | 'name' | 'properties'> & {
        icon: string;
        connected: boolean;
        connectedAt: Date | null;
        state: SecretsProviderState;
        data: IDataObject;
    };
    type GetProviders = AuthenticatedRequest;
    type GetProvider = AuthenticatedRequest<{
        provider: string;
    }, GetProviderResponse>;
    type SetProviderSettings = AuthenticatedRequest<{
        provider: string;
    }, {}, IDataObject>;
    type TestProviderSettings = SetProviderSettings;
    type SetProviderConnected = AuthenticatedRequest<{
        provider: string;
    }, {}, {
        connected: boolean;
    }>;
    type UpdateProvider = AuthenticatedRequest<{
        provider: string;
    }>;
}
export declare namespace WorkflowHistoryRequest {
    type GetList = AuthenticatedRequest<{
        workflowId: string;
    }, Array<Omit<WorkflowHistory, 'nodes' | 'connections'>>, {}, ListQuery.Options>;
    type GetVersion = AuthenticatedRequest<{
        workflowId: string;
        versionId: string;
    }, WorkflowHistory>;
}
export declare namespace ActiveWorkflowRequest {
    type GetAllActive = AuthenticatedRequest;
    type GetActivationError = AuthenticatedRequest<{
        id: string;
    }>;
}
export declare namespace ProjectRequest {
    type GetAll = AuthenticatedRequest<{}, Project[]>;
    type Create = AuthenticatedRequest<{}, Project, {
        name: string;
    }>;
    type GetMyProjects = AuthenticatedRequest<{}, Array<Project & {
        role: ProjectRole;
    }>, {}, {
        includeScopes?: boolean;
    }>;
    type GetMyProjectsResponse = Array<Project & {
        role: ProjectRole | GlobalRole;
        scopes?: Scope[];
    }>;
    type GetPersonalProject = AuthenticatedRequest<{}, Project>;
    type ProjectRelationPayload = {
        userId: string;
        role: ProjectRole;
    };
    type ProjectRelationResponse = {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: ProjectRole;
    };
    type ProjectWithRelations = {
        id: string;
        name: string | undefined;
        type: ProjectType;
        relations: ProjectRelationResponse[];
        scopes: Scope[];
    };
    type Get = AuthenticatedRequest<{
        projectId: string;
    }, {}>;
    type Update = AuthenticatedRequest<{
        projectId: string;
    }, {}, {
        name?: string;
        relations?: ProjectRelationPayload[];
    }>;
    type Delete = AuthenticatedRequest<{
        projectId: string;
    }, {}, {}, {
        transferId?: string;
    }>;
}
export declare namespace NpsSurveyRequest {
    type NpsSurveyUpdate = AuthenticatedRequest<{}, {}, unknown>;
}
export declare namespace AiAssistantRequest {
    type Chat = AuthenticatedRequest<{}, {}, AiAssistantSDK.ChatRequestPayload>;
    type SuggestionPayload = {
        sessionId: string;
        suggestionId: string;
    };
    type ApplySuggestionPayload = AuthenticatedRequest<{}, {}, SuggestionPayload>;
    type AskAiPayload = AuthenticatedRequest<{}, {}, AiAssistantSDK.AskAiRequestPayload>;
}
export {};
