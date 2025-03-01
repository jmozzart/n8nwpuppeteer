"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebhookHandlerFor = createWebhookHandlerFor;
const ResponseHelper = __importStar(require("../response-helper"));
const WEBHOOK_METHODS = ['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT'];
class WebhookRequestHandler {
    constructor(webhookManager) {
        this.webhookManager = webhookManager;
    }
    async handleRequest(req, res) {
        const method = req.method;
        if (method !== 'OPTIONS' && !WEBHOOK_METHODS.includes(method)) {
            return ResponseHelper.sendErrorResponse(res, new Error(`The method ${method} is not supported.`));
        }
        if ('origin' in req.headers) {
            const corsSetupError = await this.setupCorsHeaders(req, res);
            if (corsSetupError) {
                return ResponseHelper.sendErrorResponse(res, corsSetupError);
            }
        }
        if (method === 'OPTIONS') {
            return ResponseHelper.sendSuccessResponse(res, {}, true, 204);
        }
        try {
            const response = await this.webhookManager.executeWebhook(req, res);
            if (response.noWebhookResponse !== true) {
                ResponseHelper.sendSuccessResponse(res, response.data, true, response.responseCode, response.headers);
            }
        }
        catch (error) {
            return ResponseHelper.sendErrorResponse(res, error);
        }
    }
    async setupCorsHeaders(req, res) {
        const method = req.method;
        const { path } = req.params;
        if (this.webhookManager.getWebhookMethods) {
            try {
                const allowedMethods = await this.webhookManager.getWebhookMethods(path);
                res.header('Access-Control-Allow-Methods', ['OPTIONS', ...allowedMethods].join(', '));
            }
            catch (error) {
                return error;
            }
        }
        const requestedMethod = method === 'OPTIONS'
            ? req.headers['access-control-request-method']
            : method;
        if (this.webhookManager.findAccessControlOptions && requestedMethod) {
            const options = await this.webhookManager.findAccessControlOptions(path, requestedMethod);
            const { allowedOrigins } = options ?? {};
            if (allowedOrigins && allowedOrigins !== '*' && allowedOrigins !== req.headers.origin) {
                const originsList = allowedOrigins.split(',');
                const defaultOrigin = originsList[0];
                if (originsList.length === 1) {
                    res.header('Access-Control-Allow-Origin', defaultOrigin);
                }
                if (originsList.includes(req.headers.origin)) {
                    res.header('Access-Control-Allow-Origin', req.headers.origin);
                }
                else {
                    res.header('Access-Control-Allow-Origin', defaultOrigin);
                }
            }
            else {
                res.header('Access-Control-Allow-Origin', req.headers.origin);
            }
            if (method === 'OPTIONS') {
                res.header('Access-Control-Max-Age', '300');
                const requestedHeaders = req.headers['access-control-request-headers'];
                if (requestedHeaders?.length) {
                    res.header('Access-Control-Allow-Headers', requestedHeaders);
                }
            }
        }
        return null;
    }
}
function createWebhookHandlerFor(webhookManager) {
    const handler = new WebhookRequestHandler(webhookManager);
    return async (req, res) => {
        await handler.handleRequest(req, res);
    };
}
//# sourceMappingURL=webhook-request-handler.js.map