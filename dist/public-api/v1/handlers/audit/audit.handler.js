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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const typedi_1 = __importDefault(require("typedi"));
const global_middleware_1 = require("../../../../public-api/v1/shared/middlewares/global.middleware");
module.exports = {
    generateAudit: [
        (0, global_middleware_1.globalScope)('securityAudit:generate'),
        async (req, res) => {
            try {
                const { SecurityAuditService } = await Promise.resolve().then(() => __importStar(require('../../../../security-audit/security-audit.service')));
                const result = await typedi_1.default.get(SecurityAuditService).run(req.body?.additionalOptions?.categories, req.body?.additionalOptions?.daysAbandonedWorkflow);
                return res.json(result);
            }
            catch (error) {
                return res.status(500).json(error);
            }
        },
    ],
};
//# sourceMappingURL=audit.handler.js.map