import { useViewerContext } from '../ViewerContext.jsx';
import { pathToClass } from '../../config.js';

export default function ListBehavior({ node, path }) {
  const { config, renderNode } = useViewerContext();

  // Object: each key is a descriptor rendered inline before its value
  if (!Array.isArray(node)) {
    return (
      <ul className="jdv-list">
        {Object.entries(node).map(([key, value]) => {
          const childPath = path ? `${path}.${key}` : key;
          const hidden = config.keys[childPath]?.hidden;
          if (hidden === true) return null;
          return (
            <li key={key} className={`jdv-list-item jdv-list-item--descriptor ${pathToClass(childPath)}`} data-jdv-path={childPath}>
              <span className="jdv-list-descriptor">{key}</span>
              {hidden === 'value'
                ? <span className="jdv-hidden-value">[hidden]</span>
                : renderNode(value, childPath)
              }
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
        const hidden = config.keys[childPath]?.hidden;
        if (hidden === true) return null;
        return (
          <li key={idx} className={`jdv-list-item ${pathToClass(childPath)}`} data-jdv-path={childPath}>
            {hidden === 'value'
              ? <span className="jdv-hidden-value">[hidden]</span>
              : renderNode(item, childPath)
            }
          </li>
        );
      })}
    </ul>
  );
}
