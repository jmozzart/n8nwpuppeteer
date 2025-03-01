import { TypedEmitter } from '../typed-emitter';
type RunnerLifecycleEventMap = {
    'runner:failed-heartbeat-check': never;
    'runner:timed-out-during-task': never;
};
export declare class RunnerLifecycleEvents extends TypedEmitter<RunnerLifecycleEventMap> {
}
export {};
