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
exports.UserOnboardingService = void 0;
const typeorm_1 = require("@n8n/typeorm");
const typedi_1 = require("typedi");
const shared_workflow_repository_1 = require("../databases/repositories/shared-workflow.repository");
const workflow_repository_1 = require("../databases/repositories/workflow.repository");
const user_service_1 = require("../services/user.service");
let UserOnboardingService = class UserOnboardingService {
    constructor(sharedWorkflowRepository, workflowRepository, userService) {
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.workflowRepository = workflowRepository;
        this.userService = userService;
    }
    async isBelowThreshold(user) {
        let belowThreshold = true;
        const skippedTypes = ['n8n-nodes-base.start', 'n8n-nodes-base.stickyNote'];
        const ownedWorkflowsIds = await this.sharedWorkflowRepository
            .find({
            where: {
                project: {
                    projectRelations: {
                        role: 'project:personalOwner',
                        userId: user.id,
                    },
                },
                role: 'workflow:owner',
            },
            select: ['workflowId'],
        })
            .then((ownedWorkflows) => ownedWorkflows.map(({ workflowId }) => workflowId));
        if (ownedWorkflowsIds.length > 15) {
            belowThreshold = false;
        }
        else {
            const workflows = await this.workflowRepository.find({
                where: { id: (0, typeorm_1.In)(ownedWorkflowsIds) },
                select: ['nodes'],
            });
            const validWorkflowCount = workflows.reduce((counter, workflow) => {
                if (counter <= 2 && workflow.nodes.length > 2) {
                    const nodes = workflow.nodes.filter((node) => !skippedTypes.includes(node.type));
                    if (nodes.length >= 2) {
                        return counter + 1;
                    }
                }
                return counter;
            }, 0);
            belowThreshold = validWorkflowCount <= 2;
        }
        if (!belowThreshold) {
            void this.userService.updateSettings(user.id, { isOnboarded: true });
        }
        return belowThreshold;
    }
};
exports.UserOnboardingService = UserOnboardingService;
exports.UserOnboardingService = UserOnboardingService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [shared_workflow_repository_1.SharedWorkflowRepository,
        workflow_repository_1.WorkflowRepository,
        user_service_1.UserService])
], UserOnboardingService);
//# sourceMappingURL=user-onboarding.service.js.map