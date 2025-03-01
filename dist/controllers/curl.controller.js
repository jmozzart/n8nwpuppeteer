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
exports.CurlController = void 0;
const decorators_1 = require("../decorators");
const bad_request_error_1 = require("../errors/response-errors/bad-request.error");
const curl_service_1 = require("../services/curl.service");
let CurlController = class CurlController {
    constructor(curlService) {
        this.curlService = curlService;
    }
    toJson(req) {
        try {
            const parameters = this.curlService.toHttpNodeParameters(req.body.curlCommand);
            return (0, curl_service_1.flattenObject)(parameters, 'parameters');
        }
        catch (e) {
            throw new bad_request_error_1.BadRequestError('Invalid cURL command');
        }
    }
};
exports.CurlController = CurlController;
__decorate([
    (0, decorators_1.Post)('/to-json'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CurlController.prototype, "toJson", null);
exports.CurlController = CurlController = __decorate([
    (0, decorators_1.RestController)('/curl'),
    __metadata("design:paramtypes", [curl_service_1.CurlService])
], CurlController);
//# sourceMappingURL=curl.controller.js.map