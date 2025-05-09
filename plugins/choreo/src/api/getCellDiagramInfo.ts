import { Entity } from '@backstage/catalog-model/index';
import { DiscoveryApi, IdentityApi } from '@backstage/core-plugin-api';
import { CHOREO_LABELS, API_ENDPOINTS } from '../constants';

export async function getCellDiagramInfo(
  entity: Entity,
  discovery: DiscoveryApi,
  identity: IdentityApi,
) {
  const { token } = await identity.getCredentials();
  const backendUrl = new URL(
    `${await discovery.getBaseUrl('choreo')}${API_ENDPOINTS.CELL_DIAGRAM}`,
  );
  const project = entity.metadata.name;
  const organization = entity.metadata.labels?.[CHOREO_LABELS.ORGANIZATION];

  if (!project || !organization) {
    console.log('Missing required labels:', { project, organization });
    return [];
  }
  const params = new URLSearchParams({
    projectName: project,
    organizationName: organization,
  });

  backendUrl.search = params.toString();
  console.log('Request URL:', backendUrl.toString());

  const res = await fetch(backendUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch cell diagram info: ${res.status} ${res.statusText}`,
    );
  }

  return await res.json();
}
