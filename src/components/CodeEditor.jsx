import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { vim } from "@replit/codemirror-vim";
import { useAppState } from "../lib/AppStateContext";

function CodeEditor({ value, onChange, onRun, onSubmit }) {
  const [vimEnabled, setVimEnabled] = useState(false);
  const { theme } = useAppState();

  return (
    <div className="card code-editor-card">
      <div className="code-editor-header">
        <h3>Code Editor</h3>
        <div className="code-editor-actions">
          {onRun && (
            <button type="button" className="run-btn" onClick={onRun}>
              Run Code
            </button>
          )}
          {onSubmit && (
            <button type="button" className="submit-btn" onClick={onSubmit}>
              Submit
            </button>
          )}
        </div>
      </div>
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={vimEnabled ? [vim(), python()] : [python()]}
        basicSetup={{ lineNumbers: true }}
        theme={theme === "dark" ? "dark" : "light"}
        height="100%"
      />
      <div className="editor-actions">
        <label style={{ marginLeft: "1rem", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={vimEnabled}
            onChange={(e) => setVimEnabled(e.target.checked)}
            style={{ marginRight: "0.4rem" }}
          />
          Vim
        </label>
      </div>
    </div>
  );
}

export default CodeEditor;
