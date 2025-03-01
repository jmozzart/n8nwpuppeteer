import type { Variables } from '../../databases/entities/variables';
import { VariablesRepository } from '../../databases/repositories/variables.repository';
import { EventService } from '../../events/event.service';
import { CacheService } from '../../services/cache/cache.service';
export declare class VariablesService {
    protected cacheService: CacheService;
    protected variablesRepository: VariablesRepository;
    private readonly eventService;
    constructor(cacheService: CacheService, variablesRepository: VariablesRepository, eventService: EventService);
    getAllCached(): Promise<Variables[]>;
    getCount(): Promise<number>;
    getCached(id: string): Promise<Variables | null>;
    delete(id: string): Promise<void>;
    updateCache(): Promise<void>;
    findAll(): Promise<Variables[]>;
    validateVariable(variable: Omit<Variables, 'id'>): void;
    create(variable: Omit<Variables, 'id'>): Promise<Variables>;
    update(id: string, variable: Omit<Variables, 'id'>): Promise<Variables>;
}
