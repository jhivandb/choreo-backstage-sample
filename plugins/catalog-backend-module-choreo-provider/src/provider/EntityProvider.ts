import {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import { Entity } from '@backstage/catalog-model';
import { SchedulerServiceTaskRunner } from '@backstage/backend-plugin-api';
import { KubernetesDataProvider } from './KubernetesDataProvider';
import { Config } from '@backstage/config';
import { CatalogApi } from '@backstage/catalog-client';
import { PermissionEvaluator } from '@backstage/plugin-permission-common';
import {
  LoggerService,
  DiscoveryService,
  HttpAuthService,
  AuthService,
} from '@backstage/backend-plugin-api';
import yaml from 'js-yaml';
import pluralize from 'pluralize';
import { ChoreoPrefix, KubernetesResource } from './types';

export class ChoreoEntityProvider implements EntityProvider {
  private readonly taskRunner: SchedulerServiceTaskRunner;
  private connection?: EntityProviderConnection;
  private readonly logger: LoggerService;
  private readonly config: Config;
  private readonly catalogApi: CatalogApi;
  private readonly permissions: PermissionEvaluator;
  private readonly discovery: DiscoveryService;

  constructor(
    taskRunner: SchedulerServiceTaskRunner,
    logger: LoggerService,
    config: Config,
    catalogApi: CatalogApi,
    permissions: PermissionEvaluator,
    discovery: DiscoveryService,
  ) {
    this.taskRunner = taskRunner;
    this.logger = logger;
    this.config = config;
    this.catalogApi = catalogApi;
    this.permissions = permissions;
    this.discovery = discovery;
  }

  getProviderName(): string {
    return 'ChoreoEntityProvider';
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.taskRunner.run({
      id: this.getProviderName(),
      fn: async () => {
        await this.run();
      },
    });
  }

  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error('Connection not initialized');
    }
    try {
      const kubernetesDataProvider = new KubernetesDataProvider(
        this.logger,
        this.config,
        this.catalogApi,
        this.permissions,
        this.discovery,
      );
      if (this.config.getOptionalBoolean('choreoIngestor.enabled')) {
        // Fetch all Kubernetes resources and build a CRD mapping
        const kubernetesData =
          await kubernetesDataProvider.fetchKubernetesObjects();

        const entities: Entity[] = kubernetesData.flatMap(k8s => {
          if (k8s) {
            this.logger.debug(
              `Processing Kubernetes Object: ${JSON.stringify(k8s)}`,
            );
            if (k8s.kind === 'project') {
              return this.translateProjectToEntity(k8s);
            } else if (k8s.kind === 'component') {
              return this.translateComponentToEntity(k8s);
            }
            return [];
          }
          return [];
        });

        await this.connection.applyMutation({
          type: 'full',
          entities: entities.map(entity => ({
            entity,
            locationKey: `provider:${this.getProviderName()}`,
          })),
        });
      } else {
        this.logger.info(`ChoreoEntityProvider Disabled`);
      }
    } catch (error) {
      this.logger.error(`Failed to run ChoreoEntityProvider: ${error}`);
    }
  }

  private translateProjectToEntity(project: KubernetesResource): Entity {
    const defaultAnnotations: Record<string, string> = {
      'backstage.io/managed-by-location': `cluster origin: choreo`,
      'backstage.io/managed-by-origin-location': `cluster origin: choreo`,
    };
    const annotations = project.metadata.annotations || {};
    const labels = project.metadata.labels || {};
    const systemEntity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'System',
      metadata: {
        name: project.metadata.name,
        description: annotations[`${ChoreoPrefix}description`],
        namespace: project.metadata.namespace,
        tags: [`cluster:${project.clusterName}`, `kind:${project.kind}`],
        annotations: defaultAnnotations,
        labels: labels,
      },
      spec: {
        owner: 'choreo',
        type: 'service',
      },
    };
    return systemEntity;
  }

  private translateComponentToEntity(component: KubernetesResource): Entity {
    const annotations = component.metadata.annotations || {};
    const labels = component.metadata.labels || {};
    const defaultAnnotations: Record<string, string> = {
      'backstage.io/managed-by-location': `cluster origin: choreo`,
      'backstage.io/managed-by-origin-location': `cluster origin: choreo`,
    };
    const componentEntity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: component.metadata.name,
        title: annotations[`${ChoreoPrefix}display-name`],
        description: annotations[`${ChoreoPrefix}description`],
        namespace: component.metadata.namespace,
        tags: [`cluster:${component.clusterName}`, `kind:${component.kind}`],
        annotations: defaultAnnotations,
        labels: labels,
      },
      spec: {
        type: this.componentTypeMapping(component.spec.type.toLowerCase()),
        lifecycle: 'production',
        owner: 'default',
        system: labels[`${ChoreoPrefix}project`],
        // dependsOn: annotations[`${prefix}/dependsOn`]?.split(','),
        // providesApis: annotations[`${prefix}/providesApis`]?.split(','), //TODO How to we map api relationships
        // consumesApis: annotations[`${prefix}/consumesApis`]?.split(','),
      },
    };
    return componentEntity;
  }

  private findCommonLabels(resource: any): string | null {
    const highLevelLabels = resource.metadata.labels || {};
    const podLabels = resource.spec?.template?.metadata?.labels || {};

    const commonLabels = Object.keys(highLevelLabels).filter(
      label => podLabels[label],
    );
    if (commonLabels.length > 0) {
      return commonLabels
        .map(label => `${label}=${highLevelLabels[label]}`)
        .join(',');
    } else if (Object.keys(highLevelLabels).length > 0) {
      return Object.keys(highLevelLabels)
        .map(label => `${label}=${highLevelLabels[label]}`)
        .join(',');
    }

    return null;
  }

  private extractCustomAnnotations(
    annotations: Record<string, string>,
    clusterName: string,
  ): Record<string, string> {
    const prefix = this.getAnnotationPrefix();
    const customAnnotationsKey = `${prefix}/component-annotations`;
    const defaultAnnotations: Record<string, string> = {
      'backstage.io/managed-by-location': `cluster origin: ${clusterName}`,
      'backstage.io/managed-by-origin-location': `cluster origin: ${clusterName}`,
    };

    if (!annotations[customAnnotationsKey]) {
      return defaultAnnotations;
    }

    const customAnnotations = annotations[customAnnotationsKey]
      .split(',')
      .reduce((acc, pair) => {
        const [key, value] = pair.split('=').map(s => s.trim());
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, defaultAnnotations);

    return customAnnotations;
  }

  private getAnnotationPrefix(): string {
    return (
      this.config.getOptionalString('choreoIngestor.annotationPrefix') ||
      'core.choreo.dev'
    );
  }
  private componentTypeMapping(s: string): string {
    switch (s) {
      case 'service':
        return 'service';
      case 'webapplication':
        return 'website';
      default:
        return s;
    }
  }
}
