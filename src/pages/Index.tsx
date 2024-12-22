import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { darcula } from '@uiw/codemirror-theme-darcula';

const Index = () => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - File Tree (placeholder for now) */}
      <div className="w-1/3 bg-sidebar p-4 border-r border-border">
        <h2 className="text-xl font-bold mb-4">Files</h2>
        {/* File tree will go here */}
      </div>

      {/* Right side - Code Preview */}
      <div className="w-2/3 bg-background p-4">
        <CodeMirror
          value="// Your code will appear here"
          height="100%"
          theme={darcula}
          extensions={[javascript()]}
          className="h-[calc(100vh-2rem)]"
        />
      </div>
    </div>
  );
};

export default Index;