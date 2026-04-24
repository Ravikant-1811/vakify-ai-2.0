import { useState } from 'react';
import { Play, CheckCircle2, XCircle, AlertCircle, Code2, Terminal } from 'lucide-react';

export function CodingLab() {
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [code, setCode] = useState(`# Write your code here
def binary_search(arr, target):
    left, right = 0, len(arr) - 1

    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1

# Test your function
result = binary_search([1, 3, 5, 7, 9], 5)
print(f"Result: {result}")
`);
  const [output, setOutput] = useState('');
  const [tests, setTests] = useState([
    { name: 'Test Case 1: Find existing element', passed: true },
    { name: 'Test Case 2: Element not in array', passed: true },
    { name: 'Test Case 3: Empty array', passed: false },
    { name: 'Test Case 4: Single element', passed: true },
  ]);
  const [running, setRunning] = useState(false);

  const languages = [
    { id: 'python', name: 'Python' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'java', name: 'Java' },
    { id: 'cpp', name: 'C++' },
    { id: 'c', name: 'C' },
  ];

  const handleRun = async () => {
    setRunning(true);
    setOutput('Running code...\n');

    await new Promise(resolve => setTimeout(resolve, 1000));

    setOutput(`Result: 2

Tests Passed: 3/4
XP Earned: +25

Great work! You've implemented binary search correctly.
Fix the edge case for empty arrays to earn full points.`);
    setRunning(false);
  };

  const passedTests = tests.filter(t => t.passed).length;
  const totalTests = tests.length;
  const passRate = (passedTests / totalTests) * 100;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl mb-2">Coding Lab</h1>
        <p className="text-muted-foreground">
          Practice coding with instant feedback and test results
        </p>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex gap-2">
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setSelectedLanguage(lang.id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedLanguage === lang.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border hover:bg-muted'
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
        <div className="flex-1"></div>
        <button
          onClick={handleRun}
          disabled={running}
          className="bg-secondary text-secondary-foreground px-6 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          <Play className="w-5 h-5" />
          Run Code
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        <div className="flex flex-col bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" />
              <h3>Code Editor</h3>
            </div>
            <span className="text-sm text-muted-foreground">{selectedLanguage}</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 p-4 font-mono text-sm bg-primary/5 resize-none focus:outline-none"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/30">
              <Terminal className="w-5 h-5 text-secondary" />
              <h3>Output</h3>
            </div>
            <div className="flex-1 p-4 font-mono text-sm bg-muted/20 overflow-auto whitespace-pre-wrap">
              {output || 'Click "Run Code" to see output...'}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-secondary" />
                Test Results
              </h3>
              <span className="text-sm text-muted-foreground">
                {passedTests}/{totalTests} Passed
              </span>
            </div>

            <div className="mb-4">
              <div className="bg-muted rounded-full h-2 mb-2">
                <div
                  className="bg-secondary h-full rounded-full transition-all"
                  style={{ width: `${passRate}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {passRate.toFixed(0)}% Tests Passing
              </div>
            </div>

            <div className="space-y-2">
              {tests.map((test, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    test.passed ? 'bg-secondary/10' : 'bg-destructive/10'
                  }`}
                >
                  {test.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                  )}
                  <span className="text-sm">{test.name}</span>
                </div>
              ))}
            </div>

            {passedTests < totalTests && (
              <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <div className="text-sm text-accent">
                  Hint: Handle the edge case when the array is empty
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
