import { useState } from 'react';
import { useViewerContext } from './ViewerContext.jsx';
import { BEHAVIORS } from '../config.js';
import { classifyValue, suggestBehavior } from '../analyzer.js';
import ListBehavior from './behaviors/ListBehavior.jsx';
import FieldsBehavior from './behaviors/FieldsBehavior.jsx';
import SectionBehavior from './behaviors/SectionBehavior.jsx';
import PrimitiveNode from './primitives/PrimitiveNode.jsx';
import EditableLabel from './EditableLabel.jsx';

function elementToString(v) {
  if (v == null)             return 'null';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export default function JsonNode({ value, path, keyName }) {
  const { config, configurable, onConfigChange } = useViewerContext();
  const [expanded, setExpanded] = useState(false);
  const [resolvedBehavior, setResolvedBehavior] = useState(null);

  const kind = classifyValue(value);

  if (kind === 'primitive') {
    return <PrimitiveNode value={value} path={path} />;
  }

  const isArray = Array.isArray(value);
  const keyConfig = config.keys[path] ?? {};

  const availableBehaviors = Object.values(BEHAVIORS).filter((b) => {
    if (b === BEHAVIORS.TABLE   && !isArray) return false;
    if (b === BEHAVIORS.SECTION && isArray)  return false;
    if (b === BEHAVIORS.STRING  && !isArray) return false;
    return true;
  });

  const requestedBehavior = resolvedBehavior ?? keyConfig.behavior ?? BEHAVIORS.AUTO;

  const effectiveBehavior =
    (requestedBehavior === BEHAVIORS.TABLE   && !isArray) ||
    (requestedBehavior === BEHAVIORS.SECTION && isArray)  ||
    (requestedBehavior === BEHAVIORS.STRING  && !isArray)
      ? BEHAVIORS.AUTO
      : requestedBehavior;

  const actualBehavior = effectiveBehavior === BEHAVIORS.AUTO
    ? suggestBehavior(value)
    : effectiveBehavior;

  function handleBehaviorChange(e) {
    const next = e.target.value;
    setResolvedBehavior(next);
    onConfigChange(path, { behavior: next });
  }

  const childCount = isArray ? value.length : Object.keys(value).length;

  // STRING: inline comma-separated, no expand step needed
  if (actualBehavior === BEHAVIORS.STRING) {
    const text = value.map(elementToString).join(', ');
    return (
      <span className="jdv-string-array-node">
        <span className="jdv-type-string jdv-string-array-value">{text}</span>
        {configurable && (
          <select className="jdv-behavior-select" value={effectiveBehavior} onChange={handleBehaviorChange}>
            {availableBehaviors.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        )}
      </span>
    );
  }

  // SECTION / TABLE: accordion-style header
  if (actualBehavior === BEHAVIORS.SECTION || actualBehavior === BEHAVIORS.TABLE) {
    return (
      <SectionBehavior
        node={value}
        path={path}
        keyName={keyName}
        actualBehavior={actualBehavior}
        effectiveBehavior={effectiveBehavior}
        availableBehaviors={availableBehaviors}
        childCount={childCount}
        onBehaviorChange={handleBehaviorChange}
      />
    );
  }

  // Default: expand-button style
  return (
    <div className="jdv-node">
      <div className="jdv-node-header">
        <button
          className="jdv-expand-btn"
          onClick={() => setExpanded((s) => !s)}
          aria-expanded={expanded}
        >
          <span className="jdv-expand-arrow">{expanded ? '▼' : '▶'}</span>
        </button>

        <EditableLabel path={path} fallback={keyName ?? path} />

        <span className="jdv-node-meta">({childCount})</span>

        {expanded && configurable && (
          <select className="jdv-behavior-select" value={effectiveBehavior} onChange={handleBehaviorChange}>
            {availableBehaviors.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        )}
      </div>

      {expanded && (
        <div className="jdv-node-body">
          {actualBehavior === BEHAVIORS.LIST   && <ListBehavior   node={value} path={path} />}
          {actualBehavior === BEHAVIORS.FIELDS && <FieldsBehavior node={value} path={path} />}
        </div>
      )}
    </div>
  );
}
