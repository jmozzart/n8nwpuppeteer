"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSamlPreferences = void 0;
exports.isSamlLoginEnabled = isSamlLoginEnabled;
exports.getSamlLoginLabel = getSamlLoginLabel;
exports.setSamlLoginEnabled = setSamlLoginEnabled;
exports.setSamlLoginLabel = setSamlLoginLabel;
exports.isSamlLicensed = isSamlLicensed;
exports.isSamlLicensedAndEnabled = isSamlLicensedAndEnabled;
exports.createUserFromSamlAttributes = createUserFromSamlAttributes;
exports.updateUserFromSamlAttributes = updateUserFromSamlAttributes;
exports.getMappedSamlAttributesFromFlowResult = getMappedSamlAttributesFromFlowResult;
exports.isConnectionTestRequest = isConnectionTestRequest;
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const config_1 = __importDefault(require("../../config"));
const auth_identity_1 = require("../../databases/entities/auth-identity");
const auth_identity_repository_1 = require("../../databases/repositories/auth-identity.repository");
const user_repository_1 = require("../../databases/repositories/user.repository");
const auth_error_1 = require("../../errors/response-errors/auth.error");
const internal_server_error_1 = require("../../errors/response-errors/internal-server.error");
const license_1 = require("../../license");
const password_utility_1 = require("../../services/password.utility");
const constants_1 = require("./constants");
const service_provider_ee_1 = require("./service-provider.ee");
const sso_helpers_1 = require("../sso-helpers");
function isSamlLoginEnabled() {
    return config_1.default.getEnv(constants_1.SAML_LOGIN_ENABLED);
}
function getSamlLoginLabel() {
    return config_1.default.getEnv(constants_1.SAML_LOGIN_LABEL);
}
async function setSamlLoginEnabled(enabled) {
    if ((0, sso_helpers_1.isEmailCurrentAuthenticationMethod)() || (0, sso_helpers_1.isSamlCurrentAuthenticationMethod)()) {
        if (enabled) {
            config_1.default.set(constants_1.SAML_LOGIN_ENABLED, true);
            await (0, sso_helpers_1.setCurrentAuthenticationMethod)('saml');
        }
        else if (!enabled) {
            config_1.default.set(constants_1.SAML_LOGIN_ENABLED, false);
            await (0, sso_helpers_1.setCurrentAuthenticationMethod)('email');
        }
    }
    else {
        throw new internal_server_error_1.InternalServerError(`Cannot switch SAML login enabled state when an authentication method other than email or saml is active (current: ${(0, sso_helpers_1.getCurrentAuthenticationMethod)()})`);
    }
}
function setSamlLoginLabel(label) {
    config_1.default.set(constants_1.SAML_LOGIN_LABEL, label);
}
function isSamlLicensed() {
    return typedi_1.Container.get(license_1.License).isSamlEnabled();
}
function isSamlLicensedAndEnabled() {
    return isSamlLoginEnabled() && isSamlLicensed() && (0, sso_helpers_1.isSamlCurrentAuthenticationMethod)();
}
const isSamlPreferences = (candidate) => {
    const o = candidate;
    return (typeof o === 'object' &&
        typeof o.metadata === 'string' &&
        typeof o.mapping === 'object' &&
        o.mapping !== null &&
        o.loginEnabled !== undefined);
};
exports.isSamlPreferences = isSamlPreferences;
async function createUserFromSamlAttributes(attributes) {
    const randomPassword = (0, n8n_workflow_1.randomString)(18);
    const userRepository = typedi_1.Container.get(user_repository_1.UserRepository);
    return await userRepository.manager.transaction(async (trx) => {
        const { user } = await userRepository.createUserWithProject({
            email: attributes.email.toLowerCase(),
            firstName: attributes.firstName,
            lastName: attributes.lastName,
            role: 'global:member',
            password: await typedi_1.Container.get(password_utility_1.PasswordUtility).hash(randomPassword),
        }, trx);
        await trx.save(trx.create(auth_identity_1.AuthIdentity, {
            providerId: attributes.userPrincipalName,
            providerType: 'saml',
            userId: user.id,
        }));
        return user;
    });
}
async function updateUserFromSamlAttributes(user, attributes) {
    if (!attributes.email)
        throw new auth_error_1.AuthError('Email is required to update user');
    if (!user)
        throw new auth_error_1.AuthError('User not found');
    let samlAuthIdentity = user?.authIdentities.find((e) => e.providerType === 'saml');
    if (!samlAuthIdentity) {
        samlAuthIdentity = new auth_identity_1.AuthIdentity();
        samlAuthIdentity.providerId = attributes.userPrincipalName;
        samlAuthIdentity.providerType = 'saml';
        samlAuthIdentity.user = user;
        user.authIdentities.push(samlAuthIdentity);
    }
    else {
        samlAuthIdentity.providerId = attributes.userPrincipalName;
    }
    await typedi_1.Container.get(auth_identity_repository_1.AuthIdentityRepository).save(samlAuthIdentity, { transaction: false });
    user.firstName = attributes.firstName;
    user.lastName = attributes.lastName;
    const resultUser = await typedi_1.Container.get(user_repository_1.UserRepository).save(user, { transaction: false });
    if (!resultUser)
        throw new auth_error_1.AuthError('Could not create User');
    return resultUser;
}
function getMappedSamlAttributesFromFlowResult(flowResult, attributeMapping) {
    const result = {
        attributes: undefined,
        missingAttributes: [],
    };
    if (flowResult?.extract?.attributes) {
        const attributes = flowResult.extract.attributes;
        const email = attributes[attributeMapping.email];
        const firstName = attributes[attributeMapping.firstName];
        const lastName = attributes[attributeMapping.lastName];
        const userPrincipalName = attributes[attributeMapping.userPrincipalName];
        result.attributes = {
            email,
            firstName,
            lastName,
            userPrincipalName,
        };
        if (!email)
            result.missingAttributes.push(attributeMapping.email);
        if (!userPrincipalName)
            result.missingAttributes.push(attributeMapping.userPrincipalName);
        if (!firstName)
            result.missingAttributes.push(attributeMapping.firstName);
        if (!lastName)
            result.missingAttributes.push(attributeMapping.lastName);
    }
    return result;
}
function isConnectionTestRequest(req) {
    return req.body.RelayState === (0, service_provider_ee_1.getServiceProviderConfigTestReturnUrl)();
}
//# sourceMappingURL=saml-helpers.js.map