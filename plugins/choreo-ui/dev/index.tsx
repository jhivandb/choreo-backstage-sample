import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { choreoPlugin, ChoreoUiPage } from '../src/plugin';

createDevApp()
  .registerPlugin(choreoPlugin)
  .addPage({
    element: <ChoreoUiPage />,
    title: 'Root Page',
    path: '/choreo-ui',
  })
  .render();
