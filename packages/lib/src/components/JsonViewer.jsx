import { useCallback, useContext, useMemo, useState } from 'react';
import { ViewerContext } from './ViewerContext.jsx';
import JsonNode from './JsonNode.jsx';
import { createConfig, setKeyConfig } from '../config.js';
import { themes } from '../themes.js';
import '../styles.css';

export default function JsonViewer({ data, config: externalConfig, onConfigChange, theme, configurable = true, path: pathPrefix, plugins = {} }) {
  const parentCtx = useContext(ViewerContext);
  const isConnected = Boolean(parentCtx && pathPrefix !== undefined);

  const [internalConfig, setInternalConfig] = useState(() => createConfig());

  const config = isConnected ? parentCtx.config : (externalConfig ?? internalConfig);
  const effectiveConfigurable = isConnected ? parentCtx.configurable : configurable;
  const effectivePlugins = isConnected ? parentCtx.plugins : plugins;

  const parsed = useMemo(() => {
    if (typeof data === 'string') {
      try { return JSON.parse(data); }
      catch { return { _error: 'Invalid JSON' }; }
    }
    return data;
  }, [data]);

  const handleConfigChange = useCallback((path, patch) => {
    if (isConnected) {
      parentCtx.onConfigChange(path, patch);
    } else {
      const next = setKeyConfig(config, path, patch);
      if (onConfigChange) {
        onConfigChange(next);
      } else {
        setInternalConfig(next);
      }
    }
  }, [isConnected, parentCtx, config, onConfigChange]);

  const renderNode = useCallback((value, path) => (
    <JsonNode value={value} path={path} keyName={path.split('.').pop()} />
  ), []);

  const ctx = useMemo(() => ({
    config,
    configurable: effectiveConfigurable,
    onConfigChange: handleConfigChange,
    renderNode,
    plugins: effectivePlugins,
  }), [config, effectiveConfigurable, handleConfigChange, renderNode, effectivePlugins]);

  const themeVars = useMemo(() => {
    if (!theme) return {};
    return typeof theme === 'string' ? (themes[theme] ?? {}) : theme;
  }, [theme]);

  const nodes = typeof parsed === 'object' && parsed !== null
    ? Object.entries(parsed).map(([key, value]) => {
        const nodePath = isConnected ? `${pathPrefix}.${key}` : key;
        return <JsonNode key={key} value={value} path={nodePath} keyName={key} />;
      })
    : <span className="jdv-primitive">{String(parsed)}</span>;

  if (isConnected) {
    return (
      <ViewerContext.Provider value={ctx}>
        <div className="jdv-nested-viewer">{nodes}</div>
      </ViewerContext.Provider>
    );
  }

  return (
    <ViewerContext.Provider value={ctx}>
      <div className="jdv-root" style={themeVars}>
        {nodes}
      </div>
    </ViewerContext.Provider>
  );
}