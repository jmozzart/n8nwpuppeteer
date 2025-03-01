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
exports.AuthUserRepository = void 0;
const typeorm_1 = require("@n8n/typeorm");
const typedi_1 = require("typedi");
const auth_user_1 = require("../entities/auth-user");
let AuthUserRepository = class AuthUserRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        super(auth_user_1.AuthUser, dataSource.manager);
    }
};
exports.AuthUserRepository = AuthUserRepository;
exports.AuthUserRepository = AuthUserRepository = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], AuthUserRepository);
//# sourceMappingURL=auth-user.repository.js.map