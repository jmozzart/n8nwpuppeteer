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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCredentials = getCredentials;
exports.getSharedCredentials = getSharedCredentials;
exports.createCredential = createCredential;
exports.saveCredential = saveCredential;
exports.removeCredential = removeCredential;
exports.encryptCredential = encryptCredential;
exports.sanitizeCredentials = sanitizeCredentials;
exports.toJsonSchema = toJsonSchema;
const n8n_core_1 = require("n8n-core");
const typedi_1 = require("typedi");
const credentials_entity_1 = require("../../../../databases/entities/credentials-entity");
const shared_credentials_1 = require("../../../../databases/entities/shared-credentials");
const credentials_repository_1 = require("../../../../databases/repositories/credentials.repository");
const project_repository_1 = require("../../../../databases/repositories/project.repository");
const shared_credentials_repository_1 = require("../../../../databases/repositories/shared-credentials.repository");
const Db = __importStar(require("../../../../db"));
const event_service_1 = require("../../../../events/event.service");
const external_hooks_1 = require("../../../../external-hooks");
async function getCredentials(credentialId) {
    return await typedi_1.Container.get(credentials_repository_1.CredentialsRepository).findOneBy({ id: credentialId });
}
async function getSharedCredentials(userId, credentialId) {
    return await typedi_1.Container.get(shared_credentials_repository_1.SharedCredentialsRepository).findOne({
        where: {
            project: { projectRelations: { userId } },
            credentialsId: credentialId,
        },
        relations: ['credentials'],
    });
}
async function createCredential(properties) {
    const newCredential = new credentials_entity_1.CredentialsEntity();
    Object.assign(newCredential, properties);
    return newCredential;
}
async function saveCredential(credential, user, encryptedData) {
    const result = await Db.transaction(async (transactionManager) => {
        const savedCredential = await transactionManager.save(credential);
        savedCredential.data = credential.data;
        const newSharedCredential = new shared_credentials_1.SharedCredentials();
        const personalProject = await typedi_1.Container.get(project_repository_1.ProjectRepository).getPersonalProjectForUserOrFail(user.id, transactionManager);
        Object.assign(newSharedCredential, {
            role: 'credential:owner',
            credentials: savedCredential,
            projectId: personalProject.id,
        });
        await transactionManager.save(newSharedCredential);
        return savedCredential;
    });
    await typedi_1.Container.get(external_hooks_1.ExternalHooks).run('credentials.create', [encryptedData]);
    const project = await typedi_1.Container.get(shared_credentials_repository_1.SharedCredentialsRepository).findCredentialOwningProject(credential.id);
    typedi_1.Container.get(event_service_1.EventService).emit('credentials-created', {
        user,
        credentialType: credential.type,
        credentialId: credential.id,
        projectId: project?.id,
        projectType: project?.type,
        publicApi: true,
    });
    return result;
}
async function removeCredential(user, credentials) {
    await typedi_1.Container.get(external_hooks_1.ExternalHooks).run('credentials.delete', [credentials.id]);
    typedi_1.Container.get(event_service_1.EventService).emit('credentials-deleted', {
        user,
        credentialType: credentials.type,
        credentialId: credentials.id,
    });
    return await typedi_1.Container.get(credentials_repository_1.CredentialsRepository).remove(credentials);
}
async function encryptCredential(credential) {
    const coreCredential = new n8n_core_1.Credentials({ id: null, name: credential.name }, credential.type);
    coreCredential.setData(credential.data);
    return coreCredential.getDataToSave();
}
function sanitizeCredentials(credentials) {
    const argIsArray = Array.isArray(credentials);
    const credentialsList = argIsArray ? credentials : [credentials];
    const sanitizedCredentials = credentialsList.map((credential) => {
        const { data, shared, ...rest } = credential;
        return rest;
    });
    return argIsArray ? sanitizedCredentials : sanitizedCredentials[0];
}
function toJsonSchema(properties) {
    const jsonSchema = {
        additionalProperties: false,
        type: 'object',
        properties: {},
        allOf: [],
        required: [],
    };
    const optionsValues = {};
    const resolveProperties = [];
    properties
        .filter((property) => property.type === 'options')
        .forEach((property) => {
        Object.assign(optionsValues, {
            [property.name]: property.options?.map((option) => option.value),
        });
    });
    let requiredFields = [];
    const propertyRequiredDependencies = {};
    properties.forEach((property) => {
        if (property.required) {
            requiredFields.push(property.name);
        }
        if (property.type === 'options') {
            Object.assign(jsonSchema.properties, {
                [property.name]: {
                    type: 'string',
                    enum: property.options?.map((data) => data.value),
                },
            });
        }
        else {
            Object.assign(jsonSchema.properties, {
                [property.name]: {
                    type: property.type,
                },
            });
        }
        if (property.displayOptions?.show) {
            const dependantName = Object.keys(property.displayOptions?.show)[0] || '';
            const displayOptionsValues = property.displayOptions.show[dependantName];
            let dependantValue = '';
            if (displayOptionsValues && Array.isArray(displayOptionsValues) && displayOptionsValues[0]) {
                dependantValue = displayOptionsValues[0];
            }
            if (propertyRequiredDependencies[dependantName] === undefined) {
                propertyRequiredDependencies[dependantName] = {};
            }
            if (!resolveProperties.includes(dependantName)) {
                let conditionalValue;
                if (typeof dependantValue === 'object' && dependantValue._cnd) {
                    const [key, targetValue] = Object.entries(dependantValue._cnd)[0];
                    if (key === 'eq') {
                        conditionalValue = {
                            const: [targetValue],
                        };
                    }
                    else if (key === 'not') {
                        conditionalValue = {
                            not: {
                                const: [targetValue],
                            },
                        };
                    }
                    else if (key === 'gt') {
                        conditionalValue = {
                            type: 'number',
                            exclusiveMinimum: [targetValue],
                        };
                    }
                    else if (key === 'gte') {
                        conditionalValue = {
                            type: 'number',
                            minimum: [targetValue],
                        };
                    }
                    else if (key === 'lt') {
                        conditionalValue = {
                            type: 'number',
                            exclusiveMaximum: [targetValue],
                        };
                    }
                    else if (key === 'lte') {
                        conditionalValue = {
                            type: 'number',
                            maximum: [targetValue],
                        };
                    }
                    else if (key === 'startsWith') {
                        conditionalValue = {
                            type: 'string',
                            pattern: `^${targetValue}`,
                        };
                    }
                    else if (key === 'endsWith') {
                        conditionalValue = {
                            type: 'string',
                            pattern: `${targetValue}$`,
                        };
                    }
                    else if (key === 'includes') {
                        conditionalValue = {
                            type: 'string',
                            pattern: `${targetValue}`,
                        };
                    }
                    else if (key === 'regex') {
                        conditionalValue = {
                            type: 'string',
                            pattern: `${targetValue}`,
                        };
                    }
                    else {
                        conditionalValue = {
                            enum: [dependantValue],
                        };
                    }
                }
                else {
                    conditionalValue = {
                        enum: [dependantValue],
                    };
                }
                propertyRequiredDependencies[dependantName] = {
                    if: {
                        properties: {
                            [dependantName]: conditionalValue,
                        },
                    },
                    then: {
                        allOf: [],
                    },
                    else: {
                        allOf: [],
                    },
                };
            }
            propertyRequiredDependencies[dependantName].then?.allOf.push({ required: [property.name] });
            propertyRequiredDependencies[dependantName].else?.allOf.push({
                not: { required: [property.name] },
            });
            resolveProperties.push(dependantName);
            requiredFields = requiredFields.filter((field) => field !== property.name);
        }
    });
    Object.assign(jsonSchema, { required: requiredFields });
    jsonSchema.allOf = Object.values(propertyRequiredDependencies);
    if (!jsonSchema.allOf.length) {
        delete jsonSchema.allOf;
    }
    return jsonSchema;
}
//# sourceMappingURL=credentials.service.js.map