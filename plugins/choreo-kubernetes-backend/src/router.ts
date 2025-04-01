import { InputError } from '@backstage/errors';
import express from 'express';
import Router from 'express-promise-router';
import { ProjectListService } from './services/ProjectListService/types';

export async function createRouter({
  projectListService,
}: {
  projectListService: ProjectListService;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  router.get('/projects', async (req, res) => {
    // Use query parameter for namespace, defaulting to 'default' if not provided
    const namespace = (req.query.namespace as string) || 'default-org';
    res.json(await projectListService.listProjects({ namespace }));
  });

  router.get('/projects/:projectName/components', async (req, res) => {
    // Use query parameter for namespace, defaulting to 'default' if not provided
    const namespace = (req.query.namespace as string) || 'default-org';
    const { projectName } = req.params;

    if (!projectName) {
      throw new InputError('Project name is required');
    }

    res.json(
      await projectListService.getComponentsForProject({
        namespace,
        projectName,
      }),
    );
  });

  return router;
}
