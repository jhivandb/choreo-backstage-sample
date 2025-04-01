import { configApiRef, useApi, createApiRef } from '@backstage/core-plugin-api';
import {
  Project,
  Component,
} from '@internal/plugin-choreo-kubernetes-backend/src/services/ProjectListService/types';

export const choreoApiRef = createApiRef<ChoreoApi>({
  id: 'plugin.choreo-kubernetes',
});

/**
 * API client for the Choreo plugin
 */
export interface ChoreoApi {
  listProjects(namespace?: string): Promise<Project[]>;
  getComponentsForProject(
    projectName: string,
    namespace?: string,
  ): Promise<Component[]>;
}

/**
 * Implementation of the Choreo API
 */
export class ChoreoApiClient implements ChoreoApi {
  private readonly baseUrl: string;

  constructor() {
    const config = useApi(configApiRef);
    const SYS_INFO_BACKEND_URL = 'backend.baseUrl';
    const backendUrl = config.getString(SYS_INFO_BACKEND_URL);
    this.baseUrl = backendUrl + '/api/choreo-kubernetes';
  }

  async listProjects(namespace: string = 'default-org'): Promise<Project[]> {
    const response = await fetch(
      `${this.baseUrl}/projects?namespace=${encodeURIComponent(namespace)}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    return data.items;
  }

  async getComponentsForProject(
    projectName: string,
    namespace: string = 'default-org',
  ): Promise<Component[]> {
    const response = await fetch(
      `${this.baseUrl}/projects/${encodeURIComponent(
        projectName,
      )}/components?namespace=${encodeURIComponent(namespace)}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch components: ${response.statusText}`);
    }
    return await response.json();
  }
}
