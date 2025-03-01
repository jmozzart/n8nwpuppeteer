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
exports.TaskRunnerAuthController = void 0;
const typedi_1 = require("typedi");
const task_runner_auth_schema_1 = require("./task-runner-auth.schema");
const task_runner_auth_service_1 = require("./task-runner-auth.service");
const bad_request_error_1 = require("../../errors/response-errors/bad-request.error");
const forbidden_error_1 = require("../../errors/response-errors/forbidden.error");
let TaskRunnerAuthController = class TaskRunnerAuthController {
    constructor(taskRunnerAuthService) {
        this.taskRunnerAuthService = taskRunnerAuthService;
        this.authMiddleware = this.authMiddleware.bind(this);
    }
    async createGrantToken(req) {
        const result = await task_runner_auth_schema_1.taskRunnerAuthRequestBodySchema.safeParseAsync(req.body);
        if (!result.success) {
            throw new bad_request_error_1.BadRequestError(result.error.errors[0].code);
        }
        const { token: authToken } = result.data;
        if (!this.taskRunnerAuthService.isValidAuthToken(authToken)) {
            throw new forbidden_error_1.ForbiddenError();
        }
        const grantToken = await this.taskRunnerAuthService.createGrantToken();
        return {
            token: grantToken,
        };
    }
    async authMiddleware(req, res, next) {
        const authHeader = req.headers.authorization;
        if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ code: 401, message: 'Unauthorized' });
            return;
        }
        const grantToken = authHeader.slice('Bearer '.length);
        const isConsumed = await this.taskRunnerAuthService.tryConsumeGrantToken(grantToken);
        if (!isConsumed) {
            res.status(403).json({ code: 403, message: 'Forbidden' });
            return;
        }
        next();
    }
};
exports.TaskRunnerAuthController = TaskRunnerAuthController;
exports.TaskRunnerAuthController = TaskRunnerAuthController = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [task_runner_auth_service_1.TaskRunnerAuthService])
], TaskRunnerAuthController);
//# sourceMappingURL=task-runner-auth.controller.js.map