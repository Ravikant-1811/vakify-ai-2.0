import { useEffect, useState } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Code2,
  Terminal,
  RotateCcw,
  CircleDashed,
} from 'lucide-react';
import { apiFetch } from '../lib/api';

type RunResponse = {
  status: string;
  stdout: string;
  stderr: string;
  runner: string;
  note: string;
  tests: Array<{ name: string; passed: boolean }>;
  passed_tests: number;
  total_tests: number;
  score: number;
  submission_id?: number;
};

const languages = [
  { id: 'python', name: 'Python' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'java', name: 'Java' },
  { id: 'cpp', name: 'C++' },
  { id: 'c', name: 'C' },
];

export function TrainingCoder() {
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState('');
  const [tests, setTests] = useState<Array<{ name: string; passed: boolean }>>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const codeKey = `vakify.training.code.${selectedLanguage}`;
    const stdinKey = `vakify.training.stdin.${selectedLanguage}`;
    const savedCode = window.localStorage.getItem(codeKey);
    const savedStdin = window.localStorage.getItem(stdinKey);
    setCode(savedCode ?? '');
    setStdin(savedStdin ?? '');
    setOutput('');
    setTests([]);
  }, [selectedLanguage]);

  useEffect(() => {
    window.localStorage.setItem(`vakify.training.code.${selectedLanguage}`, code);
  }, [code, selectedLanguage]);

  useEffect(() => {
    window.localStorage.setItem(`vakify.training.stdin.${selectedLanguage}`, stdin);
  }, [stdin, selectedLanguage]);

  const resetBlank = () => {
    setCode('');
    setStdin('');
    setOutput('');
    setTests([]);
    window.localStorage.removeItem(`vakify.training.code.${selectedLanguage}`);
    window.localStorage.removeItem(`vakify.training.stdin.${selectedLanguage}`);
  };

  const handleRun = async () => {
    setRunning(true);
    setOutput('Running code...\n');
    try {
      const response = await apiFetch<RunResponse>('/api/lab/run', {
        method: 'POST',
        body: JSON.stringify({
          language: selectedLanguage,
          source_code: code,
          stdin,
        }),
      });

      setOutput(
        `${response.stdout || '(no stdout)'}\n${response.stderr ? `\n${response.stderr}` : ''}\n\nTests Passed: ${response.passed_tests}/${response.total_tests}\nScore: ${response.score}%\nRunner: ${response.runner}\n${response.note ? `\n${response.note}` : ''}`,
      );
      setTests(response.tests || []);
    } catch (error) {
      setOutput(error instanceof Error ? error.message : 'Unable to run code right now.');
      setTests([
        { name: 'Program compiled or executed', passed: false },
        { name: 'Blank editor is usable', passed: false },
        { name: 'Program input accepted', passed: false },
        { name: 'Output panel updated', passed: false },
      ]);
    } finally {
      setRunning(false);
    }
  };

  const passedTests = tests.filter((test) => test.passed).length;
  const totalTests = tests.length;
  const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col p-6 max-w-7xl mx-auto gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2">Training Coder</h1>
          <p className="text-muted-foreground max-w-4xl">
            A clean blank editor for practice, experiments, and freeform coding. Nothing is auto-filled.
          </p>
        </div>
        <button
          onClick={resetBlank}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Blank
        </button>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setSelectedLanguage(lang.id)}
              className={`px-4 py-2 rounded-xl transition-colors ${
                selectedLanguage === lang.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border hover:bg-muted'
              }`}
            >
              {lang.name}
            </button>
          ))}
          <div className="flex-1" />
          <div className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground inline-flex items-center gap-2">
            <CircleDashed className="w-4 h-4" />
            Blank workspace
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)] gap-4 min-h-0">
        <div className="flex flex-col gap-4 min-h-0">
          <div className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden min-h-0 shadow-sm">
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
              className="flex-1 min-h-[640px] p-5 font-mono text-sm leading-6 bg-primary/5 resize-none focus:outline-none"
              placeholder="// Start from scratch..."
              spellCheck={false}
            />
          </div>

          <div className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-secondary" />
                <h3>Program Input</h3>
              </div>
              <span className="text-sm text-muted-foreground">stdin</span>
            </div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              className="min-h-[180px] p-5 font-mono text-sm leading-6 bg-muted/20 resize-none focus:outline-none"
              placeholder="Enter input for your code..."
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 min-h-0">
          <button
            onClick={() => void handleRun()}
            disabled={running}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-3 text-secondary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Play className="w-5 h-5" />
            {running ? 'Running...' : 'Run Code'}
          </button>

          <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden flex flex-col shadow-sm min-h-[320px]">
            <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/30">
              <Terminal className="w-5 h-5 text-secondary" />
              <h3>Output</h3>
            </div>
            <div className="flex-1 p-4 font-mono text-sm bg-muted/20 overflow-auto whitespace-pre-wrap min-h-[280px]">
              {output || 'Click "Run Code" to see output...'}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-secondary" />
                Test Results
              </h3>
              <span className="text-sm text-muted-foreground">
                {totalTests > 0 ? `${passedTests}/${totalTests} Passed` : '0 checks ready'}
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
                {totalTests > 0 ? `${passRate.toFixed(0)}% Tests Passing` : 'Run your code to generate feedback.'}
              </div>
            </div>

            <div className="space-y-2">
              {tests.length ? (
                tests.map((test, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
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
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
                  This page starts blank. Add code, add input, and press run.
                </div>
              )}
            </div>

            {passedTests < totalTests && totalTests > 0 && (
              <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <div className="text-sm text-accent">
                  Try editing the code and rerun to see how the result changes.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
