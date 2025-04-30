import { HttpAuthService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import express from 'express';
import Router from 'express-promise-router';
import { EnvironmentInfoService } from './services/EnvironmentService/EnvironmentInfoService';

export async function createRouter({
  httpAuth,
  environmentInfoService,
}: {
  httpAuth: HttpAuthService;
  environmentInfoService: EnvironmentInfoService;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  router.get('/environments', async (req, res) => {
    const { componentName, projectName, organizationName } = req.query;

    if (!componentName || !projectName || !organizationName) {
      throw new InputError(
        'componentName and projectName are required query parameters',
      );
    }

    res.json(
      await environmentInfoService.fetchDeploymentInfo({
        componentName: componentName as string,
        projectName: projectName as string,
        organizationName: organizationName as string, // TODO: Get from request or config
      }),
    );
  });

  return router;
}
