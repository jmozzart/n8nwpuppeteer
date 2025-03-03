"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initExpressionEvaluator = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const config_1 = __importDefault(require("./config"));
const initExpressionEvaluator = () => {
    n8n_workflow_1.ExpressionEvaluatorProxy.setEvaluator(config_1.default.getEnv('expression.evaluator'));
    n8n_workflow_1.ExpressionEvaluatorProxy.setDifferEnabled(config_1.default.getEnv('expression.reportDifference'));
    n8n_workflow_1.ExpressionEvaluatorProxy.setDiffReporter((expr) => {
        n8n_workflow_1.ErrorReporterProxy.warn('Expression difference', {
            extra: {
                expression: expr,
            },
        });
    });
};
exports.initExpressionEvaluator = initExpressionEvaluator;
//# sourceMappingURL=expression-evaluator.js.map