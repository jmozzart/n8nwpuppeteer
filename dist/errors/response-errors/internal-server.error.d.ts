import { ResponseError } from './abstract/response.error';
export declare class InternalServerError extends ResponseError {
    constructor(message: string, errorCode?: number);
}
