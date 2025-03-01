"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleEmailLogin = void 0;
const typedi_1 = require("typedi");
const user_repository_1 = require("../../databases/repositories/user.repository");
const auth_error_1 = require("../../errors/response-errors/auth.error");
const event_service_1 = require("../../events/event.service");
const helpers_ee_1 = require("../../ldap/helpers.ee");
const password_utility_1 = require("../../services/password.utility");
const handleEmailLogin = async (email, password) => {
    const user = await typedi_1.Container.get(user_repository_1.UserRepository).findOne({
        where: { email },
        relations: ['authIdentities'],
    });
    if (user?.password && (await typedi_1.Container.get(password_utility_1.PasswordUtility).compare(password, user.password))) {
        return user;
    }
    const ldapIdentity = user?.authIdentities?.find((i) => i.providerType === 'ldap');
    if (user && ldapIdentity && !(0, helpers_ee_1.isLdapLoginEnabled)()) {
        typedi_1.Container.get(event_service_1.EventService).emit('login-failed-due-to-ldap-disabled', { userId: user.id });
        throw new auth_error_1.AuthError('Reset your password to gain access to the instance.');
    }
    return undefined;
};
exports.handleEmailLogin = handleEmailLogin;
//# sourceMappingURL=email.js.map