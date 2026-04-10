function CodeEditor({ value, onChange }) {
  return (
    <div className="card">
      <h3>Code Editor</h3>
      <textarea
        className="code-editor"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Write your solution here..."
      />
    </div>
  );
}

export default CodeEditor;
