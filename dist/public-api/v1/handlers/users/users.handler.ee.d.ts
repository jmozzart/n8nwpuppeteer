import type express from 'express';
import type { Response } from 'express';
import type { AuthenticatedRequest, UserRequest } from '../../../../requests';
type Create = UserRequest.Invite;
declare const _default: {
    getUser: (((_: express.Request, res: express.Response, next: express.NextFunction) => express.Response | void) | ((req: AuthenticatedRequest<{
        id?: string;
    }>, res: express.Response, next: express.NextFunction) => Promise<express.Response | void>))[];
    getUsers: (((req: import("../../../types").PaginatedRequest, res: express.Response, next: express.NextFunction) => express.Response | void) | ((_: express.Request, res: express.Response, next: express.NextFunction) => express.Response | void) | ((req: AuthenticatedRequest<{
        id?: string;
    }>, res: express.Response, next: express.NextFunction) => Promise<express.Response | void>))[];
    createUser: (((req: AuthenticatedRequest<{
        id?: string;
    }>, res: express.Response, next: express.NextFunction) => Promise<express.Response | void>) | ((req: Create, res: Response) => Promise<express.Response<any, Record<string, any>>>))[];
    deleteUser: ((req: AuthenticatedRequest<{
        id?: string;
    }>, res: express.Response, next: express.NextFunction) => Promise<express.Response | void>)[];
    changeRole: ((req: AuthenticatedRequest<{
        id?: string;
    }>, res: express.Response, next: express.NextFunction) => Promise<express.Response | void>)[];
};
export = _default;
