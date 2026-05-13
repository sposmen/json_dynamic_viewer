import TabulatorTable from './TabulatorTable.jsx';

export function createTabulatorAdapter({ themes = [] } = {}) {
  return { Component: TabulatorTable, themes };
}

export const TabulatorAdapter = createTabulatorAdapter();
