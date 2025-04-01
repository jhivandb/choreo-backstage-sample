import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { ProjectList } from '../ProjectList';
import { ComponentList } from '../ComponentList';
import type { Project } from '../../../../../plugins/choreo-kubernetes-backend/src/services/ProjectListService/types';

const useStyles = makeStyles(theme => ({
  container: {
    width: '100%',
  },
  backButton: {
    marginBottom: theme.spacing(2),
  },
}));

type ProjectPageProps = {
  /** Optional namespace to filter projects */
  namespace?: string;
};

export const ProjectPage = ({ namespace }: ProjectPageProps) => {
  const classes = useStyles();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleProjectSelected = (project: Project) => {
    setSelectedProject(project);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
  };

  if (selectedProject) {
    return (
      <div className={classes.container}>
        <Button
          className={classes.backButton}
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToProjects}
        >
          Back to Projects
        </Button>
        <ComponentList
          projectName={selectedProject.name}
          namespace={namespace}
        />
      </div>
    );
  }

  return (
    <ProjectList
      namespace={namespace}
      onProjectSelected={handleProjectSelected}
    />
  );
};
