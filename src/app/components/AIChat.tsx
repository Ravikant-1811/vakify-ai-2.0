import { useEffect, useMemo, useState } from 'react';
import {
  Send,
  Lightbulb,
  ImageIcon,
  Code2,
  Gamepad2,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  Sparkles,
  Copy,
  RotateCcw,
  MessageSquareText,
  WandSparkles,
} from 'lucide-react';
import { apiFetch } from '../lib/api';

type ConfidenceLevel = 'High' | 'Medium' | 'Low';
type ResponseTab = 'explain' | 'diagram' | 'code' | 'practice' | 'quiz';
type ResponseMode = 'concise' | 'detailed' | 'eli5' | 'exam';

type ChatPayload = {
  title?: string;
  summary?: string;
  answer?: string;
  key_points?: string[];
  example?: string;
  code_sample?: string;
  practice?: string;
  quiz_question?: string;
  quiz_options?: string[];
  follow_up_prompts?: string[];
  next_step?: string;
  confidence?: ConfidenceLevel;
  mode?: ResponseMode;
  style?: string;
  assets?: Record<string, string | string[] | null>;
  response_type?: string;
  text?: string;
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: ConfidenceLevel;
  timestamp: Date;
  data?: ChatPayload;
  chatId?: number;
}

const starter = (): Message => ({
  id: 'starter',
  role: 'assistant',
  content: 'Ask me anything about coding, debugging, or concepts. I will answer with a full tutor-style breakdown.',
  confidence: 'High',
  timestamp: new Date(),
  data: {
    title: 'Welcome to Vakify AI',
    summary: 'A chat workspace for deep, practical learning.',
    answer: 'Ask a question on the left and I will explain it, show examples, and give you a practice task.',
    key_points: ['Ask naturally', 'Get structured help', 'Keep the conversation going'],
    example: 'Try: "Explain recursion with a simple Java example".',
    code_sample: '',
    practice: 'Start with one coding question and one real-world scenario.',
    quiz_question: 'What do you want to learn first?',
    quiz_options: ['Data structures', 'Algorithms', 'Java basics', 'Debugging'],
    follow_up_prompts: ['Show me a visual example', 'Give me a coding exercise', 'Explain it like I am a beginner'],
    next_step: 'Send your first question to begin.',
    confidence: 'High',
    mode: 'detailed',
    style: 'visual',
  },
});

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<ResponseTab>('explain');
  const [mode, setMode] = useState<ResponseMode>('detailed');
  const [sending, setSending] = useState(false);
  const [quickPrompts, setQuickPrompts] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      try {
        const rows = await apiFetch<Array<{
          chat_id: number;
          question: string;
          response: string;
          response_json?: ChatPayload | null;
          response_type: string;
          timestamp: string;
          feedback?: { rating: number; comment?: string | null } | null;
        }>>('/api/chat/history');

        if (cancelled) {
          return;
        }

        const chronological = [...rows].reverse();
        const restored: Message[] = [];
        chronological.forEach((row) => {
          restored.push({
            id: `q-${row.chat_id}`,
            role: 'user',
            content: row.question,
            timestamp: new Date(row.timestamp),
            chatId: row.chat_id,
          });
          const parsed = row.response_json || safeParseChatPayload(row.response);
          restored.push({
            id: `a-${row.chat_id}`,
            role: 'assistant',
            content: parsed?.answer || parsed?.text || row.response || 'Assistant response',
            confidence: parsed?.confidence || confidenceFromResponseType(row.response_type),
            timestamp: new Date(row.timestamp),
            data: parsed || undefined,
            chatId: row.chat_id,
          });
        });

        if (restored.length) {
          setMessages(restored);
          const latestAssistant = [...restored].reverse().find((message) => message.role === 'assistant');
          setQuickPrompts(latestAssistant?.data?.follow_up_prompts?.slice(0, 4) || []);
        } else {
          const welcome = starter();
          setMessages([welcome]);
          setQuickPrompts(welcome.data?.follow_up_prompts || []);
        }
      } catch {
        if (!cancelled) {
          const welcome = starter();
          setMessages([welcome]);
          setQuickPrompts(welcome.data?.follow_up_prompts || []);
        }
      }
    };

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  const lastAssistant = useMemo(
    () => [...messages].reverse().find((message) => message.role === 'assistant') || null,
    [messages],
  );

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const question = input.trim();
    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const response = await apiFetch<ChatPayload & { chat_id: number }>('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ question, mode }),
      });

      const assistantMessage: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: response.answer || response.text || 'I could not generate a response right now.',
        confidence: response.confidence || confidenceFromResponseType(String(response.response_type || 'detailed')),
        timestamp: new Date(),
        data: response,
        chatId: response.chat_id,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setQuickPrompts(response.follow_up_prompts?.slice(0, 4) || []);
    } catch (error) {
      const assistantMessage: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, the assistant is temporarily unavailable.',
        confidence: 'Low',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleFeedback = async (message: Message, rating: 1 | -1) => {
    if (!message.chatId) return;
    await apiFetch('/api/chat/feedback', {
      method: 'POST',
      body: JSON.stringify({
        chat_id: message.chatId,
        rating,
      }),
    });
    setMessages((prev) =>
      prev.map((item) =>
        item.id === message.id
          ? { ...item, data: { ...item.data, confidence: rating === 1 ? 'High' : 'Low' } }
          : item,
      ),
    );
  };

  const copyMessage = async (message: Message) => {
    const text = message.data?.answer || message.content;
    await navigator.clipboard.writeText(text);
    setCopiedId(message.id);
    window.setTimeout(() => setCopiedId(null), 1200);
  };

  const confidenceColor = {
    High: 'bg-secondary text-secondary-foreground',
    Medium: 'bg-accent text-accent-foreground',
    Low: 'bg-destructive text-destructive-foreground',
  };

  const tabs = [
    { id: 'explain' as ResponseTab, icon: Lightbulb, label: 'Explain' },
    { id: 'diagram' as ResponseTab, icon: ImageIcon, label: 'Diagram' },
    { id: 'code' as ResponseTab, icon: Code2, label: 'Code' },
    { id: 'practice' as ResponseTab, icon: Gamepad2, label: 'Practice' },
    { id: 'quiz' as ResponseTab, icon: HelpCircle, label: 'Quiz' },
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto">
      <div className="hidden lg:flex w-72 border-r border-border bg-card p-4 flex-col gap-5">
        <div>
          <h3 className="text-sm text-muted-foreground mb-2">Response Mode</h3>
          <div className="grid grid-cols-2 gap-2">
            {(['concise', 'detailed', 'eli5', 'exam'] as ResponseMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-2 rounded-lg text-xs transition-colors ${
                  mode === m ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {m === 'eli5' ? 'ELI5' : m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm text-muted-foreground mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => setMessages([starter()])}
              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
            >
              New Chat
            </button>
            <button
              onClick={() => setMessages([starter()])}
              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Thread
            </button>
            <button
              onClick={() => setMessages([])}
              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
            >
              Clear History
            </button>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-sm text-muted-foreground mb-2">Follow-up Prompts</h3>
          <div className="space-y-2">
            {(quickPrompts.length ? quickPrompts : starter().data?.follow_up_prompts || []).map((topic) => (
              <button
                key={topic}
                onClick={() => setInput(topic)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors text-foreground"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="border-b border-border bg-card/80 backdrop-blur px-4 py-3 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2 text-sm">
            <MessageSquareText className="w-4 h-4 text-secondary" />
            AI Chat
          </div>
          <div className="text-xs text-muted-foreground capitalize">{mode}</div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' ? (
                <div className="max-w-4xl w-full">
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-secondary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{message.data?.title || 'AI Assistant'}</div>
                          <div className="text-xs text-muted-foreground">
                            {message.data?.mode || mode} mode
                          </div>
                        </div>
                      </div>
                      {message.confidence && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Confidence:</span>
                          <div className={`px-3 py-1 rounded-full text-xs ${confidenceColor[message.confidence]}`}>
                            {message.confidence}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-b border-border mb-4">
                      <div className="flex gap-2 overflow-x-auto">
                        {tabs.map((tab) => {
                          const Icon = tab.icon;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                                activeTab === tab.id
                                  ? 'border-secondary text-secondary'
                                  : 'border-transparent text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              {tab.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mb-6">{renderTabContent(activeTab, message)}</div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                      <div className="rounded-xl border border-border p-4 bg-muted/30">
                        <div className="text-xs text-muted-foreground mb-1">Summary</div>
                        <div className="text-sm whitespace-pre-wrap">{message.data?.summary || message.content}</div>
                      </div>
                      <div className="rounded-xl border border-border p-4 bg-muted/30">
                        <div className="text-xs text-muted-foreground mb-1">Next Step</div>
                        <div className="text-sm whitespace-pre-wrap">{message.data?.next_step || 'Keep the conversation going.'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t border-border flex-wrap">
                      <button
                        onClick={() => void copyMessage(message)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        {copiedId === message.id ? 'Copied' : 'Copy'}
                      </button>
                      <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <Volume2 className="w-4 h-4" />
                        Listen
                      </button>
                      <div className="flex-1"></div>
                      <span className="text-xs text-muted-foreground">Was this helpful?</span>
                      <button
                        onClick={() => void handleFeedback(message, 1)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => void handleFeedback(message, -1)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-primary text-primary-foreground rounded-2xl px-6 py-3 max-w-md whitespace-pre-wrap shadow-sm">
                  {message.content}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-border p-4 bg-card">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <WandSparkles className="w-3.5 h-3.5" />
                Ask naturally. The assistant will keep context from the current thread.
              </div>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="Ask anything..."
              />
            </div>
            <button
              onClick={() => void handleSend()}
              disabled={!input.trim() || sending}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Thinking...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function safeParseChatPayload(raw: string): ChatPayload | null {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed as ChatPayload : null;
  } catch {
    return null;
  }
}

function confidenceFromResponseType(responseType: string): ConfidenceLevel {
  if (responseType === 'visual') return 'High';
  if (responseType === 'auditory') return 'Medium';
  return 'High';
}

function renderTabContent(tab: ResponseTab, message: Message) {
  const data = message.data;

  if (tab === 'explain') {
    return (
      <div className="space-y-4">
        <pre className="whitespace-pre-wrap text-sm leading-6 bg-muted/50 rounded-xl p-4">
          {data?.answer || message.content}
        </pre>
        {Array.isArray(data?.key_points) && data.key_points.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.key_points.map((point) => (
              <div key={point} className="rounded-xl border border-border bg-card p-4">
                <div className="text-sm">{point}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (tab === 'diagram') {
    const assets = data?.assets || {};
    const image = (assets.ai_image_url as string | undefined) || (assets.topic_image_url as string | undefined);
    return (
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="text-sm text-muted-foreground mb-3">Visual summary</div>
          <div className="text-sm leading-6 whitespace-pre-wrap">{data?.example || message.content}</div>
        </div>
        {image ? (
          <img src={image} alt="AI generated visual aid" className="w-full rounded-xl border border-border" />
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Visual assets will appear here when the backend returns them.
          </div>
        )}
      </div>
    );
  }

  if (tab === 'code') {
    return (
      <div className="space-y-4">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 font-mono text-sm">
          <pre className="overflow-x-auto whitespace-pre-wrap">
            {data?.code_sample || 'No code sample was needed for this question.'}
          </pre>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground mb-2">Practical guidance</div>
          <div className="text-sm whitespace-pre-wrap">{data?.next_step || data?.practice || message.content}</div>
        </div>
      </div>
    );
  }

  if (tab === 'practice') {
    return (
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-xl p-4">
          <h4 className="text-sm mb-3">Practice Exercise</h4>
          <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">
            {data?.practice || message.content}
          </p>
          <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
            Start Practice
          </button>
        </div>
        {Array.isArray(data?.follow_up_prompts) && data.follow_up_prompts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.follow_up_prompts.map((prompt) => (
              <div key={prompt} className="rounded-xl border border-border bg-card p-4 text-sm">
                {prompt}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-xl p-4">
        <h4 className="text-sm mb-3">Quick Quiz</h4>
        <p className="text-sm mb-4 whitespace-pre-wrap">{data?.quiz_question || message.content}</p>
        <div className="space-y-2">
          {(data?.quiz_options || ['O(n)', 'O(log n)', 'O(n²)', 'O(1)']).map((option) => (
            <button
              key={option}
              className="w-full text-left px-4 py-3 rounded-lg border border-border hover:border-secondary hover:bg-secondary/5 transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
