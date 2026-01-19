import { useState } from 'react';
// @ts-ignore - Tauri v2 import workaround
const invoke = window.__TAURI__.invoke;

interface Hop {
  number: number;
  host: string;
  times: string[];
}

function App() {
  const [target, setTarget] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rawOutput, setRawOutput] = useState('');
  const [parsedHops, setParsedHops] = useState<Hop[]>([]);
  const [error, setError] = useState('');

  const runTraceroute = async () => {
    if (!target.trim()) {
      setError('Please enter a target');
      return;
    }

    setIsLoading(true);
    setError('');
    setRawOutput('');
    setParsedHops([]);

    try {
      const result = await invoke<string>('run_traceroute', { target });
      setRawOutput(result);
      parseHops(result);
    } catch (err) {
      setError(err as string);
      setRawOutput('');
      setParsedHops([]);
    } finally {
      setIsLoading(false);
    }
  };

  const parseHops = (output: string) => {
    const lines = output.split('\n');
    const hops: Hop[] = [];
    
    for (const line of lines) {
      // Windows tracert format: 1    <1 ms    <1 ms    <1 ms  192.168.1.1
      const winMatch = line.match(/^(\d+)\s+(.+?)\s+(\d+|\*)\s+(ms|\*)/);
      
      // Unix traceroute format: 1  192.168.1.1  0.500 ms  0.400 ms  0.300 ms
      const unixMatch = line.match(/^(\d+)\s+([^\s]+)\s+(.+)$/);
      
      if (winMatch) {
        const [, hopNum, host] = winMatch;
        const times = line.match(/(\d+|\*)\s+ms/g)?.map(t => t.replace(/\s+ms/, '')) || [];
        hops.push({
          number: parseInt(hopNum),
          host: host.trim(),
          times: times.map(t => t === '*' ? 'Timeout' : `${t}ms`)
        });
      } else if (unixMatch) {
        const [, hopNum, host] = unixMatch;
        const times = line.match(/(\d+\.\d+|\*)\s+ms/g)?.map(t => t.replace(/\s+ms/, '')) || [];
        hops.push({
          number: parseInt(hopNum),
          host: host.trim(),
          times: times.map(t => t === '*' ? 'Timeout' : `${t}ms`)
        });
      }
    }
    
    setParsedHops(hops);
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(rawOutput);
  };

  const exportToFile = () => {
    const blob = new Blob([rawOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traceroute-${target}-${new Date().toISOString().slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">TraceRT</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Enter domain or IP address"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              onKeyDown={(e) => e.key === 'Enter' && runTraceroute()}
            />
            <button
              onClick={runTraceroute}
              disabled={isLoading || !target.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Running...' : 'Run Trace'}
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              Error: {error}
            </div>
          )}
        </div>

        {(rawOutput || parsedHops.length > 0) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Results</h2>
              <div className="flex gap-2">
                <button
                  onClick={copyOutput}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Copy Output
                </button>
                <button
                  onClick={exportToFile}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Export to .txt
                </button>
              </div>
            </div>

            {parsedHops.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3 text-gray-700">Parsed Hops</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-2 px-4 border-b text-left">Hop</th>
                        <th className="py-2 px-4 border-b text-left">Host/IP</th>
                        <th className="py-2 px-4 border-b text-left">Times</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedHops.map((hop) => (
                        <tr key={hop.number} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border-b">{hop.number}</td>
                          <td className="py-2 px-4 border-b font-mono">{hop.host}</td>
                          <td className="py-2 px-4 border-b">
                            {hop.times.join(', ') || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-700">Raw Output</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-sm">
                {rawOutput}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;