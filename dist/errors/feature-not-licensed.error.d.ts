import { ApplicationError } from 'n8n-workflow';
import type { LICENSE_FEATURES } from '../constants';
export declare class FeatureNotLicensedError extends ApplicationError {
    constructor(feature: (typeof LICENSE_FEATURES)[keyof typeof LICENSE_FEATURES]);
}
