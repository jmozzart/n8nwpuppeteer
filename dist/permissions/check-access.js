"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userHasScopes = userHasScopes;
const typeorm_1 = require("@n8n/typeorm");
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const project_repository_1 = require("../databases/repositories/project.repository");
const shared_credentials_repository_1 = require("../databases/repositories/shared-credentials.repository");
const shared_workflow_repository_1 = require("../databases/repositories/shared-workflow.repository");
const role_service_1 = require("../services/role.service");
async function userHasScopes(user, scopes, globalOnly, { credentialId, workflowId, projectId, }) {
    if (user.hasGlobalScope(scopes, { mode: 'allOf' }))
        return true;
    if (globalOnly)
        return false;
    const roleService = typedi_1.Container.get(role_service_1.RoleService);
    const projectRoles = roleService.rolesWithScope('project', scopes);
    const userProjectIds = (await typedi_1.Container.get(project_repository_1.ProjectRepository).find({
        where: {
            projectRelations: {
                userId: user.id,
                role: (0, typeorm_1.In)(projectRoles),
            },
        },
        select: ['id'],
    })).map((p) => p.id);
    if (credentialId) {
        return await typedi_1.Container.get(shared_credentials_repository_1.SharedCredentialsRepository).existsBy({
            credentialsId: credentialId,
            projectId: (0, typeorm_1.In)(userProjectIds),
            role: (0, typeorm_1.In)(roleService.rolesWithScope('credential', scopes)),
        });
    }
    if (workflowId) {
        return await typedi_1.Container.get(shared_workflow_repository_1.SharedWorkflowRepository).existsBy({
            workflowId,
            projectId: (0, typeorm_1.In)(userProjectIds),
            role: (0, typeorm_1.In)(roleService.rolesWithScope('workflow', scopes)),
        });
    }
    if (projectId)
        return userProjectIds.includes(projectId);
    throw new n8n_workflow_1.ApplicationError("`@ProjectScope` decorator was used but does not have a `credentialId`, `workflowId`, or `projectId` in its URL parameters. This is likely an implementation error. If you're a developer, please check your URL is correct or that this should be using `@GlobalScope`.");
}
//# sourceMappingURL=check-access.js.map