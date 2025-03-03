"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCurrentAuthenticationMethod = setCurrentAuthenticationMethod;
exports.getCurrentAuthenticationMethod = getCurrentAuthenticationMethod;
exports.isSamlCurrentAuthenticationMethod = isSamlCurrentAuthenticationMethod;
exports.isLdapCurrentAuthenticationMethod = isLdapCurrentAuthenticationMethod;
exports.isEmailCurrentAuthenticationMethod = isEmailCurrentAuthenticationMethod;
exports.isSsoJustInTimeProvisioningEnabled = isSsoJustInTimeProvisioningEnabled;
exports.doRedirectUsersFromLoginToSsoFlow = doRedirectUsersFromLoginToSsoFlow;
const typedi_1 = __importDefault(require("typedi"));
const config_1 = __importDefault(require("../config"));
const settings_repository_1 = require("../databases/repositories/settings.repository");
async function setCurrentAuthenticationMethod(authenticationMethod) {
    config_1.default.set('userManagement.authenticationMethod', authenticationMethod);
    await typedi_1.default.get(settings_repository_1.SettingsRepository).save({
        key: 'userManagement.authenticationMethod',
        value: authenticationMethod,
        loadOnStartup: true,
    }, { transaction: false });
}
function getCurrentAuthenticationMethod() {
    return config_1.default.getEnv('userManagement.authenticationMethod');
}
function isSamlCurrentAuthenticationMethod() {
    return getCurrentAuthenticationMethod() === 'saml';
}
function isLdapCurrentAuthenticationMethod() {
    return getCurrentAuthenticationMethod() === 'ldap';
}
function isEmailCurrentAuthenticationMethod() {
    return getCurrentAuthenticationMethod() === 'email';
}
function isSsoJustInTimeProvisioningEnabled() {
    return config_1.default.getEnv('sso.justInTimeProvisioning');
}
function doRedirectUsersFromLoginToSsoFlow() {
    return config_1.default.getEnv('sso.redirectLoginToSso');
}
//# sourceMappingURL=sso-helpers.js.map