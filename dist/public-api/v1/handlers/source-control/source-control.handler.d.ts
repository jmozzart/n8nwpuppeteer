import type express from 'express';
import type { StatusResult } from 'simple-git';
import type { ImportResult } from '../../../../environments/source-control/types/import-result';
import type { PublicSourceControlRequest } from '../../../types';
declare const _default: {
    pull: (((req: import("../../../../requests").AuthenticatedRequest<{
        id?: string;
    }>, res: express.Response, next: express.NextFunction) => Promise<express.Response | void>) | ((req: PublicSourceControlRequest.Pull, res: express.Response) => Promise<ImportResult | StatusResult | Promise<express.Response>>))[];
};
export = _default;
