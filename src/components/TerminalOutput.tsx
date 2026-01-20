import { ChevronRight, Copy, Download } from "lucide-react";
import { toast } from "sonner";

interface TerminalOutputProps {
  output: string;
  target: string;
  compact?: boolean;
}

const TerminalOutput = ({ output, target, compact = false }: TerminalOutputProps) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard", {
      description: "Terminal output has been copied",
    });
  };

  const handleExport = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `traceroute-${target}-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported", {
      description: "File has been downloaded",
    });
  };

  return (
    <div className="cyber-panel p-2 glow-border h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ChevronRight className="w-3 h-3 text-primary" />
          <span className="font-display text-[10px] tracking-wider text-primary uppercase">
            Terminal Output
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            disabled={!output}
            className="cyber-button !px-2 !py-0.5 text-[10px] flex items-center gap-1 disabled:opacity-30"
          >
            <Copy className="w-2.5 h-2.5" />
            Copy
          </button>
          <button
            onClick={handleExport}
            disabled={!output}
            className="cyber-button !px-2 !py-0.5 text-[10px] flex items-center gap-1 disabled:opacity-30"
          >
            <Download className="w-2.5 h-2.5" />
            Export
          </button>
        </div>
      </div>

      <div className="relative bg-background/50 border border-border/50 rounded p-2 flex-1 overflow-auto">
        {/* Scan line effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded">
          <div className="absolute left-0 right-0 h-8 bg-gradient-to-b from-primary/5 to-transparent animate-scan" />
        </div>
        
        {output ? (
          <pre className="terminal-text text-foreground/90 whitespace-pre-wrap">
            {output.split("\n").map((line, i) => (
              <div key={i} className="hover:bg-primary/5 transition-colors">
                <span className="text-muted-foreground select-none mr-3">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={
                  line.includes("*") 
                    ? "text-destructive/70" 
                    : line.includes("ms") 
                    ? "text-foreground" 
                    : "text-muted-foreground"
                }>
                  {line}
                </span>
              </div>
            ))}
          </pre>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <span className="terminal-text cursor-blink">Awaiting input</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalOutput;
