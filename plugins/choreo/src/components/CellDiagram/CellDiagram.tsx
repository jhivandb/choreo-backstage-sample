import React, { lazy, Suspense } from 'react';
import { Entity } from '@backstage/catalog-model';
import {
  Content,
  ContentHeader,
  Header,
  Page,
  Progress,
} from '@backstage/core-components';

import {
  CustomTooltips,
  DiagramLayer,
  MoreVertMenuItem,
  Project,
} from '@wso2-enterprise/choreo-cell-diagram';
import { sampleProject } from './sampleProject';

interface CellDiagramProps {
  entity: Entity;
}

const CellView = lazy(() =>
  import('@wso2-enterprise/choreo-cell-diagram').then(module => ({
    default: module.CellDiagram,
  })),
);

export const CellDiagram = () => {
  return (
    <Page themeId="tool">
      <Header title="Cell-Diagram" />
      <Content>
        <ContentHeader title="Cell Diagram View" />
        <Suspense fallback={<Progress />}>
          <CellView project={sampleProject} />
        </Suspense>
      </Content>
    </Page>
  );
};
