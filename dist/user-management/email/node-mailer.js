"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeMailer = void 0;
const config_1 = require("@n8n/config");
const lodash_1 = require("lodash");
const n8n_workflow_1 = require("n8n-workflow");
const node_path_1 = __importDefault(require("node:path"));
const nodemailer_1 = require("nodemailer");
const typedi_1 = require("typedi");
const logger_service_1 = require("../../logging/logger.service");
let NodeMailer = class NodeMailer {
    constructor(globalConfig, logger) {
        this.logger = logger;
        const smtpConfig = globalConfig.userManagement.emails.smtp;
        const transportConfig = (0, lodash_1.pick)(smtpConfig, ['host', 'port', 'secure']);
        transportConfig.ignoreTLS = !smtpConfig.startTLS;
        const { auth } = smtpConfig;
        if (auth.user && auth.pass) {
            transportConfig.auth = (0, lodash_1.pick)(auth, ['user', 'pass']);
        }
        if (auth.serviceClient && auth.privateKey) {
            transportConfig.auth = {
                type: 'OAuth2',
                user: auth.user,
                serviceClient: auth.serviceClient,
                privateKey: auth.privateKey.replace(/\\n/g, '\n'),
            };
        }
        this.transport = (0, nodemailer_1.createTransport)(transportConfig);
        this.sender = smtpConfig.sender;
        if (!this.sender && auth.user.includes('@')) {
            this.sender = auth.user;
        }
    }
    async sendMail(mailData) {
        try {
            await this.transport.sendMail({
                from: this.sender,
                to: mailData.emailRecipients,
                subject: mailData.subject,
                text: mailData.textOnly,
                html: mailData.body,
                attachments: [
                    {
                        cid: 'n8n-logo',
                        filename: 'n8n-logo.png',
                        path: node_path_1.default.resolve(__dirname, 'templates/n8n-logo.png'),
                        contentDisposition: 'inline',
                    },
                ],
            });
            this.logger.debug(`Email sent successfully to the following recipients: ${mailData.emailRecipients.toString()}`);
        }
        catch (error) {
            n8n_workflow_1.ErrorReporterProxy.error(error);
            this.logger.error('Failed to send email', {
                recipients: mailData.emailRecipients,
                error: error,
            });
            throw error;
        }
        return { emailSent: true };
    }
};
exports.NodeMailer = NodeMailer;
exports.NodeMailer = NodeMailer = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig,
        logger_service_1.Logger])
], NodeMailer);
//# sourceMappingURL=node-mailer.js.map