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
exports.ExecutionMetadata = void 0;
const typeorm_1 = require("@n8n/typeorm");
const execution_entity_1 = require("./execution-entity");
let ExecutionMetadata = class ExecutionMetadata {
};
exports.ExecutionMetadata = ExecutionMetadata;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ExecutionMetadata.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('ExecutionEntity', 'metadata', {
        onDelete: 'CASCADE',
    }),
    __metadata("design:type", execution_entity_1.ExecutionEntity)
], ExecutionMetadata.prototype, "execution", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ExecutionMetadata.prototype, "executionId", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], ExecutionMetadata.prototype, "key", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], ExecutionMetadata.prototype, "value", void 0);
exports.ExecutionMetadata = ExecutionMetadata = __decorate([
    (0, typeorm_1.Entity)()
], ExecutionMetadata);
//# sourceMappingURL=execution-metadata.js.map