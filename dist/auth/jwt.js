"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueCookie = issueCookie;
const typedi_1 = require("typedi");
const auth_service_1 = require("./auth.service");
function issueCookie(res, user) {
    return typedi_1.Container.get(auth_service_1.AuthService).issueCookie(res, user);
}
//# sourceMappingURL=jwt.js.map