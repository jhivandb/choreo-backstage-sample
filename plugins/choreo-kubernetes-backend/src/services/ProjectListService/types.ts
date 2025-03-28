import {
  BackstageCredentials,
  BackstageUserPrincipal,
  BackstageServicePrincipal,
} from '@backstage/backend-plugin-api';

export interface Project {
  name: string;
  displayName: string;
  description?: string;
  organization?: string;
  uid?: string;
}

export interface Component {
  name: string;
  displayName: string;
  description?: string;
  project: string;
  organization?: string;
  type?: string;
  source?: {
    gitRepository?: {
      url: string;
    };
  };
  uid?: string;
}

export interface ProjectListService {
  listProjects(request: { namespace: string }): Promise<{ items: Project[] }>;

  getComponentsForProject(request: {
    namespace: string;
    projectName: string;
  }): Promise<Component[]>;
}
