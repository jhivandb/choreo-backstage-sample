import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { choreoUiPlugin, ChoreoUiPage } from '../src/plugin';

createDevApp()
  .registerPlugin(choreoUiPlugin)
  .addPage({
    element: <ChoreoUiPage />,
    title: 'Root Page',
    path: '/choreo-ui',
  })
  .render();
