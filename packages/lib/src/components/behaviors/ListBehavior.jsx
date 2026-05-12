import { useViewerContext } from '../ViewerContext.jsx';

export default function ListBehavior({ node, path }) {
  const { renderNode } = useViewerContext();

  // Object: each key is a descriptor rendered inline before its value
  if (!Array.isArray(node)) {
    return (
      <ul className="jdv-list">
        {Object.entries(node).map(([key, value]) => {
          const childPath = path ? `${path}.${key}` : key;
          return (
            <li key={key} className="jdv-list-item jdv-list-item--descriptor">
              <span className="jdv-list-descriptor">{key}</span>
              {renderNode(value, childPath)}
            </li>
          );
        })}
      </ul>
    );
  }

  // Array: one item per line
  return (
    <ul className="jdv-list">
      {node.map((item, idx) => {
        const childPath = `${path}[${idx}]`;
        return (
          <li key={idx} className="jdv-list-item">
            {renderNode(item, childPath)}
          </li>
        );
      })}
    </ul>
  );
}