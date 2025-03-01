import { GlobalConfig } from '@n8n/config';
import type { AiAssistantSDK } from '@n8n_io/ai-assistant-sdk';
import { type IUser } from 'n8n-workflow';
import type { AiAssistantRequest } from '../requests';
import { License } from '../license';
export declare class AiService {
    private readonly licenseService;
    private readonly globalConfig;
    private client;
    constructor(licenseService: License, globalConfig: GlobalConfig);
    init(): Promise<void>;
    chat(payload: AiAssistantSDK.ChatRequestPayload, user: IUser): Promise<Response>;
    applySuggestion(payload: AiAssistantRequest.SuggestionPayload, user: IUser): Promise<AiAssistantSDK.ApplySuggestionResponse>;
    askAi(payload: AiAssistantSDK.AskAiRequestPayload, user: IUser): Promise<AiAssistantSDK.AskAiResponsePayload>;
}
