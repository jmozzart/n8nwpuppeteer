export declare class TOTPService {
    generateSecret(): string;
    generateTOTPUri({ issuer, secret, label, }: {
        secret: string;
        label: string;
        issuer?: string;
    }): string;
    verifySecret({ secret, token, window }: {
        secret: string;
        token: string;
        window?: number;
    }): boolean;
    generateTOTP(secret: string): string;
}
