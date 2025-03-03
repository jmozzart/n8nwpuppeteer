import type { OpenAPIV3 } from 'openapi-types';
import { ApiKey } from '../databases/entities/api-key';
import type { User } from '../databases/entities/user';
import { ApiKeyRepository } from '../databases/repositories/api-key.repository';
import { UserRepository } from '../databases/repositories/user.repository';
import { EventService } from '../events/event.service';
import type { AuthenticatedRequest } from '../requests';
import { JwtService } from './jwt.service';
export declare class PublicApiKeyService {
    private readonly apiKeyRepository;
    private readonly userRepository;
    private readonly jwtService;
    private readonly eventService;
    constructor(apiKeyRepository: ApiKeyRepository, userRepository: UserRepository, jwtService: JwtService, eventService: EventService);
    createPublicApiKeyForUser(user: User): Promise<ApiKey>;
    getRedactedApiKeysForUser(user: User): Promise<{
        apiKey: string;
        user: User;
        userId: string;
        label: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    deleteApiKeyForUser(user: User, apiKeyId: string): Promise<void>;
    private getUserForApiKey;
    redactApiKey(apiKey: string): string;
    getAuthMiddleware(version: string): (req: AuthenticatedRequest, _scopes: unknown, schema: OpenAPIV3.ApiKeySecurityScheme) => Promise<boolean>;
    private generateApiKey;
}
