import { useViewerContext } from '../ViewerContext.jsx';
import NativeTable from './NativeTable.jsx';

export default function TableBehavior({ node, path }) {
  const { plugins } = useViewerContext();
  const adapter = plugins?.table;
  const TableComponent = adapter?.Component ?? NativeTable;
  return <TableComponent node={node} path={path} />;
}
