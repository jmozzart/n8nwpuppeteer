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
exports.DynamicNodeParametersController = void 0;
const decorators_1 = require("../decorators");
const bad_request_error_1 = require("../errors/response-errors/bad-request.error");
const dynamic_node_parameters_service_1 = require("../services/dynamic-node-parameters.service");
const workflow_execute_additional_data_1 = require("../workflow-execute-additional-data");
let DynamicNodeParametersController = class DynamicNodeParametersController {
    constructor(service) {
        this.service = service;
    }
    async getOptions(req) {
        const { credentials, currentNodeParameters, nodeTypeAndVersion, path, methodName, loadOptions, } = req.body;
        const additionalData = await (0, workflow_execute_additional_data_1.getBase)(req.user.id, currentNodeParameters);
        if (methodName) {
            return await this.service.getOptionsViaMethodName(methodName, path, additionalData, nodeTypeAndVersion, currentNodeParameters, credentials);
        }
        if (loadOptions) {
            return await this.service.getOptionsViaLoadOptions(loadOptions, additionalData, nodeTypeAndVersion, currentNodeParameters, credentials);
        }
        return [];
    }
    async getResourceLocatorResults(req) {
        const { path, methodName, filter, paginationToken, credentials, currentNodeParameters, nodeTypeAndVersion, } = req.body;
        if (!methodName)
            throw new bad_request_error_1.BadRequestError('Missing `methodName` in request body');
        const additionalData = await (0, workflow_execute_additional_data_1.getBase)(req.user.id, currentNodeParameters);
        return await this.service.getResourceLocatorResults(methodName, path, additionalData, nodeTypeAndVersion, currentNodeParameters, credentials, filter, paginationToken);
    }
    async getResourceMappingFields(req) {
        const { path, methodName, credentials, currentNodeParameters, nodeTypeAndVersion } = req.body;
        if (!methodName)
            throw new bad_request_error_1.BadRequestError('Missing `methodName` in request body');
        const additionalData = await (0, workflow_execute_additional_data_1.getBase)(req.user.id, currentNodeParameters);
        return await this.service.getResourceMappingFields(methodName, path, additionalData, nodeTypeAndVersion, currentNodeParameters, credentials);
    }
    async getActionResult(req) {
        const { currentNodeParameters, nodeTypeAndVersion, path, credentials, handler, payload } = req.body;
        const additionalData = await (0, workflow_execute_additional_data_1.getBase)(req.user.id, currentNodeParameters);
        if (handler) {
            return await this.service.getActionResult(handler, path, additionalData, nodeTypeAndVersion, currentNodeParameters, payload, credentials);
        }
        return;
    }
};
exports.DynamicNodeParametersController = DynamicNodeParametersController;
__decorate([
    (0, decorators_1.Post)('/options'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DynamicNodeParametersController.prototype, "getOptions", null);
__decorate([
    (0, decorators_1.Post)('/resource-locator-results'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DynamicNodeParametersController.prototype, "getResourceLocatorResults", null);
__decorate([
    (0, decorators_1.Post)('/resource-mapper-fields'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DynamicNodeParametersController.prototype, "getResourceMappingFields", null);
__decorate([
    (0, decorators_1.Post)('/action-result'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DynamicNodeParametersController.prototype, "getActionResult", null);
exports.DynamicNodeParametersController = DynamicNodeParametersController = __decorate([
    (0, decorators_1.RestController)('/dynamic-node-parameters'),
    __metadata("design:paramtypes", [dynamic_node_parameters_service_1.DynamicNodeParametersService])
], DynamicNodeParametersController);
//# sourceMappingURL=dynamic-node-parameters.controller.js.map