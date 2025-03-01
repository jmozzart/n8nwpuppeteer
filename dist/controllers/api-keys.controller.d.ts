import { type RequestHandler } from 'express';
import { EventService } from '../events/event.service';
import { ApiKeysRequest, AuthenticatedRequest } from '../requests';
import { PublicApiKeyService } from '../services/public-api-key.service';
export declare const isApiEnabledMiddleware: RequestHandler;
export declare class ApiKeysController {
    private readonly eventService;
    private readonly publicApiKeyService;
    constructor(eventService: EventService, publicApiKeyService: PublicApiKeyService);
    createAPIKey(req: AuthenticatedRequest): Promise<import("../databases/entities/api-key").ApiKey>;
    getAPIKeys(req: AuthenticatedRequest): Promise<{
        apiKey: string;
        user: import("../databases/entities/user").User;
        userId: string;
        label: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    deleteAPIKey(req: ApiKeysRequest.DeleteAPIKey): Promise<{
        success: boolean;
    }>;
}
