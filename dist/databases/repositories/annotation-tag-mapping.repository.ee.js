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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnotationTagMappingRepository = void 0;
const typeorm_1 = require("@n8n/typeorm");
const typedi_1 = require("typedi");
const annotation_tag_mapping_ee_1 = require("../../databases/entities/annotation-tag-mapping.ee");
let AnnotationTagMappingRepository = class AnnotationTagMappingRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        super(annotation_tag_mapping_ee_1.AnnotationTagMapping, dataSource.manager);
    }
    async overwriteTags(annotationId, tagIds) {
        return await this.manager.transaction(async (tx) => {
            await tx.delete(annotation_tag_mapping_ee_1.AnnotationTagMapping, { annotationId });
            const tagMappings = tagIds.map((tagId) => ({
                annotationId,
                tagId,
            }));
            return await tx.insert(annotation_tag_mapping_ee_1.AnnotationTagMapping, tagMappings);
        });
    }
};
exports.AnnotationTagMappingRepository = AnnotationTagMappingRepository;
exports.AnnotationTagMappingRepository = AnnotationTagMappingRepository = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], AnnotationTagMappingRepository);
//# sourceMappingURL=annotation-tag-mapping.repository.ee.js.map