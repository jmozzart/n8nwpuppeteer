"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestController = void 0;
const typedi_1 = require("typedi");
const controller_registry_1 = require("./controller.registry");
const RestController = (basePath = '/') => (target) => {
    const metadata = (0, controller_registry_1.getControllerMetadata)(target);
    metadata.basePath = basePath;
    return (0, typedi_1.Service)()(target);
};
exports.RestController = RestController;
//# sourceMappingURL=rest-controller.js.map