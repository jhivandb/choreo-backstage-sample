import React from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import {
  Content,
  ContentHeader,
  Header,
  HeaderLabel,
  Page,
  TabbedLayout,
} from '@backstage/core-components';
import { Grid, Card, CardContent, Typography, Box } from '@material-ui/core';
import { StatusOK, StatusError } from '@backstage/core-components';

interface Environment {
  name: string;
  deployment: {
    status: 'success' | 'failed';
    lastDeployed: string;
  };
  endpoint: {
    url: string;
    status: 'active' | 'inactive';
  };
}

export const Environments = () => {
  const { entity } = useEntity();

  // Mock data - replace with actual data fetching
  const environments: Environment[] = [
    {
      name: 'Development',
      deployment: {
        status: 'success',
        lastDeployed: '2024-03-20T10:00:00Z',
      },
      endpoint: {
        url: 'https://dev-api.example.com',
        status: 'active',
      },
    },
    {
      name: 'Staging',
      deployment: {
        status: 'failed',
        lastDeployed: '2024-03-19T15:30:00Z',
      },
      endpoint: {
        url: 'https://staging-api.example.com',
        status: 'inactive',
      },
    },
    {
      name: 'Production',
      deployment: {
        status: 'failed',
        lastDeployed: '2024-03-19T15:30:00Z',
      },
      endpoint: {
        url: 'https://staging-api.example.com',
        status: 'inactive',
      },
    },
  ];

  return (
    <Page themeId="tool">
      <Header title="Environments" type="tool">
        <HeaderLabel label="Component" value={entity.metadata.name} />
      </Header>
      <Content>
        <ContentHeader title="Environment Deployments" />
        <TabbedLayout>
          {environments.map(env => (
            <TabbedLayout.Route key={env.name} path={env.name} title={env.name}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Deployment Status</Typography>
                      <Box display="flex" alignItems="center" mt={2}>
                        {env.deployment.status === 'success' ? (
                          <StatusOK />
                        ) : (
                          <StatusError />
                        )}
                        <Typography variant="body1" style={{ marginLeft: 8 }}>
                          {env.deployment.status === 'success'
                            ? 'Successful'
                            : 'Failed'}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        Last deployed:{' '}
                        {new Date(env.deployment.lastDeployed).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Endpoint</Typography>
                      <Box display="flex" alignItems="center" mt={2}>
                        {env.endpoint.status === 'active' ? (
                          <StatusOK />
                        ) : (
                          <StatusError />
                        )}
                        <Typography variant="body1" style={{ marginLeft: 8 }}>
                          {env.endpoint.status === 'active'
                            ? 'Active'
                            : 'Inactive'}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        URL: {env.endpoint.url}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabbedLayout.Route>
          ))}
        </TabbedLayout>
      </Content>
    </Page>
  );
};
