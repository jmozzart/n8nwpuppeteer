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
exports.CollaborationService = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const collaboration_state_1 = require("../collaboration/collaboration.state");
const user_repository_1 = require("../databases/repositories/user.repository");
const push_1 = require("../push");
const access_service_1 = require("../services/access.service");
const collaboration_message_1 = require("./collaboration.message");
let CollaborationService = class CollaborationService {
    constructor(push, state, userRepository, accessService) {
        this.push = push;
        this.state = state;
        this.userRepository = userRepository;
        this.accessService = accessService;
    }
    init() {
        this.push.on('message', async (event) => {
            try {
                await this.handleUserMessage(event.userId, event.msg);
            }
            catch (error) {
                n8n_workflow_1.ErrorReporterProxy.error(new n8n_workflow_1.ApplicationError('Error handling CollaborationService push message', {
                    extra: {
                        msg: event.msg,
                        userId: event.userId,
                    },
                    cause: error,
                }));
            }
        });
    }
    async handleUserMessage(userId, msg) {
        const workflowMessage = await (0, collaboration_message_1.parseWorkflowMessage)(msg);
        if (workflowMessage.type === 'workflowOpened') {
            await this.handleWorkflowOpened(userId, workflowMessage);
        }
        else if (workflowMessage.type === 'workflowClosed') {
            await this.handleWorkflowClosed(userId, workflowMessage);
        }
    }
    async handleWorkflowOpened(userId, msg) {
        const { workflowId } = msg;
        if (!(await this.accessService.hasReadAccess(userId, workflowId))) {
            return;
        }
        await this.state.addCollaborator(workflowId, userId);
        await this.sendWorkflowUsersChangedMessage(workflowId);
    }
    async handleWorkflowClosed(userId, msg) {
        const { workflowId } = msg;
        if (!(await this.accessService.hasReadAccess(userId, workflowId))) {
            return;
        }
        await this.state.removeCollaborator(workflowId, userId);
        await this.sendWorkflowUsersChangedMessage(workflowId);
    }
    async sendWorkflowUsersChangedMessage(workflowId) {
        const collaborators = await this.state.getCollaborators(workflowId);
        const userIds = collaborators.map((user) => user.userId);
        if (userIds.length === 0) {
            return;
        }
        const users = await this.userRepository.getByIds(this.userRepository.manager, userIds);
        const activeCollaborators = users.map((user) => ({
            user: user.toIUser(),
            lastSeen: collaborators.find(({ userId }) => userId === user.id).lastSeen,
        }));
        const msgData = {
            workflowId,
            collaborators: activeCollaborators,
        };
        this.push.sendToUsers('collaboratorsChanged', msgData, userIds);
    }
};
exports.CollaborationService = CollaborationService;
exports.CollaborationService = CollaborationService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [push_1.Push,
        collaboration_state_1.CollaborationState,
        user_repository_1.UserRepository,
        access_service_1.AccessService])
], CollaborationService);
//# sourceMappingURL=collaboration.service.js.map