import { GlobalConfig } from '@n8n/config';
import { Logger } from '../../logging/logger.service';
import type { MailData, SendEmailResult } from './interfaces';
export declare class NodeMailer {
    private readonly logger;
    readonly sender: string;
    private transport;
    constructor(globalConfig: GlobalConfig, logger: Logger);
    sendMail(mailData: MailData): Promise<SendEmailResult>;
}
