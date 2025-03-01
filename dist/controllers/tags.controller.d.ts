import { Request, Response, NextFunction } from 'express';
import { TagsRequest } from '../requests';
import { TagService } from '../services/tag.service';
export declare class TagsController {
    private readonly tagService;
    private config;
    constructor(tagService: TagService);
    workflowsEnabledMiddleware(_req: Request, _res: Response, next: NextFunction): void;
    getAll(req: TagsRequest.GetAll): Promise<import("../databases/entities/tag-entity").TagEntity[]>;
    createTag(req: TagsRequest.Create): Promise<import("../databases/entities/tag-entity").TagEntity>;
    updateTag(req: TagsRequest.Update): Promise<import("../databases/entities/tag-entity").TagEntity>;
    deleteTag(req: TagsRequest.Delete): Promise<boolean>;
}
