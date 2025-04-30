export interface EnvironmentService {
  fetchDeploymentInfo(request: {
    projectName: string;
    componentName: string;
    organizationName: string;
  }): Promise<Environment[]>;
}

export interface Environment {
  name: string;
  deployment: {
    status: 'success' | 'failed';
    lastDeployed: string;
  };
  endpoint: {
    url: string;
    status: 'active' | 'inactive';
  };
}

export type ObjectToFetch = {
  group: string;
  apiVersion: string;
  plural: string;
  objectType: 'customresources';
};

export const choreoWorkflowTypes: ObjectToFetch[] = [
  {
    group: 'core.choreo.dev',
    apiVersion: 'v1',
    plural: 'environments',
    objectType: 'customresources',
  },
  {
    group: 'core.choreo.dev',
    apiVersion: 'v1',
    plural: 'deployments',
    objectType: 'customresources',
  },
  {
    group: 'core.choreo.dev',
    apiVersion: 'v1',
    plural: 'endpoints',
    objectType: 'customresources',
  },
];
