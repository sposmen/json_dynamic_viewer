import { useEffect, useRef, useState } from 'react';
import { useViewerContext } from './ViewerContext.jsx';

export default function EditableLabel({ path, fallback, className = '' }) {
  const { config, configurable, onConfigChange } = useViewerContext();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  const saved = config.keys[path]?.label;
  const label = saved || fallback;
  const isCustom = Boolean(saved);

  function startEdit(e) {
    e.stopPropagation();
    setDraft(saved ?? fallback);
    setEditing(true);
  }

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    onConfigChange(path, { label: trimmed && trimmed !== fallback ? trimmed : null });
    setEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter')  { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { setEditing(false); }
    e.stopPropagation();
  }

  if (!configurable) {
    return (
      <span className={`jdv-editable-label ${className}`}>
        <span className={`jdv-label-text ${isCustom ? 'jdv-label-custom' : ''}`}>{label}</span>
      </span>
    );
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="jdv-label-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span className={`jdv-editable-label ${className}`}>
      <span className={`jdv-label-text ${isCustom ? 'jdv-label-custom' : ''}`}>{label}</span>
      <button className="jdv-label-edit-btn" onClick={startEdit} title="Rename key">✏</button>
    </span>
  );
}
