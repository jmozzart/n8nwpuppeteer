import { SignatureConfig } from 'samlify/types/src/types';
import { SamlLoginBinding } from '.';
import { SamlAttributeMapping } from './saml-attribute-mapping';
export declare class SamlPreferences {
    mapping?: SamlAttributeMapping;
    metadata?: string;
    metadataUrl?: string;
    ignoreSSL?: boolean;
    loginBinding?: SamlLoginBinding;
    loginEnabled?: boolean;
    loginLabel?: string;
    authnRequestsSigned?: boolean;
    wantAssertionsSigned?: boolean;
    wantMessageSigned?: boolean;
    acsBinding?: SamlLoginBinding;
    signatureConfig?: SignatureConfig;
    relayState?: string;
}
