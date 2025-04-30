import {
  AuthService,
  BackstageCredentials,
  LoggerService,
} from '@backstage/backend-plugin-api/*';
import {
  EnvironmentService,
  Environment,
  ObjectToFetch,
  choreoWorkflowTypes,
} from './types';
import {
  KubernetesBuilder,
  KubernetesObjectTypes,
} from '@backstage/plugin-kubernetes-backend';
import { Config } from '@backstage/config';
import { CatalogApi } from '@backstage/catalog-client';
import { PermissionEvaluator } from '@backstage/plugin-permission-common';
import { DiscoveryService } from '@backstage/backend-plugin-api';
import {
  KubernetesFetcher,
  ClusterDetails,
  KubernetesClustersSupplier,
} from '@backstage/plugin-kubernetes-node';

export class EnvironmentInfoService implements EnvironmentService {
  private readonly logger: LoggerService;
  private readonly config: Config;
  private readonly catalogApi: CatalogApi;
  private readonly permissions: PermissionEvaluator;
  private readonly discovery: DiscoveryService;
  private readonly fetcher: KubernetesFetcher;
  private readonly clusterSupplier: KubernetesClustersSupplier;

  private constructor(
    logger: LoggerService,
    config: Config,
    catalogApi: CatalogApi,
    permissions: PermissionEvaluator,
    discovery: DiscoveryService,
    fetcher: KubernetesFetcher,
    clusterSupplier: KubernetesClustersSupplier,
  ) {
    this.logger = logger;
    this.config = config;
    this.catalogApi = catalogApi;
    this.permissions = permissions;
    this.discovery = discovery;
    this.fetcher = fetcher;
    this.clusterSupplier = clusterSupplier;
  }

  static async create(
    logger: LoggerService,
    config: Config,
    catalogApi: CatalogApi,
    permissions: PermissionEvaluator,
    discovery: DiscoveryService,
  ): Promise<EnvironmentInfoService> {
    const builder = KubernetesBuilder.createBuilder({
      logger,
      config,
      catalogApi,
      permissions,
      discovery,
    });

    const { fetcher, clusterSupplier } = await builder.build();
    return new EnvironmentInfoService(
      logger,
      config,
      catalogApi,
      permissions,
      discovery,
      fetcher,
      clusterSupplier,
    );
  }

  async fetchDeploymentInfo(request: {
    projectName: string;
    componentName: string;
    organizationName: string;
  }): Promise<Environment[]> {
    const credentials: BackstageCredentials = {
      $$type: '@backstage/BackstageCredentials',
      principal: 'anonymous',
    };

    const clusters = await this.clusterSupplier.getClusters({ credentials });

    if (clusters.length === 0) {
      this.logger.warn('No clusters found.');
      return [];
    }

    const objectTypesToFetch: Set<ObjectToFetch> = new Set([
      ...choreoWorkflowTypes,
    ]);

    const environments: Environment[] = [];

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

        const environmentObjects = fetchedObjects.responses
          .filter(response => response.type === 'customresources')
          .flatMap(response => response.resources)
          .filter(
            // TODO Can filter by namespace instead of label
            resource =>
              resource.kind === 'Environment' &&
              resource.metadata?.labels?.['core.choreo.dev/organization'] ===
                request.organizationName,
          );

        for (const env of environmentObjects) {
          const deployment = fetchedObjects.responses
            .filter(response => response.type === 'customresources')
            .flatMap(response => response.resources)
            .find(
              // TODO Move labels to constants
              resource =>
                resource.kind === 'Deployment' &&
                resource.metadata?.labels?.['core.choreo.dev/environment'] ===
                  env.metadata.name &&
                resource.metadata?.labels?.['core.choreo.dev/project'] ===
                  request.projectName &&
                resource.metadata?.labels?.['core.choreo.dev/component'] ===
                  request.componentName &&
                resource.metadata?.labels?.['core.choreo.dev/organization'] ===
                  request.organizationName,
            );
          const endpoint = fetchedObjects.responses
            .filter(response => (response.type = 'customresources'))
            .flatMap(response => response.resources)
            .find(
              resource =>
                resource.kind === 'Endpoint' &&
                resource.metadata?.labels?.['core.choreo.dev/deployment'] ===
                  deployment.metadata?.name,
            ); // TODO There are multiple endpoints

          environments.push({
            name:
              env.metadata.annotations?.['core.choreo.dev/display-name'] ||
              env.metadata.name,
            deployment: {
              status: deployment?.status?.conditions?.some(
                (c: { type: string; status: string }) =>
                  c.type === 'Ready' && c.status === 'True',
              )
                ? 'success'
                : 'failed',
              lastDeployed:
                deployment?.status?.conditions?.find(
                  (c: { type: string }) => c.type === 'Ready',
                )?.lastTransitionTime || new Date().toISOString(),
            },
            endpoint: {
              url: endpoint.status.address ?? '',
              status: env.status?.conditions?.some(
                (c: { type: string; status: string }) =>
                  c.type === 'Available' && c.status === 'True',
              )
                ? 'active'
                : 'inactive',
            },
          });
        }
      } catch (error: unknown) {
        this.logger.error(
          `Failed to fetch objects for cluster ${cluster.name}:`,
          error as Error,
        );
      }
    }

    return environments;
  }
}
