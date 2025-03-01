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
exports.AuthProviderSyncHistoryRepository = void 0;
const typeorm_1 = require("@n8n/typeorm");
const typedi_1 = require("typedi");
const auth_provider_sync_history_1 = require("../entities/auth-provider-sync-history");
let AuthProviderSyncHistoryRepository = class AuthProviderSyncHistoryRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        super(auth_provider_sync_history_1.AuthProviderSyncHistory, dataSource.manager);
    }
};
exports.AuthProviderSyncHistoryRepository = AuthProviderSyncHistoryRepository;
exports.AuthProviderSyncHistoryRepository = AuthProviderSyncHistoryRepository = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], AuthProviderSyncHistoryRepository);
//# sourceMappingURL=auth-provider-sync-history.repository.js.map