import {
  createPlugin,
  createRoutableExtension,
  createApiFactory,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { choreoApiRef, ChoreoApiClient } from './api';

export const choreoPlugin = createPlugin({
  id: 'choreo',
  apis: [
    createApiFactory({
      api: choreoApiRef,
      deps: {}, // Add dependencies here if needed
      factory: () => new ChoreoApiClient(),
    }),
  ],
  routes: {
    root: rootRouteRef,
  },
});

export const ChoreoUiPage = choreoPlugin.provide(
  createRoutableExtension({
    name: 'ChoreoUiPage',
    component: () =>
      import('./components/ProjectPage').then(m => m.ProjectPage),
    mountPoint: rootRouteRef,
  }),
);
