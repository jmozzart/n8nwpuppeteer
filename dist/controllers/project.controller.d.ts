import type { Scope } from '@n8n/permissions';
import type { Project } from '../databases/entities/project';
import { ProjectRepository } from '../databases/repositories/project.repository';
import { EventService } from '../events/event.service';
import { ProjectRequest } from '../requests';
import { ProjectService } from '../services/project.service';
import { RoleService } from '../services/role.service';
export declare class ProjectController {
    private readonly projectsService;
    private readonly roleService;
    private readonly projectRepository;
    private readonly eventService;
    constructor(projectsService: ProjectService, roleService: RoleService, projectRepository: ProjectRepository, eventService: EventService);
    getAllProjects(req: ProjectRequest.GetAll): Promise<Project[]>;
    getProjectCounts(): Promise<Record<import("../databases/entities/project").ProjectType, number>>;
    createProject(req: ProjectRequest.Create): Promise<{
        role: string;
        scopes: Scope[];
        name: string;
        type: import("../databases/entities/project").ProjectType;
        projectRelations: import("../databases/entities/project-relation").ProjectRelation[];
        sharedCredentials: import("../databases/entities/shared-credentials").SharedCredentials[];
        sharedWorkflows: import("../databases/entities/shared-workflow").SharedWorkflow[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getMyProjects(req: ProjectRequest.GetMyProjects): Promise<ProjectRequest.GetMyProjectsResponse>;
    getPersonalProject(req: ProjectRequest.GetPersonalProject): Promise<{
        scopes: Scope[];
        name: string;
        type: import("../databases/entities/project").ProjectType;
        projectRelations: import("../databases/entities/project-relation").ProjectRelation[];
        sharedCredentials: import("../databases/entities/shared-credentials").SharedCredentials[];
        sharedWorkflows: import("../databases/entities/shared-workflow").SharedWorkflow[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getProject(req: ProjectRequest.Get): Promise<ProjectRequest.ProjectWithRelations>;
    updateProject(req: ProjectRequest.Update): Promise<void>;
    deleteProject(req: ProjectRequest.Delete): Promise<void>;
}
