import type express from 'express';
import type { IdentityProviderInstance, ServiceProviderInstance } from 'samlify';
import type { BindingContext, PostBindingContext } from 'samlify/types/src/entity';
import type { User } from '../../databases/entities/user';
import { Logger } from '../../logging/logger.service';
import { UrlService } from '../../services/url.service';
import type { SamlLoginBinding } from './types';
import type { SamlPreferences } from './types/saml-preferences';
import type { SamlUserAttributes } from './types/saml-user-attributes';
export declare class SamlService {
    private readonly logger;
    private readonly urlService;
    private identityProviderInstance;
    private samlify;
    private _samlPreferences;
    get samlPreferences(): SamlPreferences;
    constructor(logger: Logger, urlService: UrlService);
    init(): Promise<void>;
    loadSamlify(): Promise<void>;
    getIdentityProviderInstance(forceRecreate?: boolean): IdentityProviderInstance;
    getServiceProviderInstance(): ServiceProviderInstance;
    getLoginRequestUrl(relayState?: string, binding?: SamlLoginBinding): Promise<{
        binding: SamlLoginBinding;
        context: BindingContext | PostBindingContext;
    }>;
    private getRedirectLoginRequestUrl;
    private getPostLoginRequestUrl;
    handleSamlLogin(req: express.Request, binding: SamlLoginBinding): Promise<{
        authenticatedUser: User | undefined;
        attributes: SamlUserAttributes;
        onboardingRequired: boolean;
    }>;
    setSamlPreferences(prefs: SamlPreferences): Promise<SamlPreferences | undefined>;
    loadPreferencesWithoutValidation(prefs: SamlPreferences): Promise<void>;
    loadFromDbAndApplySamlPreferences(apply?: boolean): Promise<SamlPreferences | undefined>;
    saveSamlPreferencesToDb(): Promise<SamlPreferences | undefined>;
    fetchMetadataFromUrl(): Promise<string | undefined>;
    getAttributesFromLoginResponse(req: express.Request, binding: SamlLoginBinding): Promise<SamlUserAttributes>;
    reset(): Promise<void>;
}
