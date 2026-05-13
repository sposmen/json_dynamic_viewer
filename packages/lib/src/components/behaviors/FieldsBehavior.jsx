import { useViewerContext } from '../ViewerContext.jsx';
import EditableLabel from '../EditableLabel.jsx';
import { applySortOrder, pathToClass } from '../../config.js';

export default function FieldsBehavior({ node, path }) {
  const { config, configurable, onConfigChange, renderNode } = useViewerContext();

  const allKeys     = Object.keys(node);
  const keyOrder    = config.keys[path]?.keyOrder;
  const sortedKeys  = applySortOrder(allKeys, keyOrder);

  function moveKey(key, delta) {
    const idx  = sortedKeys.indexOf(key);
    const next = [...sortedKeys];
    [next[idx], next[idx + delta]] = [next[idx + delta], next[idx]];
    onConfigChange(path, { keyOrder: next });
  }

  return (
    <div className={`jdv-fields${configurable ? ' jdv-fields--sortable' : ''}`}>
      {sortedKeys.map((key, i) => {
        const childPath = path ? `${path}.${key}` : key;
        const hidden = config.keys[childPath]?.hidden;
        if (hidden === true) return null;
        return (
          <div key={key} className={`jdv-field-row ${pathToClass(childPath)}`} data-jdv-path={childPath}>
            {configurable && (
              <span className="jdv-sort-btns">
                <button className="jdv-sort-btn" onClick={() => moveKey(key, -1)} disabled={i === 0}>↑</button>
                <button className="jdv-sort-btn" onClick={() => moveKey(key,  1)} disabled={i === sortedKeys.length - 1}>↓</button>
              </span>
            )}
            <EditableLabel path={childPath} fallback={key} className="jdv-field-label" />
            <span className="jdv-field-value">
              {hidden === 'value'
                ? <span className="jdv-hidden-value">[hidden]</span>
                : renderNode(node[key], childPath)
              }
            </span>
          </div>
        );
      })}
    </div>
  );
}
