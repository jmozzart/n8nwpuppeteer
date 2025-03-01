"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const typedi_1 = __importDefault(require("typedi"));
const variables_repository_1 = require("../../../../databases/repositories/variables.repository");
const variables_controller_ee_1 = require("../../../../environments/variables/variables.controller.ee");
const global_middleware_1 = require("../../shared/middlewares/global.middleware");
const pagination_service_1 = require("../../shared/services/pagination.service");
module.exports = {
    createVariable: [
        (0, global_middleware_1.isLicensed)('feat:variables'),
        (0, global_middleware_1.globalScope)('variable:create'),
        async (req, res) => {
            await typedi_1.default.get(variables_controller_ee_1.VariablesController).createVariable(req);
            res.status(201).send();
        },
    ],
    deleteVariable: [
        (0, global_middleware_1.isLicensed)('feat:variables'),
        (0, global_middleware_1.globalScope)('variable:delete'),
        async (req, res) => {
            await typedi_1.default.get(variables_controller_ee_1.VariablesController).deleteVariable(req);
            res.status(204).send();
        },
    ],
    getVariables: [
        (0, global_middleware_1.isLicensed)('feat:variables'),
        (0, global_middleware_1.globalScope)('variable:list'),
        global_middleware_1.validCursor,
        async (req, res) => {
            const { offset = 0, limit = 100 } = req.query;
            const [variables, count] = await typedi_1.default.get(variables_repository_1.VariablesRepository).findAndCount({
                skip: offset,
                take: limit,
            });
            return res.json({
                data: variables,
                nextCursor: (0, pagination_service_1.encodeNextCursor)({
                    offset,
                    limit,
                    numberOfTotalRecords: count,
                }),
            });
        },
    ],
};
//# sourceMappingURL=variables.handler.js.map