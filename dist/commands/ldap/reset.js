"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reset = void 0;
const typeorm_1 = require("@n8n/typeorm");
const core_1 = require("@oclif/core");
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = __importDefault(require("typedi"));
const constants_1 = require("../../constants");
const credentials_service_1 = require("../../credentials/credentials.service");
const auth_identity_repository_1 = require("../../databases/repositories/auth-identity.repository");
const auth_provider_sync_history_repository_1 = require("../../databases/repositories/auth-provider-sync-history.repository");
const project_relation_repository_1 = require("../../databases/repositories/project-relation.repository");
const project_repository_1 = require("../../databases/repositories/project.repository");
const settings_repository_1 = require("../../databases/repositories/settings.repository");
const shared_credentials_repository_1 = require("../../databases/repositories/shared-credentials.repository");
const shared_workflow_repository_1 = require("../../databases/repositories/shared-workflow.repository");
const user_repository_1 = require("../../databases/repositories/user.repository");
const constants_2 = require("../../ldap/constants");
const workflow_service_1 = require("../../workflows/workflow.service");
const base_command_1 = require("../base-command");
const wrongFlagsError = 'You must use exactly one of `--userId`, `--projectId` or `--deleteWorkflowsAndCredentials`.';
class Reset extends base_command_1.BaseCommand {
    async run() {
        const { flags } = await this.parse(Reset);
        const numberOfOptions = Number(!!flags.userId) +
            Number(!!flags.projectId) +
            Number(!!flags.deleteWorkflowsAndCredentials);
        if (numberOfOptions !== 1) {
            throw new n8n_workflow_1.ApplicationError(wrongFlagsError);
        }
        const owner = await this.getOwner();
        const ldapIdentities = await typedi_1.default.get(auth_identity_repository_1.AuthIdentityRepository).find({
            where: { providerType: 'ldap' },
            select: ['userId'],
        });
        const personalProjectIds = await typedi_1.default.get(project_relation_repository_1.ProjectRelationRepository).getPersonalProjectsForUsers(ldapIdentities.map((i) => i.userId));
        if (flags.projectId ?? flags.userId) {
            if (flags.userId && ldapIdentities.some((i) => i.userId === flags.userId)) {
                throw new n8n_workflow_1.ApplicationError(`Can't migrate workflows and credentials to the user with the ID ${flags.userId}. That user was created via LDAP and will be deleted as well.`);
            }
            if (flags.projectId && personalProjectIds.includes(flags.projectId)) {
                throw new n8n_workflow_1.ApplicationError(`Can't migrate workflows and credentials to the project with the ID ${flags.projectId}. That project is a personal project belonging to a user that was created via LDAP and will be deleted as well.`);
            }
            const project = await this.getProject(flags.userId, flags.projectId);
            await typedi_1.default.get(user_repository_1.UserRepository).manager.transaction(async (trx) => {
                for (const projectId of personalProjectIds) {
                    await typedi_1.default.get(workflow_service_1.WorkflowService).transferAll(projectId, project.id, trx);
                    await typedi_1.default.get(credentials_service_1.CredentialsService).transferAll(projectId, project.id, trx);
                }
            });
        }
        const [ownedSharedWorkflows, ownedSharedCredentials] = await Promise.all([
            typedi_1.default.get(shared_workflow_repository_1.SharedWorkflowRepository).find({
                select: { workflowId: true },
                where: { projectId: (0, typeorm_1.In)(personalProjectIds), role: 'workflow:owner' },
            }),
            typedi_1.default.get(shared_credentials_repository_1.SharedCredentialsRepository).find({
                relations: { credentials: true },
                where: { projectId: (0, typeorm_1.In)(personalProjectIds), role: 'credential:owner' },
            }),
        ]);
        const ownedCredentials = ownedSharedCredentials.map(({ credentials }) => credentials);
        for (const { workflowId } of ownedSharedWorkflows) {
            await typedi_1.default.get(workflow_service_1.WorkflowService).delete(owner, workflowId);
        }
        for (const credential of ownedCredentials) {
            await typedi_1.default.get(credentials_service_1.CredentialsService).delete(credential);
        }
        await typedi_1.default.get(auth_provider_sync_history_repository_1.AuthProviderSyncHistoryRepository).delete({ providerType: 'ldap' });
        await typedi_1.default.get(auth_identity_repository_1.AuthIdentityRepository).delete({ providerType: 'ldap' });
        await typedi_1.default.get(user_repository_1.UserRepository).deleteMany(ldapIdentities.map((i) => i.userId));
        await typedi_1.default.get(project_repository_1.ProjectRepository).delete({ id: (0, typeorm_1.In)(personalProjectIds) });
        await typedi_1.default.get(settings_repository_1.SettingsRepository).delete({ key: constants_2.LDAP_FEATURE_NAME });
        await typedi_1.default.get(settings_repository_1.SettingsRepository).insert({
            key: constants_2.LDAP_FEATURE_NAME,
            value: JSON.stringify(constants_2.LDAP_DEFAULT_CONFIGURATION),
            loadOnStartup: true,
        });
        this.logger.info('Successfully reset the database to default ldap state.');
    }
    async getProject(userId, projectId) {
        if (projectId) {
            const project = await typedi_1.default.get(project_repository_1.ProjectRepository).findOneBy({ id: projectId });
            if (project === null) {
                throw new n8n_workflow_1.ApplicationError(`Could not find the project with the ID ${projectId}.`);
            }
            return project;
        }
        if (userId) {
            const project = await typedi_1.default.get(project_repository_1.ProjectRepository).getPersonalProjectForUser(userId);
            if (project === null) {
                throw new n8n_workflow_1.ApplicationError(`Could not find the user with the ID ${userId} or their personalProject.`);
            }
            return project;
        }
        throw new n8n_workflow_1.ApplicationError(wrongFlagsError);
    }
    async catch(error) {
        this.logger.error('Error resetting database. See log messages for details.');
        this.logger.error(error.message);
    }
    async getOwner() {
        const owner = await typedi_1.default.get(user_repository_1.UserRepository).findOneBy({ role: 'global:owner' });
        if (!owner) {
            throw new n8n_workflow_1.ApplicationError(`Failed to find owner. ${constants_1.UM_FIX_INSTRUCTION}`);
        }
        return owner;
    }
}
exports.Reset = Reset;
Reset.description = '\nResets the database to the default ldap state.\n\nTHIS DELETES ALL LDAP MANAGED USERS.';
Reset.examples = [
    '$ n8n ldap:reset --userId=1d64c3d2-85fe-4a83-a649-e446b07b3aae',
    '$ n8n ldap:reset --projectId=Ox8O54VQrmBrb4qL',
    '$ n8n ldap:reset --deleteWorkflowsAndCredentials',
];
Reset.flags = {
    help: core_1.Flags.help({ char: 'h' }),
    userId: core_1.Flags.string({
        description: 'The ID of the user to assign the workflows and credentials owned by the deleted LDAP users to',
    }),
    projectId: core_1.Flags.string({
        description: 'The ID of the project to assign the workflows and credentials owned by the deleted LDAP users to',
    }),
    deleteWorkflowsAndCredentials: core_1.Flags.boolean({
        description: 'Delete all workflows and credentials owned by the users that were created by the users managed via LDAP.',
    }),
};
//# sourceMappingURL=reset.js.map