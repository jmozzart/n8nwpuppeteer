import { Cipher } from 'n8n-core';
import { AuthUserRepository } from '../databases/repositories/auth-user.repository';
import { TOTPService } from './totp.service';
export declare class MfaService {
    private authUserRepository;
    totp: TOTPService;
    private cipher;
    constructor(authUserRepository: AuthUserRepository, totp: TOTPService, cipher: Cipher);
    generateRecoveryCodes(n?: number): string[];
    saveSecretAndRecoveryCodes(userId: string, secret: string, recoveryCodes: string[]): Promise<void>;
    encryptSecretAndRecoveryCodes(rawSecret: string, rawRecoveryCodes: string[]): {
        encryptedRecoveryCodes: string[];
        encryptedSecret: string;
    };
    private decryptSecretAndRecoveryCodes;
    getSecretAndRecoveryCodes(userId: string): Promise<{
        decryptedSecret: string;
        decryptedRecoveryCodes: string[];
    }>;
    validateMfa(userId: string, mfaToken: string | undefined, mfaRecoveryCode: string | undefined): Promise<boolean>;
    enableMfa(userId: string): Promise<import("../databases/entities/auth-user").AuthUser>;
    disableMfa(userId: string, mfaToken: string): Promise<void>;
}
