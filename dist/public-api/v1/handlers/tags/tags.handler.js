"use strict";
const typedi_1 = require("typedi");
const tag_repository_1 = require("../../../../databases/repositories/tag.repository");
const tag_service_1 = require("../../../../services/tag.service");
const global_middleware_1 = require("../../shared/middlewares/global.middleware");
const pagination_service_1 = require("../../shared/services/pagination.service");
module.exports = {
    createTag: [
        (0, global_middleware_1.globalScope)('tag:create'),
        async (req, res) => {
            const { name } = req.body;
            const newTag = typedi_1.Container.get(tag_service_1.TagService).toEntity({ name: name.trim() });
            try {
                const createdTag = await typedi_1.Container.get(tag_service_1.TagService).save(newTag, 'create');
                return res.status(201).json(createdTag);
            }
            catch (error) {
                return res.status(409).json({ message: 'Tag already exists' });
            }
        },
    ],
    updateTag: [
        (0, global_middleware_1.globalScope)('tag:update'),
        async (req, res) => {
            const { id } = req.params;
            const { name } = req.body;
            try {
                await typedi_1.Container.get(tag_service_1.TagService).getById(id);
            }
            catch (error) {
                return res.status(404).json({ message: 'Not Found' });
            }
            const updateTag = typedi_1.Container.get(tag_service_1.TagService).toEntity({ id, name: name.trim() });
            try {
                const updatedTag = await typedi_1.Container.get(tag_service_1.TagService).save(updateTag, 'update');
                return res.json(updatedTag);
            }
            catch (error) {
                return res.status(409).json({ message: 'Tag already exists' });
            }
        },
    ],
    deleteTag: [
        (0, global_middleware_1.globalScope)('tag:delete'),
        async (req, res) => {
            const { id } = req.params;
            let tag;
            try {
                tag = await typedi_1.Container.get(tag_service_1.TagService).getById(id);
            }
            catch (error) {
                return res.status(404).json({ message: 'Not Found' });
            }
            await typedi_1.Container.get(tag_service_1.TagService).delete(id);
            return res.json(tag);
        },
    ],
    getTags: [
        (0, global_middleware_1.globalScope)('tag:read'),
        global_middleware_1.validCursor,
        async (req, res) => {
            const { offset = 0, limit = 100 } = req.query;
            const query = {
                skip: offset,
                take: limit,
            };
            const [tags, count] = await typedi_1.Container.get(tag_repository_1.TagRepository).findAndCount(query);
            return res.json({
                data: tags,
                nextCursor: (0, pagination_service_1.encodeNextCursor)({
                    offset,
                    limit,
                    numberOfTotalRecords: count,
                }),
            });
        },
    ],
    getTag: [
        (0, global_middleware_1.globalScope)('tag:read'),
        async (req, res) => {
            const { id } = req.params;
            try {
                const tag = await typedi_1.Container.get(tag_service_1.TagService).getById(id);
                return res.json(tag);
            }
            catch (error) {
                return res.status(404).json({ message: 'Not Found' });
            }
        },
    ],
};
//# sourceMappingURL=tags.handler.js.map