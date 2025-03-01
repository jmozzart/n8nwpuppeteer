"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const typedi_1 = __importDefault(require("typedi"));
const project_controller_1 = require("../../../../controllers/project.controller");
const project_repository_1 = require("../../../../databases/repositories/project.repository");
const global_middleware_1 = require("../../shared/middlewares/global.middleware");
const pagination_service_1 = require("../../shared/services/pagination.service");
module.exports = {
    createProject: [
        (0, global_middleware_1.isLicensed)('feat:projectRole:admin'),
        (0, global_middleware_1.globalScope)('project:create'),
        async (req, res) => {
            const project = await typedi_1.default.get(project_controller_1.ProjectController).createProject(req);
            return res.status(201).json(project);
        },
    ],
    updateProject: [
        (0, global_middleware_1.isLicensed)('feat:projectRole:admin'),
        (0, global_middleware_1.globalScope)('project:update'),
        async (req, res) => {
            await typedi_1.default.get(project_controller_1.ProjectController).updateProject(req);
            return res.status(204).send();
        },
    ],
    deleteProject: [
        (0, global_middleware_1.isLicensed)('feat:projectRole:admin'),
        (0, global_middleware_1.globalScope)('project:delete'),
        async (req, res) => {
            await typedi_1.default.get(project_controller_1.ProjectController).deleteProject(req);
            return res.status(204).send();
        },
    ],
    getProjects: [
        (0, global_middleware_1.isLicensed)('feat:projectRole:admin'),
        (0, global_middleware_1.globalScope)('project:list'),
        global_middleware_1.validCursor,
        async (req, res) => {
            const { offset = 0, limit = 100 } = req.query;
            const [projects, count] = await typedi_1.default.get(project_repository_1.ProjectRepository).findAndCount({
                skip: offset,
                take: limit,
            });
            return res.json({
                data: projects,
                nextCursor: (0, pagination_service_1.encodeNextCursor)({
                    offset,
                    limit,
                    numberOfTotalRecords: count,
                }),
            });
        },
    ],
};
//# sourceMappingURL=projects.handler.js.map