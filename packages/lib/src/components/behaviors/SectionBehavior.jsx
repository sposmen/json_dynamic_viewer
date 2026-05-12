import { useState } from 'react';
import { useViewerContext } from '../ViewerContext.jsx';
import { BEHAVIORS, applySortOrder } from '../../config.js';
import { classifyValue } from '../../analyzer.js';
import EditableLabel from '../EditableLabel.jsx';
import TableBehavior from './TableBehavior.jsx';

export default function SectionBehavior({
  node,
  path,
  keyName,
  actualBehavior,
  effectiveBehavior,
  availableBehaviors,
  childCount,
  onBehaviorChange,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { config, configurable, onConfigChange, renderNode } = useViewerContext();

  const allKeys    = actualBehavior === BEHAVIORS.SECTION ? Object.keys(node) : [];
  const keyOrder   = config.keys[path]?.keyOrder;
  const sortedKeys = applySortOrder(allKeys, keyOrder);

  function moveKey(key, delta) {
    const idx  = sortedKeys.indexOf(key);
    const next = [...sortedKeys];
    [next[idx], next[idx + delta]] = [next[idx + delta], next[idx]];
    onConfigChange(path, { keyOrder: next });
  }

  return (
    <div className="jdv-section">
      <div className="jdv-section-header-row">
        <button className="jdv-section-toggle" onClick={() => setCollapsed((s) => !s)}>
          <span className="jdv-section-arrow">{collapsed ? '▶' : '▼'}</span>
        </button>

        <EditableLabel path={path} fallback={keyName ?? path} className="jdv-section-title" />

        <span className="jdv-node-meta">({childCount})</span>

        {configurable && (
          <select
            className="jdv-behavior-select"
            value={effectiveBehavior}
            onChange={onBehaviorChange}
          >
            {availableBehaviors.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        )}
      </div>

      {!collapsed && (
        <div className="jdv-section-body">
          {actualBehavior === BEHAVIORS.TABLE && (
            <TableBehavior node={node} path={path} />
          )}
          {actualBehavior === BEHAVIORS.SECTION && (
            sortedKeys.map((key, i) => {
              const val = node[key];
              const childPath = path ? `${path}.${key}` : key;
              const isPrimitive = classifyValue(val) === 'primitive';
              return (
                <div key={key} className={isPrimitive ? 'jdv-section-primitive-row' : 'jdv-section-node-row'}>
                  {configurable && (
                    <span className="jdv-sort-btns">
                      <button className="jdv-sort-btn" onClick={() => moveKey(key, -1)} disabled={i === 0}>↑</button>
                      <button className="jdv-sort-btn" onClick={() => moveKey(key,  1)} disabled={i === sortedKeys.length - 1}>↓</button>
                    </span>
                  )}
                  {isPrimitive && (
                    <EditableLabel path={childPath} fallback={key} className="jdv-section-field-label" />
                  )}
                  {renderNode(val, childPath)}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
