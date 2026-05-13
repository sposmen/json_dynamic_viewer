import GridJsTable from './GridJsTable.jsx';

export function createGridJsAdapter({ themes = [] } = {}) {
  return { Component: GridJsTable, themes };
}

export const GridJsAdapter = createGridJsAdapter();
