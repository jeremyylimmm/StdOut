import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { vim } from "@replit/codemirror-vim";
import { useAppState } from "../lib/AppStateContext";

function CodeEditor({ value, onChange }) {
  const [vimEnabled, setVimEnabled] = useState(false);
  const { theme } = useAppState();

  return (
    <div className="card code-editor-card">
      <h3>Code Editor</h3>
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
