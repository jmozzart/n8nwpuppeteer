import { EventService } from '../events/event.service';
import { LdapService } from './ldap.service.ee';
import { LdapConfiguration } from './types';
export declare class LdapController {
    private readonly ldapService;
    private readonly eventService;
    constructor(ldapService: LdapService, eventService: EventService);
    getConfig(): Promise<import("./types").LdapConfig>;
    testConnection(): Promise<void>;
    updateConfig(req: LdapConfiguration.Update): Promise<import("./types").LdapConfig>;
    getLdapSync(req: LdapConfiguration.GetSync): Promise<import("../databases/entities/auth-provider-sync-history").AuthProviderSyncHistory[]>;
    syncLdap(req: LdapConfiguration.Sync): Promise<void>;
}
