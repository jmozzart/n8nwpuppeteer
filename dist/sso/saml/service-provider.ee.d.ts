import type { ServiceProviderInstance } from 'samlify';
import type { SamlPreferences } from './types/saml-preferences';
export declare function getServiceProviderEntityId(): string;
export declare function getServiceProviderReturnUrl(): string;
export declare function getServiceProviderConfigTestReturnUrl(): string;
export declare function getServiceProviderInstance(prefs: SamlPreferences, samlify: typeof import('samlify')): ServiceProviderInstance;
