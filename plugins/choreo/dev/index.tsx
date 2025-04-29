import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { choreoPlugin, ChoreoPage } from '../src/plugin';

createDevApp()
  .registerPlugin(choreoPlugin)
  .addPage({
    element: <ChoreoPage />,
    title: 'Root Page',
    path: '/choreo',
  })
  .render();
