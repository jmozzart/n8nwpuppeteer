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
exports.InstalledPackages = void 0;
const typeorm_1 = require("@n8n/typeorm");
const abstract_entity_1 = require("./abstract-entity");
let InstalledPackages = class InstalledPackages extends abstract_entity_1.WithTimestamps {
};
exports.InstalledPackages = InstalledPackages;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], InstalledPackages.prototype, "packageName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InstalledPackages.prototype, "installedVersion", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InstalledPackages.prototype, "authorName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InstalledPackages.prototype, "authorEmail", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('InstalledNodes', 'package'),
    (0, typeorm_1.JoinColumn)({ referencedColumnName: 'package' }),
    __metadata("design:type", Array)
], InstalledPackages.prototype, "installedNodes", void 0);
exports.InstalledPackages = InstalledPackages = __decorate([
    (0, typeorm_1.Entity)()
], InstalledPackages);
//# sourceMappingURL=installed-packages.js.map