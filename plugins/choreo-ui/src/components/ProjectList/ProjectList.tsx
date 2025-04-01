import React, { useState, useEffect } from 'react';
import {
  Table,
  TableColumn,
  Progress,
  EmptyState,
  ResponseErrorPanel,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { makeStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
import type { Project } from '../../../../../plugins/choreo-kubernetes-backend/src/services/ProjectListService/types';
import { choreoApiRef } from '../../api';

const useStyles = makeStyles(theme => ({
  container: {
    width: '100%',
  },
  title: {
    margin: theme.spacing(0, 0, 2, 2),
  },
  tableContainer: {
    '& tbody tr': {
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
    },
  },
}));

type ProjectListProps = {
  /** Optional namespace to filter projects */
  namespace?: string;
  /** Callback for when a project is selected */
  onProjectSelected?: (project: Project) => void;
};

export const ProjectList = ({
  namespace,
  onProjectSelected,
}: ProjectListProps) => {
  const classes = useStyles();
  const choreoApi = useApi(choreoApiRef);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        const data = await choreoApi.listProjects(namespace);
        setProjects(data);
        setError(undefined);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [choreoApi, namespace]);

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
      title: 'Organization',
      field: 'organization',
    },
  ];

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <ResponseErrorPanel error={error} />;
  } else if (!projects.length) {
    return (
      <EmptyState
        title="No Projects Found"
        description="No projects were found in this namespace"
        missing="info"
      />
    );
  }

  return (
    <div className={classes.container}>
      <Typography variant="h4" className={classes.title}>
        Projects
      </Typography>
      <div className={onProjectSelected ? classes.tableContainer : undefined}>
        <Table
          options={{
            search: true,
            paging: true,
            pageSize: 10,
            padding: 'dense',
          }}
          columns={columns}
          data={projects}
          onRowClick={
            onProjectSelected
              ? (_, rowData) => onProjectSelected(rowData as Project)
              : undefined
          }
        />
      </div>
    </div>
  );
};
