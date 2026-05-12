import { createContext, useContext } from 'react';

export const ViewerContext = createContext(null);

export function useViewerContext() {
  const ctx = useContext(ViewerContext);
  if (!ctx) throw new Error('useViewerContext must be used inside JsonViewer');
  return ctx;
}