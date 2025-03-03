"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reset = void 0;
const typedi_1 = require("typedi");
const user_1 = require("../../databases/entities/user");
const credentials_repository_1 = require("../../databases/repositories/credentials.repository");
const project_repository_1 = require("../../databases/repositories/project.repository");
const settings_repository_1 = require("../../databases/repositories/settings.repository");
const shared_credentials_repository_1 = require("../../databases/repositories/shared-credentials.repository");
const shared_workflow_repository_1 = require("../../databases/repositories/shared-workflow.repository");
const user_repository_1 = require("../../databases/repositories/user.repository");
const base_command_1 = require("../base-command");
const defaultUserProps = {
    firstName: null,
    lastName: null,
    email: null,
    password: null,
    role: 'global:owner',
};
class Reset extends base_command_1.BaseCommand {
    async run() {
        const owner = await this.getInstanceOwner();
        const personalProject = await typedi_1.Container.get(project_repository_1.ProjectRepository).getPersonalProjectForUserOrFail(owner.id);
        await typedi_1.Container.get(shared_workflow_repository_1.SharedWorkflowRepository).makeOwnerOfAllWorkflows(personalProject);
        await typedi_1.Container.get(shared_credentials_repository_1.SharedCredentialsRepository).makeOwnerOfAllCredentials(personalProject);
        await typedi_1.Container.get(user_repository_1.UserRepository).deleteAllExcept(owner);
        await typedi_1.Container.get(user_repository_1.UserRepository).save(Object.assign(owner, defaultUserProps));
        const danglingCredentials = await typedi_1.Container.get(credentials_repository_1.CredentialsRepository)
            .createQueryBuilder('credentials')
            .leftJoinAndSelect('credentials.shared', 'shared')
            .where('shared.credentialsId is null')
            .getMany();
        const newSharedCredentials = danglingCredentials.map((credentials) => typedi_1.Container.get(shared_credentials_repository_1.SharedCredentialsRepository).create({
            credentials,
            projectId: personalProject.id,
            role: 'credential:owner',
        }));
        await typedi_1.Container.get(shared_credentials_repository_1.SharedCredentialsRepository).save(newSharedCredentials);
        await typedi_1.Container.get(settings_repository_1.SettingsRepository).update({ key: 'userManagement.isInstanceOwnerSetUp' }, { value: 'false' });
        this.logger.info('Successfully reset the database to default user state.');
    }
    async getInstanceOwner() {
        const owner = await typedi_1.Container.get(user_repository_1.UserRepository).findOneBy({ role: 'global:owner' });
        if (owner)
            return owner;
        const user = new user_1.User();
        Object.assign(user, defaultUserProps);
        await typedi_1.Container.get(user_repository_1.UserRepository).save(user);
        return await typedi_1.Container.get(user_repository_1.UserRepository).findOneByOrFail({ role: 'global:owner' });
    }
    async catch(error) {
        this.logger.error('Error resetting database. See log messages for details.');
        this.logger.error(error.message);
        this.exit(1);
    }
}
exports.Reset = Reset;
Reset.description = 'Resets the database to the default user state';
Reset.examples = ['$ n8n user-management:reset'];
//# sourceMappingURL=reset.js.map