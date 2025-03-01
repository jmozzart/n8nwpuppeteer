"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordUtility = void 0;
const bcryptjs_1 = require("bcryptjs");
const typedi_1 = require("typedi");
const constants_1 = require("../constants");
const bad_request_error_1 = require("../errors/response-errors/bad-request.error");
const SALT_ROUNDS = 10;
let PasswordUtility = class PasswordUtility {
    async hash(plaintext) {
        return await (0, bcryptjs_1.hash)(plaintext, SALT_ROUNDS);
    }
    async compare(plaintext, hashed) {
        return await (0, bcryptjs_1.compare)(plaintext, hashed);
    }
    validate(plaintext) {
        if (!plaintext)
            throw new bad_request_error_1.BadRequestError('Password is mandatory');
        const errorMessages = [];
        if (plaintext.length < constants_1.MIN_PASSWORD_CHAR_LENGTH || plaintext.length > constants_1.MAX_PASSWORD_CHAR_LENGTH) {
            errorMessages.push(`Password must be ${constants_1.MIN_PASSWORD_CHAR_LENGTH} to ${constants_1.MAX_PASSWORD_CHAR_LENGTH} characters long.`);
        }
        if (!/\d/.test(plaintext)) {
            errorMessages.push('Password must contain at least 1 number.');
        }
        if (!/[A-Z]/.test(plaintext)) {
            errorMessages.push('Password must contain at least 1 uppercase letter.');
        }
        if (errorMessages.length > 0) {
            throw new bad_request_error_1.BadRequestError(errorMessages.join(' '));
        }
        return plaintext;
    }
};
exports.PasswordUtility = PasswordUtility;
exports.PasswordUtility = PasswordUtility = __decorate([
    (0, typedi_1.Service)()
], PasswordUtility);
//# sourceMappingURL=password.utility.js.map