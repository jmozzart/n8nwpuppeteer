"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityAuditService = void 0;
const config_1 = require("@n8n/config");
const typedi_1 = __importStar(require("typedi"));
const config_2 = __importDefault(require("../config"));
const workflow_repository_1 = require("../databases/repositories/workflow.repository");
const constants_1 = require("../security-audit/constants");
const utils_1 = require("../security-audit/utils");
let SecurityAuditService = class SecurityAuditService {
    constructor(workflowRepository, securityConfig) {
        this.workflowRepository = workflowRepository;
        this.securityConfig = securityConfig;
        this.reporters = {};
    }
    async run(categories = constants_1.RISK_CATEGORIES, daysAbandonedWorkflow) {
        if (categories.length === 0)
            categories = constants_1.RISK_CATEGORIES;
        await this.initReporters(categories);
        const daysFromEnv = this.securityConfig.daysAbandonedWorkflow;
        if (daysAbandonedWorkflow) {
            config_2.default.set('security.audit.daysAbandonedWorkflow', daysAbandonedWorkflow);
        }
        const workflows = await this.workflowRepository.find({
            select: ['id', 'name', 'active', 'nodes', 'connections'],
        });
        const promises = categories.map(async (c) => await this.reporters[c].report(workflows));
        const reports = (await Promise.all(promises)).filter((r) => r !== null);
        if (daysAbandonedWorkflow) {
            config_2.default.set('security.audit.daysAbandonedWorkflow', daysFromEnv);
        }
        if (reports.length === 0)
            return [];
        return reports.reduce((acc, cur) => {
            acc[(0, utils_1.toReportTitle)(cur.risk)] = cur;
            return acc;
        }, {});
    }
    async initReporters(categories) {
        for (const category of categories) {
            const className = category.charAt(0).toUpperCase() + category.slice(1) + 'RiskReporter';
            const toFilename = {
                CredentialsRiskReporter: 'credentials-risk-reporter',
                DatabaseRiskReporter: 'database-risk-reporter',
                FilesystemRiskReporter: 'filesystem-risk-reporter',
                InstanceRiskReporter: 'instance-risk-reporter',
                NodesRiskReporter: 'nodes-risk-reporter',
            };
            const RiskReporterModule = await Promise.resolve(`${`./risk-reporters/${toFilename[className]}`}`).then(s => __importStar(require(s)));
            const RiskReporterClass = RiskReporterModule[className];
            this.reporters[category] = typedi_1.default.get(RiskReporterClass);
        }
    }
};
exports.SecurityAuditService = SecurityAuditService;
exports.SecurityAuditService = SecurityAuditService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [workflow_repository_1.WorkflowRepository,
        config_1.SecurityConfig])
], SecurityAuditService);
//# sourceMappingURL=security-audit.service.js.map