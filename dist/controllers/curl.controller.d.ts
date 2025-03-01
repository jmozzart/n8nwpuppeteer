import { Request } from 'express';
import { CurlService } from '../services/curl.service';
export declare class CurlController {
    private readonly curlService;
    constructor(curlService: CurlService);
    toJson(req: Request<{}, {}, {
        curlCommand: string;
    }>): {};
}
