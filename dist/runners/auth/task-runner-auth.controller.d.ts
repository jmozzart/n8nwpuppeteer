import type { NextFunction, Response } from 'express';
import type { AuthlessRequest } from '../../requests';
import { TaskRunnerAuthService } from './task-runner-auth.service';
import type { TaskRunnerServerInitRequest } from '../runner-types';
export declare class TaskRunnerAuthController {
    private readonly taskRunnerAuthService;
    constructor(taskRunnerAuthService: TaskRunnerAuthService);
    createGrantToken(req: AuthlessRequest): Promise<{
        token: string;
    }>;
    authMiddleware(req: TaskRunnerServerInitRequest, res: Response, next: NextFunction): Promise<void>;
}
