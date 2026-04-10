function CodeEditor({ value, onChange, onRun, output, error }) {
  return (
    <div className="card">
      <h3>Code Editor</h3>
      <textarea
        className="code-editor"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Write your solution here..."
      />
      <div className="editor-actions">
        <button type="button" onClick={onRun}>
          Run Code
        </button>
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
