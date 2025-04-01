import { LoggerService } from '@backstage/backend-plugin-api';
import { NotFoundError } from '@backstage/errors';
// Remove the CommonJS import
// import * as k8s from '@kubernetes/client-node';
import { Project, Component, ProjectListService } from './types';

/**
 * Creates a service implementation for interacting with Choreo Kubernetes custom resources.
 * This service communicates with the Kubernetes API server to fetch Project and Component resources.
 */
export async function createProjectListService({
  logger,
}: {
  logger: LoggerService;
}): Promise<ProjectListService> {
  logger.info('Initializing ProjectListService');

  // Dynamically import the ESM module
  const k8s = await import('@kubernetes/client-node');

  // Initialize Kubernetes client
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  const customApi = kc.makeApiClient(k8s.CustomObjectsApi);

  // Define the API Group, Version and Resource types
  const group = 'core.choreo.dev';
  const version = 'v1';
  const projectsPlural = 'projects';
  const componentsPlural = 'components';

  const service: ProjectListService = {
    async listProjects(request: {
      namespace: string;
    }): Promise<{ items: Project[] }> {
      try {
        logger.info('Fetching projects from Kubernetes API server');

        const response = await customApi.listNamespacedCustomObject({
          group,
          version,
          plural: projectsPlural,
          namespace: request.namespace,
        });

        // Use a more generic approach
        const items = response.items || [];

        // Map the Kubernetes resources to our Project interface
        const projects: Project[] = items.map((item: any) => ({
          name: item.metadata.name,
          displayName:
            item.metadata.annotations?.['core.choreo.dev/display-name'] ||
            item.metadata.name,
          description:
            item.metadata.annotations?.['core.choreo.dev/description'],
          organization:
            item.metadata.namespace ||
            item.metadata.labels?.['core.choreo.dev/organization'],
          uid: item.metadata.uid,
        }));

        return { items: projects };
      } catch (error) {
        logger.error(`Failed to fetch projects: ${error}`);
        return { items: [] };
      }
    },

    async getComponentsForProject(request: {
      namespace: string;
      projectName: string;
    }): Promise<Component[]> {
      try {
        if (!request.projectName) {
          throw new NotFoundError('Project name must be provided');
        }

        logger.info(`Fetching components for project: ${request.projectName}`);

        // We'll need to find the project's namespace/organization first
        const projectsResult = await this.listProjects({
          namespace: request.namespace,
        });
        const project = projectsResult.items.find(
          (p: Project) => p.name === request.projectName,
        );

        if (!project) {
          throw new NotFoundError(`Project not found: ${request.projectName}`);
        }

        const response = await customApi.listNamespacedCustomObject({
          group,
          version,
          plural: componentsPlural,
          namespace: request.namespace,
        });

        // Type assertion for the response
        const componentsList = response as {
          items: Array<{
            metadata: {
              name: string;
              namespace: string;
              uid: string;
              annotations?: {
                'core.choreo.dev/display-name'?: string;
                'core.choreo.dev/description'?: string;
              };
              labels?: {
                'core.choreo.dev/project'?: string;
                'core.choreo.dev/organization'?: string;
              };
            };
            spec?: {
              type?: string;
              source?: {
                gitRepository?: {
                  url: string;
                };
              };
            };
          }>;
        };

        // Map the Kubernetes resources to our Component interface
        let components: Component[] = componentsList.items.map(item => ({
          name: item.metadata.name,
          displayName:
            item.metadata.annotations?.['core.choreo.dev/display-name'] ||
            item.metadata.name,
          description:
            item.metadata.annotations?.['core.choreo.dev/description'],
          project:
            item.metadata.labels?.['core.choreo.dev/project'] ||
            request.projectName,
          organization:
            item.metadata.namespace ||
            item.metadata.labels?.['core.choreo.dev/organization'],
          type: item.spec?.type,
          source: item.spec?.source,
          uid: item.metadata.uid,
        }));

        components = components.filter(component => {
          return component.project === request.projectName;
        });

        logger.info(
          `Found ${components.length} components for project ${request.projectName}`,
        );
        return components;
      } catch (error) {
        logger.error(
          `Failed to fetch components for project ${request.projectName}: ${error}`,
        );
        if (error instanceof NotFoundError) {
          throw error;
        }
        return [];
      }
    },
  };

  return service;
}
