"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinaryDataController = void 0;
const express_1 = __importDefault(require("express"));
const n8n_core_1 = require("n8n-core");
const decorators_1 = require("../decorators");
let BinaryDataController = class BinaryDataController {
    constructor(binaryDataService) {
        this.binaryDataService = binaryDataService;
    }
    async get(req, res) {
        const { id: binaryDataId, action } = req.query;
        if (!binaryDataId) {
            return res.status(400).end('Missing binary data ID');
        }
        if (!binaryDataId.includes(':')) {
            return res.status(400).end('Missing binary data mode');
        }
        const [mode] = binaryDataId.split(':');
        if (!(0, n8n_core_1.isValidNonDefaultMode)(mode)) {
            return res.status(400).end('Invalid binary data mode');
        }
        let { fileName, mimeType } = req.query;
        try {
            if (!fileName || !mimeType) {
                try {
                    const metadata = await this.binaryDataService.getMetadata(binaryDataId);
                    fileName = metadata.fileName;
                    mimeType = metadata.mimeType;
                    res.setHeader('Content-Length', metadata.fileSize);
                }
                catch { }
            }
            if (mimeType)
                res.setHeader('Content-Type', mimeType);
            if (action === 'download' && fileName) {
                const encodedFilename = encodeURIComponent(fileName);
                res.setHeader('Content-Disposition', `attachment; filename="${encodedFilename}"`);
            }
            return await this.binaryDataService.getAsStream(binaryDataId);
        }
        catch (error) {
            if (error instanceof n8n_core_1.FileNotFoundError)
                return res.writeHead(404).end();
            else
                throw error;
        }
    }
};
exports.BinaryDataController = BinaryDataController;
__decorate([
    (0, decorators_1.Get)('/'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BinaryDataController.prototype, "get", null);
exports.BinaryDataController = BinaryDataController = __decorate([
    (0, decorators_1.RestController)('/binary-data'),
    __metadata("design:paramtypes", [n8n_core_1.BinaryDataService])
], BinaryDataController);
//# sourceMappingURL=binary-data.controller.js.map