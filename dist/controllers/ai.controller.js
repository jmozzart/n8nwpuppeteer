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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const node_assert_1 = require("node:assert");
const web_1 = require("node:stream/web");
const decorators_1 = require("../decorators");
const internal_server_error_1 = require("../errors/response-errors/internal-server.error");
const ai_service_1 = require("../services/ai.service");
let AiController = class AiController {
    constructor(aiService) {
        this.aiService = aiService;
    }
    async chat(req, res) {
        try {
            const aiResponse = await this.aiService.chat(req.body, req.user);
            if (aiResponse.body) {
                res.header('Content-type', 'application/json-lines').flush();
                await aiResponse.body.pipeTo(new web_1.WritableStream({
                    write(chunk) {
                        res.write(chunk);
                        res.flush();
                    },
                }));
                res.end();
            }
        }
        catch (e) {
            (0, node_assert_1.strict)(e instanceof Error);
            n8n_workflow_1.ErrorReporterProxy.error(e);
            throw new internal_server_error_1.InternalServerError(`Something went wrong: ${e.message}`);
        }
    }
    async applySuggestion(req) {
        try {
            return await this.aiService.applySuggestion(req.body, req.user);
        }
        catch (e) {
            (0, node_assert_1.strict)(e instanceof Error);
            n8n_workflow_1.ErrorReporterProxy.error(e);
            throw new internal_server_error_1.InternalServerError(`Something went wrong: ${e.message}`);
        }
    }
    async askAi(req) {
        try {
            return await this.aiService.askAi(req.body, req.user);
        }
        catch (e) {
            (0, node_assert_1.strict)(e instanceof Error);
            n8n_workflow_1.ErrorReporterProxy.error(e);
            throw new internal_server_error_1.InternalServerError(`Something went wrong: ${e.message}`);
        }
    }
};
exports.AiController = AiController;
__decorate([
    (0, decorators_1.Post)('/chat', { rateLimit: { limit: 100 } }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "chat", null);
__decorate([
    (0, decorators_1.Post)('/chat/apply-suggestion'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "applySuggestion", null);
__decorate([
    (0, decorators_1.Post)('/ask-ai'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "askAi", null);
exports.AiController = AiController = __decorate([
    (0, decorators_1.RestController)('/ai'),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map