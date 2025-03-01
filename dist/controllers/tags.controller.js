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
exports.TagsController = void 0;
const config_1 = __importDefault(require("../config"));
const decorators_1 = require("../decorators");
const bad_request_error_1 = require("../errors/response-errors/bad-request.error");
const tag_service_1 = require("../services/tag.service");
let TagsController = class TagsController {
    constructor(tagService) {
        this.tagService = tagService;
        this.config = config_1.default;
    }
    workflowsEnabledMiddleware(_req, _res, next) {
        if (this.config.getEnv('workflowTagsDisabled'))
            throw new bad_request_error_1.BadRequestError('Workflow tags are disabled');
        next();
    }
    async getAll(req) {
        return await this.tagService.getAll({ withUsageCount: req.query.withUsageCount === 'true' });
    }
    async createTag(req) {
        const tag = this.tagService.toEntity({ name: req.body.name });
        return await this.tagService.save(tag, 'create');
    }
    async updateTag(req) {
        const newTag = this.tagService.toEntity({ id: req.params.id, name: req.body.name.trim() });
        return await this.tagService.save(newTag, 'update');
    }
    async deleteTag(req) {
        const { id } = req.params;
        await this.tagService.delete(id);
        return true;
    }
};
exports.TagsController = TagsController;
__decorate([
    (0, decorators_1.Middleware)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Function]),
    __metadata("design:returntype", void 0)
], TagsController.prototype, "workflowsEnabledMiddleware", null);
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.GlobalScope)('tag:list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TagsController.prototype, "getAll", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.GlobalScope)('tag:create'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TagsController.prototype, "createTag", null);
__decorate([
    (0, decorators_1.Patch)('/:id(\\w+)'),
    (0, decorators_1.GlobalScope)('tag:update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TagsController.prototype, "updateTag", null);
__decorate([
    (0, decorators_1.Delete)('/:id(\\w+)'),
    (0, decorators_1.GlobalScope)('tag:delete'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TagsController.prototype, "deleteTag", null);
exports.TagsController = TagsController = __decorate([
    (0, decorators_1.RestController)('/tags'),
    __metadata("design:paramtypes", [tag_service_1.TagService])
], TagsController);
//# sourceMappingURL=tags.controller.js.map