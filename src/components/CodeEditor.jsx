import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { vim } from "@replit/codemirror-vim";

function CodeEditor({ value, onChange, onRun, output, error }) {
  const [vimEnabled, setVimEnabled] = useState(false);

  return (
    <div className="card">
      <h3>Code Editor</h3>
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={vimEnabled ? [vim(), python()] : [python()]}
        basicSetup={{ lineNumbers: true }}

      />
      <div className="editor-actions">
        <button type="button" onClick={onRun}>
          Run Code
        </button>
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
      {(output || error) && (
        <pre className={`run-output ${error ? "error" : ""}`}>
          {error || output}
        </pre>
      )}
    </div>
  );
}

export default CodeEditor;
