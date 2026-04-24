import { useEffect, useState } from 'react';
import { Send, Lightbulb, ImageIcon, Code2, Gamepad2, HelpCircle, ThumbsUp, ThumbsDown, Volume2, Sparkles } from 'lucide-react';
import { apiFetch } from '../lib/api';

type ConfidenceLevel = 'High' | 'Medium' | 'Low';
type ResponseTab = 'explain' | 'diagram' | 'code' | 'practice' | 'quiz';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: ConfidenceLevel;
  timestamp: Date;
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<ResponseTab>('explain');
  const [mode, setMode] = useState<'concise' | 'detailed' | 'eli5' | 'exam'>('detailed');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      try {
        const rows = await apiFetch<Array<{
          chat_id: number;
          question: string;
          response: string;
          response_type: string;
          timestamp: string;
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
          });
          restored.push({
            id: `a-${row.chat_id}`,
            role: 'assistant',
            content: row.response,
            confidence: confidenceFromResponseType(row.response_type),
            timestamp: new Date(row.timestamp),
          });
        });

        if (restored.length) {
          setMessages(restored);
        } else {
          setMessages([starterMessage()]);
        }
      } catch {
        if (!cancelled) {
          setMessages([starterMessage()]);
        }
      }
    };

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const question = input.trim();
    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const response = await apiFetch<Record<string, any>>('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ question }),
      });

      const assistantMessage: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: String(response.text || response.response || 'I could not generate a response right now.'),
        confidence: confidenceFromResponseType(String(response.response_type || 'detailed')),
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const assistantMessage: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, the assistant is temporarily unavailable.',
        confidence: 'Low',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setSending(false);
    }
  };

  const confidenceColor = {
    High: 'bg-secondary text-secondary-foreground',
    Medium: 'bg-accent text-accent-foreground',
    Low: 'bg-destructive text-destructive-foreground'
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
      <div className="w-64 border-r border-border bg-card p-4">
        <div className="mb-4">
          <h3 className="text-sm text-muted-foreground mb-2">Response Mode</h3>
          <div className="grid grid-cols-2 gap-2">
            {['concise', 'detailed', 'eli5', 'exam'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m as typeof mode)}
                className={`px-3 py-2 rounded-lg text-xs transition-colors ${
                  mode === m
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {m === 'eli5' ? 'ELI5' : m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-sm text-muted-foreground mb-2">Quick Actions</h3>
          <div className="space-y-1">
            <button
              onClick={() => setMessages([starterMessage()])}
              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
            >
              New Chat
            </button>
            <button
              onClick={() => setMessages([])}
              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
            >
              Clear History
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-sm text-muted-foreground mb-2">Recent Topics</h3>
          <div className="space-y-1">
            {['Binary Search', 'Sorting Algorithms', 'Hash Tables', 'Recursion'].map((topic) => (
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' ? (
                <div className="max-w-3xl w-full">
                  <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-secondary" />
                        </div>
                        <span className="text-sm">AI Assistant</span>
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

                    <div className="mb-6">
                      {renderTabContent(activeTab, message)}
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t border-border">
                      <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <Volume2 className="w-4 h-4" />
                        Listen
                      </button>
                      <div className="flex-1"></div>
                      <span className="text-xs text-muted-foreground">Was this helpful?</span>
                      <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-primary text-primary-foreground rounded-xl px-6 py-3 max-w-md whitespace-pre-wrap">
                  {message.content}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-border p-4 bg-card">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handleSend();
                }
              }}
              className="flex-1 px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="Ask anything..."
            />
            <button
              onClick={() => void handleSend()}
              disabled={!input.trim() || sending}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
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

function starterMessage(): Message {
  return {
    id: 'starter',
    role: 'assistant',
    content: 'Ask me anything about your learning topic and I will answer from the backend tutor engine.',
    confidence: 'High',
    timestamp: new Date(),
  };
}

function confidenceFromResponseType(responseType: string): ConfidenceLevel {
  if (responseType === 'visual') return 'High';
  if (responseType === 'auditory') return 'Medium';
  return 'High';
}

function renderTabContent(tab: ResponseTab, message: Message) {
  if (tab === 'explain') {
    return (
      <div className="space-y-4">
        <pre className="whitespace-pre-wrap text-sm leading-6 bg-muted/50 rounded-lg p-4">
          {message.content}
        </pre>
      </div>
    );
  }

  if (tab === 'diagram') {
    return (
      <div className="bg-muted/50 rounded-lg p-8 text-center">
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">Generated Learning Response</div>
          <div className="mx-auto max-w-xl text-sm leading-6 whitespace-pre-wrap text-left">
            {message.content}
          </div>
          <div className="text-xs text-muted-foreground">
            Use the response above as the basis for diagrams, flow maps, and visual notes.
          </div>
        </div>
      </div>
    );
  }

  if (tab === 'code') {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 font-mono text-sm">
        <pre className="overflow-x-auto whitespace-pre-wrap">
          {message.content}
        </pre>
      </div>
    );
  }

  if (tab === 'practice') {
    return (
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="text-sm mb-3">Practice Exercise</h4>
          <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">
            {message.content}
          </p>
          <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
            Start Practice
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="text-sm mb-3">Quick Quiz</h4>
        <p className="text-sm mb-4 whitespace-pre-wrap">{message.content}</p>
        <div className="space-y-2">
          {['O(n)', 'O(log n)', 'O(n²)', 'O(1)'].map((option) => (
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
