import { InputError } from '@backstage/errors';
import { z } from 'zod';
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

  // TEMPLATE NOTE:
  // Zod is a powerful library for data validation and recommended in particular
  // for user-defined schemas. In this case we use it for input validation too.
  //
  // If you want to define a schema for your API we recommend using Backstage's
  // OpenAPI tooling: https://backstage.io/docs/next/openapi/01-getting-started

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
