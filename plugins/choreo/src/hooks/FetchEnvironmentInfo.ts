import { Entity } from '@backstage/catalog-model/index';
import { createFetchApi } from '@backstage/core-app-api';
import {
  configApiRef,
  DiscoveryApi,
  discoveryApiRef,
  IdentityApi,
  useApi,
} from '@backstage/core-plugin-api';

const ChoreoPrefix = 'core.choreo.dev/';
export async function fetchEnvironmentInfo(
  entity: Entity,
  discovery: DiscoveryApi,
  identity: IdentityApi,
) {
  const { token } = await identity.getCredentials();
  const backendUrl = new URL(
    `${await discovery.getBaseUrl('choreo')}/environments`,
  );
  const component = entity.metadata.labels?.['core.choreo.dev/name'];
  const project = entity.metadata.labels?.['core.choreo.dev/project'];
  const organization = entity.metadata.labels?.['core.choreo.dev/organization'];

  if (!project || !component || !organization) {
    return [];
  }
  const params = new URLSearchParams({
    componentName: component,
    projectName: project,
    organizationName: organization,
  });

  backendUrl.search = params.toString();

  const res = await fetch(backendUrl, {
    headers: {
      Authroization: `Bearer ${token}`,
    },
  });

  return await res.json();
}
