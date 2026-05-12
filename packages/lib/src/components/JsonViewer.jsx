import { useCallback, useMemo, useState } from 'react';
import { ViewerContext } from './ViewerContext.jsx';
import JsonNode from './JsonNode.jsx';
import { createConfig, setKeyConfig } from '../config.js';
import { themes } from '../themes.js';
import '../styles.css';

export default function JsonViewer({ data, config: externalConfig, onConfigChange, theme, configurable = true }) {
  const [internalConfig, setInternalConfig] = useState(() => createConfig());

  const config = externalConfig ?? internalConfig;

  const parsed = useMemo(() => {
    if (typeof data === 'string') {
      try { return JSON.parse(data); }
      catch { return { _error: 'Invalid JSON' }; }
    }
    return data;
  }, [data]);

  const handleConfigChange = useCallback((path, patch) => {
    const next = setKeyConfig(config, path, patch);
    if (onConfigChange) {
      onConfigChange(next);
    } else {
      setInternalConfig(next);
    }
  }, [config, onConfigChange]);

  const renderNode = useCallback((value, path) => (
    <JsonNode value={value} path={path} keyName={path.split('.').pop()} />
  ), []);

  const ctx = useMemo(() => ({
    config,
    configurable,
    onConfigChange: handleConfigChange,
    renderNode,
  }), [config, configurable, handleConfigChange, renderNode]);

  const themeVars = useMemo(() => {
    if (!theme) return {};
    return typeof theme === 'string' ? (themes[theme] ?? {}) : theme;
  }, [theme]);

  return (
    <ViewerContext.Provider value={ctx}>
      <div className="jdv-root" style={themeVars}>
        {typeof parsed === 'object' && parsed !== null
          ? Object.entries(parsed).map(([key, value]) => (
              <JsonNode key={key} value={value} path={key} keyName={key} />
            ))
          : <span className="jdv-primitive">{String(parsed)}</span>
        }
      </div>
    </ViewerContext.Provider>
  );
}