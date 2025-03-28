import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';
import { createProjectListService } from './services/ProjectListService';

/**
 * choreoKubernetesPlugin backend plugin
 *
 * @public
 */
export const choreoKubernetesPlugin = createBackendPlugin({
  pluginId: 'choreo-kubernetes',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        auth: coreServices.auth,
        httpRouter: coreServices.httpRouter,
        catalog: catalogServiceRef,
      },
      async init({ logger, httpRouter }) {
        const projectListService = await createProjectListService({
          logger,
        });

        httpRouter.use(
          await createRouter({
            projectListService,
          }),
        );
        httpRouter.addAuthPolicy({
          path: '/projects',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
