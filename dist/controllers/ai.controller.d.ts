import type { AiAssistantSDK } from '@n8n_io/ai-assistant-sdk';
import type { Response } from 'express';
import { AiAssistantRequest } from '../requests';
import { AiService } from '../services/ai.service';
type FlushableResponse = Response & {
    flush: () => void;
};
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    chat(req: AiAssistantRequest.Chat, res: FlushableResponse): Promise<void>;
    applySuggestion(req: AiAssistantRequest.ApplySuggestionPayload): Promise<AiAssistantSDK.ApplySuggestionResponse>;
    askAi(req: AiAssistantRequest.AskAiPayload): Promise<AiAssistantSDK.AskAiResponsePayload>;
}
export {};
