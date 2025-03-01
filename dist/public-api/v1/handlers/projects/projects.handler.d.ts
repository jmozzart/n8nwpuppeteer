import type { Response } from 'express';
import type { PaginatedRequest } from '../../../../public-api/types';
declare const _default: {
    createProject: ((req: import("../../../../requests").AuthenticatedRequest<{
        id?: string;
    }>, res: Response, next: import("express").NextFunction) => Promise<Response | void>)[];
    updateProject: ((req: import("../../../../requests").AuthenticatedRequest<{
        id?: string;
    }>, res: Response, next: import("express").NextFunction) => Promise<Response | void>)[];
    deleteProject: ((req: import("../../../../requests").AuthenticatedRequest<{
        id?: string;
    }>, res: Response, next: import("express").NextFunction) => Promise<Response | void>)[];
    getProjects: (((req: PaginatedRequest, res: Response, next: import("express").NextFunction) => Response | void) | ((req: import("../../../../requests").AuthenticatedRequest<{
        id?: string;
    }>, res: Response, next: import("express").NextFunction) => Promise<Response | void>))[];
};
export = _default;
