import React, { useState, useEffect } from 'react';
import {
  Table,
  TableColumn,
  Progress,
  EmptyState,
  ResponseErrorPanel,
  Link,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { makeStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
import type { Component } from '../../../../../plugins/choreo-kubernetes-backend/src/services/ProjectListService/types';
import { choreoApiRef } from '../../api';

const useStyles = makeStyles(theme => ({
  container: {
    width: '100%',
  },
  title: {
    marginBottom: theme.spacing(2),
  },
  chip: {
    margin: theme.spacing(0.5),
  },
}));

type ComponentListProps = {
  projectName: string;
  namespace?: string;
};

export const ComponentList = ({
  projectName,
  namespace,
}: ComponentListProps) => {
  const classes = useStyles();
  const choreoApi = useApi(choreoApiRef);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    async function fetchComponents() {
      if (!projectName) return;

      try {
        setLoading(true);
        const data = await choreoApi.getComponentsForProject(
          projectName,
          namespace,
        );
        setComponents(data);
        setError(undefined);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchComponents();
  }, [choreoApi, projectName, namespace]);

  const columns: TableColumn[] = [
    {
      title: 'Name',
      field: 'name',
      highlight: true,
    },
    {
      title: 'Description',
      field: 'description',
    },
    {
      title: 'Type',
      field: 'type',
    },
    {
      title: 'Repository',
      field: 'source.gitRepository.url',
      render: (row: any) => {
        const repoUrl = row?.source?.gitRepository?.url;
        return repoUrl ? (
          <Link to={repoUrl} target="_blank">
            {repoUrl}
          </Link>
        ) : (
          '-'
        );
      },
    },
  ];

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <ResponseErrorPanel error={error} />;
  } else if (!components.length) {
    return (
      <EmptyState
        title="No Components Found"
        description={`No components were found for project '${projectName}'.`}
        missing="info"
      />
    );
  }

  return (
    <div className={classes.container}>
      <Typography variant="h4" className={classes.title}>
        Components for {projectName}
      </Typography>
      <Table
        options={{
          search: true,
          paging: true,
          pageSize: 10,
          padding: 'dense',
        }}
        columns={columns}
        data={components}
      />
    </div>
  );
};
