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
exports.ExecutionMetadataService = void 0;
const typedi_1 = require("typedi");
const execution_metadata_repository_1 = require("../databases/repositories/execution-metadata.repository");
let ExecutionMetadataService = class ExecutionMetadataService {
    constructor(executionMetadataRepository) {
        this.executionMetadataRepository = executionMetadataRepository;
    }
    async save(executionId, executionMetadata) {
        const metadataRows = [];
        for (const [key, value] of Object.entries(executionMetadata)) {
            metadataRows.push({
                executionId,
                key,
                value,
            });
        }
        await this.executionMetadataRepository.upsert(metadataRows, {
            conflictPaths: { executionId: true, key: true },
        });
    }
};
exports.ExecutionMetadataService = ExecutionMetadataService;
exports.ExecutionMetadataService = ExecutionMetadataService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [execution_metadata_repository_1.ExecutionMetadataRepository])
], ExecutionMetadataService);
//# sourceMappingURL=execution-metadata.service.js.map