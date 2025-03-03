"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = getUser;
exports.getAllUsersAndCount = getAllUsersAndCount;
exports.clean = clean;
const typeorm_1 = require("@n8n/typeorm");
const pick_1 = __importDefault(require("lodash/pick"));
const typedi_1 = require("typedi");
const uuid_1 = require("uuid");
const user_repository_1 = require("../../../../databases/repositories/user.repository");
async function getUser(data) {
    return await typedi_1.Container.get(user_repository_1.UserRepository)
        .findOne({
        where: {
            ...((0, uuid_1.validate)(data.withIdentifier) && { id: data.withIdentifier }),
            ...(!(0, uuid_1.validate)(data.withIdentifier) && { email: data.withIdentifier }),
        },
    })
        .then((user) => {
        if (user && !data?.includeRole)
            delete user.role;
        return user;
    });
}
async function getAllUsersAndCount(data) {
    const { in: _in } = data;
    const users = await typedi_1.Container.get(user_repository_1.UserRepository).find({
        where: { ...(_in && { id: (0, typeorm_1.In)(_in) }) },
        skip: data.offset,
        take: data.limit,
    });
    if (!data?.includeRole) {
        users.forEach((user) => {
            delete user.role;
        });
    }
    const count = await typedi_1.Container.get(user_repository_1.UserRepository).count();
    return [users, count];
}
const userProperties = [
    'id',
    'email',
    'firstName',
    'lastName',
    'createdAt',
    'updatedAt',
    'isPending',
];
function pickUserSelectableProperties(user, options) {
    return (0, pick_1.default)(user, userProperties.concat(options?.includeRole ? ['role'] : []));
}
function clean(users, options) {
    return Array.isArray(users)
        ? users.map((user) => pickUserSelectableProperties(user, options))
        : pickUserSelectableProperties(users, options);
}
//# sourceMappingURL=users.service.ee.js.map