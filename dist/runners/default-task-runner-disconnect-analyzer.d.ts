import type { DisconnectAnalyzer, DisconnectErrorOptions } from './runner-types';
export declare class DefaultTaskRunnerDisconnectAnalyzer implements DisconnectAnalyzer {
    toDisconnectError(opts: DisconnectErrorOptions): Promise<Error>;
}
