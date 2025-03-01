"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseFilter = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const n8n_workflow_1 = require("n8n-workflow");
const utils_1 = require("../../../utils");
class BaseFilter {
    static async toFilter(rawFilter, Filter) {
        const dto = (0, n8n_workflow_1.jsonParse)(rawFilter, { errorMessage: 'Failed to parse filter JSON' });
        if (!(0, utils_1.isObjectLiteral)(dto))
            throw new n8n_workflow_1.ApplicationError('Filter must be an object literal');
        const instance = (0, class_transformer_1.plainToInstance)(Filter, dto, {
            excludeExtraneousValues: true,
        });
        await instance.validate();
        return (0, class_transformer_1.instanceToPlain)(instance, {
            exposeUnsetFields: false,
        });
    }
    async validate() {
        const result = await (0, class_validator_1.validate)(this);
        if (result.length > 0)
            throw new n8n_workflow_1.ApplicationError('Parsed filter does not fit the schema');
    }
}
exports.BaseFilter = BaseFilter;
//# sourceMappingURL=base.filter.dto.js.map