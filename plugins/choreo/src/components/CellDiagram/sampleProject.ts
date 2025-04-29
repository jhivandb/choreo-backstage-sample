import {
  Project,
  ComponentType,
  ConnectionType,
} from '@wso2-enterprise/choreo-cell-diagram';
import { CellBounds } from '@wso2-enterprise/choreo-cell-diagram/lib/components/Cell/CellNode/CellModel';

export const sampleProject: Project = {
  id: 'sample-project-1',
  name: 'Sample Project',
  modelVersion: '1.0.0',
  components: [
    {
      id: 'component-1',
      label: 'User Service',
      version: '1.0.0',
      type: ComponentType.SERVICE,
      buildPack: 'nodejs',
      services: {
        'user-service': {
          id: 'user-service',
          label: 'User Management Service',
          type: 'REST',
          dependencyIds: ['auth-service'],
          deploymentMetadata: {
            gateways: {
              internet: {
                isExposed: true,
                tooltip: 'Exposed to internet for user management',
              },
              intranet: {
                isExposed: false,
              },
            },
          },
        },
      },
      connections: [
        {
          id: 'conn-1',
          label: 'Auth Connection',
          type: ConnectionType.HTTP,
          onPlatform: true,
          tooltip: 'Connection to authentication service',
        },
      ],
    },
    {
      id: 'component-2',
      label: 'Auth Service',
      version: '1.0.0',
      type: ComponentType.SERVICE,
      buildPack: 'nodejs',
      services: {
        'auth-service': {
          id: 'auth-service',
          label: 'Authentication Service',
          type: 'REST',
          dependencyIds: [],
        },
      },
      connections: [],
    },
  ],
  connections: [
    {
      id: 'org-conn-1',
      label: 'External API Connection',
      tooltip: 'Connection to external payment API',
      source: {
        boundary: CellBounds.NorthBound,
      },
      target: {
        id: 'ext-payment-api',
        label: 'Payment API',
        type: ConnectionType.HTTP,
        onPlatform: false,
      },
    },
  ],
  configurations: [
    {
      id: 'config-1',
      label: 'Database Configuration',
      type: ConnectionType.Datastore,
      onPlatform: true,
    },
  ],
};
