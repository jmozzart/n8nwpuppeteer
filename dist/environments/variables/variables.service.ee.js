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
var VariablesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariablesService = void 0;
const typedi_1 = require("typedi");
const variables_repository_1 = require("../../databases/repositories/variables.repository");
const generators_1 = require("../../databases/utils/generators");
const variable_count_limit_reached_error_1 = require("../../errors/variable-count-limit-reached.error");
const variable_validation_error_1 = require("../../errors/variable-validation.error");
const event_service_1 = require("../../events/event.service");
const cache_service_1 = require("../../services/cache/cache.service");
const environment_helpers_1 = require("./environment-helpers");
let VariablesService = VariablesService_1 = class VariablesService {
    constructor(cacheService, variablesRepository, eventService) {
        this.cacheService = cacheService;
        this.variablesRepository = variablesRepository;
        this.eventService = eventService;
    }
    async getAllCached() {
        const variables = await this.cacheService.get('variables', {
            async refreshFn() {
                return await typedi_1.Container.get(VariablesService_1).findAll();
            },
        });
        return variables.map((v) => this.variablesRepository.create(v));
    }
    async getCount() {
        return (await this.getAllCached()).length;
    }
    async getCached(id) {
        const variables = await this.getAllCached();
        const foundVariable = variables.find((variable) => variable.id === id);
        if (!foundVariable) {
            return null;
        }
        return this.variablesRepository.create(foundVariable);
    }
    async delete(id) {
        await this.variablesRepository.delete(id);
        await this.updateCache();
    }
    async updateCache() {
        const variables = await this.findAll();
        await this.cacheService.set('variables', variables);
    }
    async findAll() {
        return await this.variablesRepository.find();
    }
    validateVariable(variable) {
        if (variable.key.length > 50) {
            throw new variable_validation_error_1.VariableValidationError('key cannot be longer than 50 characters');
        }
        if (variable.key.replace(/[A-Za-z0-9_]/g, '').length !== 0) {
            throw new variable_validation_error_1.VariableValidationError('key can only contain characters A-Za-z0-9_');
        }
        if (variable.value?.length > 255) {
            throw new variable_validation_error_1.VariableValidationError('value cannot be longer than 255 characters');
        }
    }
    async create(variable) {
        if (!(0, environment_helpers_1.canCreateNewVariable)(await this.getCount())) {
            throw new variable_count_limit_reached_error_1.VariableCountLimitReachedError('Variables limit reached');
        }
        this.validateVariable(variable);
        this.eventService.emit('variable-created');
        const saveResult = await this.variablesRepository.save({
            ...variable,
            id: (0, generators_1.generateNanoId)(),
        }, { transaction: false });
        await this.updateCache();
        return saveResult;
    }
    async update(id, variable) {
        this.validateVariable(variable);
        await this.variablesRepository.update(id, variable);
        await this.updateCache();
        return (await this.getCached(id));
    }
};
exports.VariablesService = VariablesService;
exports.VariablesService = VariablesService = VariablesService_1 = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [cache_service_1.CacheService,
        variables_repository_1.VariablesRepository,
        event_service_1.EventService])
], VariablesService);
//# sourceMappingURL=variables.service.ee.js.map