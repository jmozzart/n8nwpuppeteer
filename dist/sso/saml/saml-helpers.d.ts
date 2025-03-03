import type { FlowResult } from 'samlify/types/src/flow';
import type { User } from '../../databases/entities/user';
import type { SamlConfiguration } from './types/requests';
import type { SamlAttributeMapping } from './types/saml-attribute-mapping';
import type { SamlPreferences } from './types/saml-preferences';
import type { SamlUserAttributes } from './types/saml-user-attributes';
export declare function isSamlLoginEnabled(): boolean;
export declare function getSamlLoginLabel(): string;
export declare function setSamlLoginEnabled(enabled: boolean): Promise<void>;
export declare function setSamlLoginLabel(label: string): void;
export declare function isSamlLicensed(): boolean;
export declare function isSamlLicensedAndEnabled(): boolean;
export declare const isSamlPreferences: (candidate: unknown) => candidate is SamlPreferences;
export declare function createUserFromSamlAttributes(attributes: SamlUserAttributes): Promise<User>;
export declare function updateUserFromSamlAttributes(user: User, attributes: SamlUserAttributes): Promise<User>;
type GetMappedSamlReturn = {
    attributes: SamlUserAttributes | undefined;
    missingAttributes: string[];
};
export declare function getMappedSamlAttributesFromFlowResult(flowResult: FlowResult, attributeMapping: SamlAttributeMapping): GetMappedSamlReturn;
export declare function isConnectionTestRequest(req: SamlConfiguration.AcsRequest): boolean;
export {};
