"use strict";
const api_types_1 = require("@n8n/api-types");
const typedi_1 = require("typedi");
const invitation_controller_1 = require("../../../../controllers/invitation.controller");
const users_controller_1 = require("../../../../controllers/users.controller");
const project_relation_repository_1 = require("../../../../databases/repositories/project-relation.repository");
const event_service_1 = require("../../../../events/event.service");
const users_service_ee_1 = require("./users.service.ee");
const global_middleware_1 = require("../../shared/middlewares/global.middleware");
const pagination_service_1 = require("../../shared/services/pagination.service");
module.exports = {
    getUser: [
        global_middleware_1.validLicenseWithUserQuota,
        (0, global_middleware_1.globalScope)('user:read'),
        async (req, res) => {
            const { includeRole = false } = req.query;
            const { id } = req.params;
            const user = await (0, users_service_ee_1.getUser)({ withIdentifier: id, includeRole });
            if (!user) {
                return res.status(404).json({
                    message: `Could not find user with id: ${id}`,
                });
            }
            typedi_1.Container.get(event_service_1.EventService).emit('user-retrieved-user', {
                userId: req.user.id,
                publicApi: true,
            });
            return res.json((0, users_service_ee_1.clean)(user, { includeRole }));
        },
    ],
    getUsers: [
        global_middleware_1.validLicenseWithUserQuota,
        global_middleware_1.validCursor,
        (0, global_middleware_1.globalScope)(['user:list', 'user:read']),
        async (req, res) => {
            const { offset = 0, limit = 100, includeRole = false, projectId } = req.query;
            const _in = projectId
                ? await typedi_1.Container.get(project_relation_repository_1.ProjectRelationRepository).findUserIdsByProjectId(projectId)
                : undefined;
            const [users, count] = await (0, users_service_ee_1.getAllUsersAndCount)({
                includeRole,
                limit,
                offset,
                in: _in,
            });
            typedi_1.Container.get(event_service_1.EventService).emit('user-retrieved-all-users', {
                userId: req.user.id,
                publicApi: true,
            });
            return res.json({
                data: (0, users_service_ee_1.clean)(users, { includeRole }),
                nextCursor: (0, pagination_service_1.encodeNextCursor)({
                    offset,
                    limit,
                    numberOfTotalRecords: count,
                }),
            });
        },
    ],
    createUser: [
        (0, global_middleware_1.globalScope)('user:create'),
        async (req, res) => {
            const usersInvited = await typedi_1.Container.get(invitation_controller_1.InvitationController).inviteUser(req);
            return res.status(201).json(usersInvited);
        },
    ],
    deleteUser: [
        (0, global_middleware_1.globalScope)('user:delete'),
        async (req, res) => {
            await typedi_1.Container.get(users_controller_1.UsersController).deleteUser(req);
            return res.status(204).send();
        },
    ],
    changeRole: [
        (0, global_middleware_1.isLicensed)('feat:advancedPermissions'),
        (0, global_middleware_1.globalScope)('user:changeRole'),
        async (req, res) => {
            const validation = api_types_1.RoleChangeRequestDto.safeParse(req.body);
            if (validation.error) {
                return res.status(400).json({
                    message: validation.error.errors[0],
                });
            }
            await typedi_1.Container.get(users_controller_1.UsersController).changeGlobalRole(req, res, validation.data, req.params.id);
            return res.status(204).send();
        },
    ],
};
//# sourceMappingURL=users.handler.ee.js.map