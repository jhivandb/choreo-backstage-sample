import {
  BackstageCredentials,
  LoggerService,
} from '@backstage/backend-plugin-api/*';

import { KubernetesBuilder } from '@backstage/plugin-kubernetes-backend';
import { Config } from '@backstage/config';
import { CatalogApi } from '@backstage/catalog-client';
import { PermissionEvaluator } from '@backstage/plugin-permission-common';
import { DiscoveryService } from '@backstage/backend-plugin-api';
import {
  KubernetesFetcher,
  KubernetesClustersSupplier,
  ObjectToFetch,
} from '@backstage/plugin-kubernetes-node';
import { Project, Component } from 'choreo-cell-diagram';
import { cellChoreoWorkflowTypes, CellDiagramService } from '../../types';

export class CellDiagramInfoService implements CellDiagramService {
  private readonly logger: LoggerService;
  private readonly fetcher: KubernetesFetcher;
  private readonly clusterSupplier: KubernetesClustersSupplier;

  private constructor(
    logger: LoggerService,
    fetcher: KubernetesFetcher,
    clusterSupplier: KubernetesClustersSupplier,
  ) {
    this.logger = logger;
    this.fetcher = fetcher;
    this.clusterSupplier = clusterSupplier;
  }

  static async create(
    logger: LoggerService,
    config: Config,
    catalogApi: CatalogApi,
    permissions: PermissionEvaluator,
    discovery: DiscoveryService,
  ): Promise<CellDiagramService> {
    const builder = KubernetesBuilder.createBuilder({
      logger,
      config,
      catalogApi,
      permissions,
      discovery,
    });

    const { fetcher, clusterSupplier } = await builder.build();
    return new CellDiagramInfoService(logger, fetcher, clusterSupplier);
  }

  async fetchProjectInfo(request: {
    projectName: string;
    organizationName: string;
  }): Promise<Project | undefined> {
    const credentials: BackstageCredentials = {
      $$type: '@backstage/BackstageCredentials',
      principal: 'anonymous',
    };

    const clusters = await this.clusterSupplier.getClusters({ credentials });

    if (clusters.length === 0) {
      this.logger.warn('No clusters found.');
      return undefined;
    }
    const objectTypesToFetch: Set<ObjectToFetch> = new Set([
      ...cellChoreoWorkflowTypes,
    ]);

    let project: Project;

    for (const cluster of clusters) {
      try {
        const fetchedObjects = await this.fetcher.fetchObjectsForService({
          serviceId: cluster.name,
          clusterDetails: cluster,
          credential: {
            type: 'bearer token',
            token: cluster.authMetadata?.serviceAccountToken,
          },
          objectTypesToFetch,
          customResources: [],
        });

        // Find project

        const projectCrd = fetchedObjects.responses
          .filter(response => response.type === 'customresources')
          .flatMap(response => response.resources)
          .filter(
            // TODO Can filter by namespace instead of label
            resource =>
              resource.kind === 'Project' &&
              resource.metadata?.labels?.['core.choreo.dev/organization'] ===
                request.organizationName,
          )
          .find(resource => resource.metadata.name === request.projectName);

        if (!projectCrd) {
          continue;
        }

        const componentCrds = fetchedObjects.responses
          .filter(response => response.type === 'customresources')
          .flatMap(response => response.resources)
          .filter(
            resource =>
              resource.kind === 'Component' &&
              resource.metadata?.labels?.['core.choreo.dev/project'] ===
                request.projectName &&
              resource.metadata?.labels?.['core.choreo.dev/organization'] ===
                request.organizationName,
          );

        const components: Component[] = componentCrds.map(component => ({
          id: component.metadata?.uid || component.metadata?.name || '',
          label:
            component.metadata?.annotations?.['core.choreo.dev/display-name'] ||
            component.metadata?.name ||
            '',
          version: component.metadata?.resourceVersion || '1.0.0',
          type: component.spec?.type || 'SERVICE',
          services: {
            [component.metadata?.name || '']: {
              id: component.metadata?.name || '',
              label:
                component.metadata?.annotations?.[
                  'core.choreo.dev/display-name'
                ] ||
                component.metadata?.name ||
                '',
              type: 'REST', // TODO Fetch from endpoint
              dependencyIds: [],
            },
          },
          connections: [],
        }));

        project = {
          id: projectCrd.metadata?.uid || projectCrd.metadata?.name || '',
          name:
            projectCrd.metadata?.annotations?.[
              'core.choreo.dev/display-name'
            ] ||
            projectCrd.metadata?.name ||
            '',
          modelVersion: '1.0.0',
          components,
          connections: [],
          configurations: [],
        };

        return project;
      } catch (error: unknown) {
        this.logger.error(
          `Failed to fetch objects for cluster ${cluster.name}:`,
          error as Error,
        );
      }
    }

    return undefined;
  }
}
