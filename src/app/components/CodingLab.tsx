import { useEffect, useState } from 'react';
import { Play, CheckCircle2, XCircle, AlertCircle, Code2, Terminal } from 'lucide-react';
import { apiFetch } from '../lib/api';

type Challenge = {
  key: string;
  language: string;
  title: string;
  description: string;
  starter_code: string;
  sample_input: string;
  expected_output: string;
  hint: string;
};

type RunResponse = {
  status: string;
  stdout: string;
  stderr: string;
  runner: string;
  note: string;
  challenge: Challenge;
  tests: Array<{ name: string; passed: boolean }>;
  passed_tests: number;
  total_tests: number;
  score: number;
};

export function CodingLab() {
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [tests, setTests] = useState<Array<{ name: string; passed: boolean }>>([]);
  const [running, setRunning] = useState(false);

  const languages = [
    { id: 'python', name: 'Python' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'java', name: 'Java' },
    { id: 'cpp', name: 'C++' },
    { id: 'c', name: 'C' },
  ];

  useEffect(() => {
    let cancelled = false;

    const loadChallenge = async () => {
      try {
        const data = await apiFetch<Challenge>(`/api/lab/challenge?language=${encodeURIComponent(selectedLanguage)}`);
        if (cancelled) {
          return;
        }
        setChallenge(data);
        setCode(data.starter_code);
        setTests([
          { name: 'Function compiled or executed', passed: true },
          { name: 'Binary search logic detected', passed: true },
          { name: 'Empty input edge case handled', passed: false },
          { name: 'Missing target fallback detected', passed: true },
        ]);
        setOutput('');
      } catch {
        if (!cancelled) {
          setChallenge(null);
        }
      }
    };

    void loadChallenge();
    return () => {
      cancelled = true;
    };
  }, [selectedLanguage]);

  const handleRun = async () => {
    setRunning(true);
    setOutput('Running code...\n');

    try {
      const response = await apiFetch<RunResponse>('/api/lab/run', {
        method: 'POST',
        body: JSON.stringify({
          language: selectedLanguage,
          source_code: code,
          challenge_key: challenge?.key,
          title: challenge?.title,
        }),
      });

      setOutput(
        `${response.stdout || '(no stdout)'}\n${response.stderr ? `\n${response.stderr}` : ''}\n\nTests Passed: ${response.passed_tests}/${response.total_tests}\nScore: ${response.score}%\nRunner: ${response.runner}\n${response.note ? `\n${response.note}` : ''}`,
      );
      setTests(response.tests || []);
    } catch (error) {
      setOutput(error instanceof Error ? error.message : 'Unable to run code right now.');
      setTests([
        { name: 'Function compiled or executed', passed: false },
        { name: 'Binary search logic detected', passed: false },
        { name: 'Empty input edge case handled', passed: false },
        { name: 'Missing target fallback detected', passed: false },
      ]);
    } finally {
      setRunning(false);
    }
  };

  const passedTests = tests.filter(t => t.passed).length;
  const totalTests = tests.length;
  const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl mb-2">Coding Lab</h1>
        <p className="text-muted-foreground">
          Practice coding with instant feedback and test results
        </p>
        {challenge && (
          <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Current Challenge</div>
                <div className="text-lg">{challenge.title}</div>
              </div>
              <div className="text-sm text-muted-foreground">
                Language: {challenge.language}
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{challenge.description}</p>
            <p className="mt-2 text-xs text-accent">Hint: {challenge.hint}</p>
          </div>
        )}
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
                  Hint: {challenge?.hint || 'Handle the edge case when the array is empty'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
