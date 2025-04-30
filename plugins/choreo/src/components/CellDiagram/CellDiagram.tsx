import React, { lazy, Suspense } from 'react';
import {
  Content,
  ContentHeader,
  Header,
  Page,
  Progress,
} from '@backstage/core-components';

import { sampleProject } from './sampleProject';

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
