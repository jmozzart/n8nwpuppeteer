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
exports.WorkflowHistoryRepository = void 0;
const typeorm_1 = require("@n8n/typeorm");
const typedi_1 = require("typedi");
const workflow_history_1 = require("../entities/workflow-history");
let WorkflowHistoryRepository = class WorkflowHistoryRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        super(workflow_history_1.WorkflowHistory, dataSource.manager);
    }
    async deleteEarlierThan(date) {
        return await this.delete({ createdAt: (0, typeorm_1.LessThan)(date) });
    }
};
exports.WorkflowHistoryRepository = WorkflowHistoryRepository;
exports.WorkflowHistoryRepository = WorkflowHistoryRepository = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], WorkflowHistoryRepository);
//# sourceMappingURL=workflow-history.repository.js.map