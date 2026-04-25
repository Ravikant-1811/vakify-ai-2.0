import { useEffect, useState } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Code2,
  Terminal,
  RefreshCcw,
  Database,
  MessageSquareText,
} from 'lucide-react';
import { apiFetch } from '../lib/api';

type LabTask = {
  task_id: number;
  language: string;
  task_key: string;
  title: string;
  description: string;
  starter_code: string;
  sample_input: string;
  expected_output: string;
  hint: string;
  source_chat_id?: number | null;
  source_thread_id?: number | null;
  source_question?: string | null;
  source_answer?: string | null;
  validation_json?: string[];
  is_active?: boolean;
};

type RunResponse = {
  status: string;
  stdout: string;
  stderr: string;
  runner: string;
  note: string;
  challenge?: LabTask;
  task?: LabTask | null;
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

export function CodingLab() {
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [task, setTask] = useState<LabTask | null>(null);
  const [code, setCode] = useState('');
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState('');
  const [tests, setTests] = useState<Array<{ name: string; passed: boolean }>>([]);
  const [running, setRunning] = useState(false);
  const [loadingTask, setLoadingTask] = useState(false);
  const [syncingTask, setSyncingTask] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadTask = async () => {
      setLoadingTask(true);
      try {
        const data = await apiFetch<LabTask>(`/api/lab/task?language=${encodeURIComponent(selectedLanguage)}`);
        if (cancelled) return;
        setTask(data);
        setCode(data.starter_code || '');
        setStdin(data.sample_input || '');
        setOutput('');
        setTests([]);
      } catch {
        if (!cancelled) {
          setTask(null);
          setCode('');
          setStdin('');
          setOutput('Unable to load a coding task right now.');
          setTests([]);
        }
      } finally {
        if (!cancelled) setLoadingTask(false);
      }
    };

    void loadTask();
    return () => {
      cancelled = true;
    };
  }, [selectedLanguage]);

  const refreshFromChat = async () => {
    setSyncingTask(true);
    try {
      const data = await apiFetch<LabTask>('/api/lab/task/sync', {
        method: 'POST',
        body: JSON.stringify({ language: selectedLanguage }),
      });
      setTask(data);
      setCode(data.starter_code || '');
      setStdin(data.sample_input || '');
      setOutput('');
      setTests([]);
    } finally {
      setSyncingTask(false);
    }
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
          task_id: task?.task_id,
          challenge_key: task?.task_key,
          title: task?.title,
        }),
      });

      setOutput(
        `${response.stdout || '(no stdout)'}\n${response.stderr ? `\n${response.stderr}` : ''}\n\nTests Passed: ${response.passed_tests}/${response.total_tests}\nScore: ${response.score}%\nRunner: ${response.runner}\n${response.note ? `\n${response.note}` : ''}`,
      );
      setTests(response.tests || []);
      if (response.task) {
        setTask(response.task);
      }
    } catch (error) {
      setOutput(error instanceof Error ? error.message : 'Unable to run code right now.');
      setTests([
        { name: 'Program compiled or executed', passed: false },
        { name: 'Task loaded from chat or database', passed: false },
        { name: 'Sample input wired correctly', passed: false },
        { name: 'Expected output check prepared', passed: false },
      ]);
    } finally {
      setRunning(false);
    }
  };

  const passedTests = tests.filter((t) => t.passed).length;
  const totalTests = tests.length;
  const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-6 max-w-7xl mx-auto gap-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2">Coding Lab</h1>
          <p className="text-muted-foreground">
            Practice coding with instant feedback, live input, and tasks auto-generated from your chat history.
          </p>
        </div>
        <button
          onClick={() => void refreshFromChat()}
          disabled={syncingTask || loadingTask}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCcw className={`w-4 h-4 ${syncingTask ? 'animate-spin' : ''}`} />
          Sync from Chat
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <MessageSquareText className="w-4 h-4" />
              Current Challenge
            </div>
            <div className="text-lg font-semibold mt-1">{task?.title || 'Loading task...'}</div>
            <p className="mt-2 text-sm text-muted-foreground max-w-4xl">
              {task?.description || 'The lab will populate with the latest task generated from your chat context.'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-sm text-muted-foreground">
            <div className="rounded-full bg-secondary/10 px-3 py-1 text-secondary font-medium">
              Language: {selectedLanguage}
            </div>
            {task?.source_chat_id ? (
              <div className="inline-flex items-center gap-2">
                <Database className="w-4 h-4" />
                Auto-synced from chat #{task.source_chat_id}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2">
                <Database className="w-4 h-4" />
                Fallback database task
              </div>
            )}
          </div>
        </div>

        {task?.source_question ? (
          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Source chat</div>
            <div className="text-sm font-medium">{task.source_question}</div>
            {task.source_answer ? (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{task.source_answer}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <div className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            Hint: {task?.hint || 'Use the lab input to test your solution.'}
          </div>
          <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {task?.task_key || 'auto-generated-task'}
          </div>
        </div>
      </div>

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
        <button
          onClick={() => void handleRun()}
          disabled={running || loadingTask}
          className="bg-secondary text-secondary-foreground px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          <Play className="w-5 h-5" />
          {running ? 'Running...' : 'Run Code'}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
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
              className="flex-1 min-h-[420px] p-4 font-mono text-sm bg-primary/5 resize-none focus:outline-none"
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
              className="min-h-[120px] p-4 font-mono text-sm bg-muted/20 resize-none focus:outline-none"
              placeholder={task?.sample_input ? 'Edit the sample input or paste your own test data...' : 'Enter stdin for your program...'}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 min-h-0">
          <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden flex flex-col shadow-sm">
            <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/30">
              <Terminal className="w-5 h-5 text-secondary" />
              <h3>Output</h3>
            </div>
            <div className="flex-1 p-4 font-mono text-sm bg-muted/20 overflow-auto whitespace-pre-wrap min-h-[220px]">
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
                  Run your solution to see the live checks generated from the latest task.
                </div>
              )}
            </div>

            {passedTests < totalTests && totalTests > 0 && (
              <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <div className="text-sm text-accent">
                  {task?.hint || 'Try using the sample input and adjust the code until the sample output matches.'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
