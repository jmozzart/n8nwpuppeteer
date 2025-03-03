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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportCredentialsCommand = void 0;
const core_1 = require("@oclif/core");
const fast_glob_1 = __importDefault(require("fast-glob"));
const fs_1 = __importDefault(require("fs"));
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const constants_1 = require("../../constants");
const credentials_entity_1 = require("../../databases/entities/credentials-entity");
const project_1 = require("../../databases/entities/project");
const shared_credentials_1 = require("../../databases/entities/shared-credentials");
const user_1 = require("../../databases/entities/user");
const project_repository_1 = require("../../databases/repositories/project.repository");
const Db = __importStar(require("../../db"));
const base_command_1 = require("../base-command");
class ImportCredentialsCommand extends base_command_1.BaseCommand {
    async run() {
        const { flags } = await this.parse(ImportCredentialsCommand);
        if (!flags.input) {
            this.logger.info('An input file or directory with --input must be provided');
            return;
        }
        if (flags.separate) {
            if (fs_1.default.existsSync(flags.input)) {
                if (!fs_1.default.lstatSync(flags.input).isDirectory()) {
                    this.logger.info('The argument to --input must be a directory');
                    return;
                }
            }
        }
        if (flags.projectId && flags.userId) {
            throw new n8n_workflow_1.ApplicationError('You cannot use `--userId` and `--projectId` together. Use one or the other.');
        }
        const credentials = await this.readCredentials(flags.input, flags.separate);
        await Db.getConnection().transaction(async (transactionManager) => {
            this.transactionManager = transactionManager;
            const project = await this.getProject(flags.userId, flags.projectId);
            const result = await this.checkRelations(credentials, flags.projectId, flags.userId);
            if (!result.success) {
                throw new n8n_workflow_1.ApplicationError(result.message);
            }
            for (const credential of credentials) {
                await this.storeCredential(credential, project);
            }
        });
        this.reportSuccess(credentials.length);
    }
    async catch(error) {
        this.logger.error('An error occurred while importing credentials. See log messages for details.');
        this.logger.error(error.message);
    }
    reportSuccess(total) {
        this.logger.info(`Successfully imported ${total} ${total === 1 ? 'credential.' : 'credentials.'}`);
    }
    async storeCredential(credential, project) {
        const result = await this.transactionManager.upsert(credentials_entity_1.CredentialsEntity, credential, ['id']);
        const sharingExists = await this.transactionManager.existsBy(shared_credentials_1.SharedCredentials, {
            credentialsId: credential.id,
            role: 'credential:owner',
        });
        if (!sharingExists) {
            await this.transactionManager.upsert(shared_credentials_1.SharedCredentials, {
                credentialsId: result.identifiers[0].id,
                role: 'credential:owner',
                projectId: project.id,
            }, ['credentialsId', 'projectId']);
        }
    }
    async checkRelations(credentials, projectId, userId) {
        if (!projectId && !userId) {
            return {
                success: true,
                message: undefined,
            };
        }
        for (const credential of credentials) {
            if (credential.id === undefined) {
                continue;
            }
            if (!(await this.credentialExists(credential.id))) {
                continue;
            }
            const { user, project: ownerProject } = await this.getCredentialOwner(credential.id);
            if (!ownerProject) {
                continue;
            }
            if (ownerProject.id !== projectId) {
                const currentOwner = ownerProject.type === 'personal'
                    ? `the user with the ID "${user.id}"`
                    : `the project with the ID "${ownerProject.id}"`;
                const newOwner = userId
                    ?
                        `the user with the ID "${userId}"`
                    : `the project with the ID "${projectId}"`;
                return {
                    success: false,
                    message: `The credential with ID "${credential.id}" is already owned by ${currentOwner}. It can't be re-owned by ${newOwner}.`,
                };
            }
        }
        return {
            success: true,
            message: undefined,
        };
    }
    async readCredentials(path, separate) {
        const cipher = typedi_1.Container.get(n8n_core_1.Cipher);
        if (process.platform === 'win32') {
            path = path.replace(/\\/g, '/');
        }
        let credentials;
        if (separate) {
            const files = await (0, fast_glob_1.default)('*.json', {
                cwd: path,
                absolute: true,
            });
            credentials = files.map((file) => (0, n8n_workflow_1.jsonParse)(fs_1.default.readFileSync(file, { encoding: 'utf8' })));
        }
        else {
            const credentialsUnchecked = (0, n8n_workflow_1.jsonParse)(fs_1.default.readFileSync(path, { encoding: 'utf8' }));
            if (!Array.isArray(credentialsUnchecked)) {
                throw new n8n_workflow_1.ApplicationError('File does not seem to contain credentials. Make sure the credentials are contained in an array.');
            }
            credentials = credentialsUnchecked;
        }
        return credentials.map((credential) => {
            if (typeof credential.data === 'object') {
                credential.data = cipher.encrypt(credential.data);
            }
            return credential;
        });
    }
    async getCredentialOwner(credentialsId) {
        const sharedCredential = await this.transactionManager.findOne(shared_credentials_1.SharedCredentials, {
            where: { credentialsId, role: 'credential:owner' },
            relations: { project: true },
        });
        if (sharedCredential && sharedCredential.project.type === 'personal') {
            const user = await this.transactionManager.findOneByOrFail(user_1.User, {
                projectRelations: {
                    role: 'project:personalOwner',
                    projectId: sharedCredential.projectId,
                },
            });
            return { user, project: sharedCredential.project };
        }
        return {};
    }
    async credentialExists(credentialId) {
        return await this.transactionManager.existsBy(credentials_entity_1.CredentialsEntity, { id: credentialId });
    }
    async getProject(userId, projectId) {
        if (projectId) {
            return await this.transactionManager.findOneByOrFail(project_1.Project, { id: projectId });
        }
        if (!userId) {
            const owner = await this.transactionManager.findOneBy(user_1.User, { role: 'global:owner' });
            if (!owner) {
                throw new n8n_workflow_1.ApplicationError(`Failed to find owner. ${constants_1.UM_FIX_INSTRUCTION}`);
            }
            userId = owner.id;
        }
        return await typedi_1.Container.get(project_repository_1.ProjectRepository).getPersonalProjectForUserOrFail(userId, this.transactionManager);
    }
}
exports.ImportCredentialsCommand = ImportCredentialsCommand;
ImportCredentialsCommand.description = 'Import credentials';
ImportCredentialsCommand.examples = [
    '$ n8n import:credentials --input=file.json',
    '$ n8n import:credentials --separate --input=backups/latest/',
    '$ n8n import:credentials --input=file.json --userId=1d64c3d2-85fe-4a83-a649-e446b07b3aae',
    '$ n8n import:credentials --input=file.json --projectId=Ox8O54VQrmBrb4qL',
    '$ n8n import:credentials --separate --input=backups/latest/ --userId=1d64c3d2-85fe-4a83-a649-e446b07b3aae',
];
ImportCredentialsCommand.flags = {
    help: core_1.Flags.help({ char: 'h' }),
    input: core_1.Flags.string({
        char: 'i',
        description: 'Input file name or directory if --separate is used',
    }),
    separate: core_1.Flags.boolean({
        description: 'Imports *.json files from directory provided by --input',
    }),
    userId: core_1.Flags.string({
        description: 'The ID of the user to assign the imported credentials to',
    }),
    projectId: core_1.Flags.string({
        description: 'The ID of the project to assign the imported credential to',
    }),
};
//# sourceMappingURL=credentials.js.map