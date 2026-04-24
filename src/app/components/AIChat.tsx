import { useState } from 'react';
import { Send, Lightbulb, ImageIcon, Code2, Gamepad2, HelpCircle, ThumbsUp, ThumbsDown, Volume2, Sparkles } from 'lucide-react';

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'What is a binary search algorithm?',
      confidence: 'High',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<ResponseTab>('explain');
  const [mode, setMode] = useState<'concise' | 'detailed' | 'eli5' | 'exam'>('detailed');

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: input,
      confidence: 'High',
      timestamp: new Date()
    };

    setMessages([...messages, userMessage, assistantMessage]);
    setInput('');
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
            <button className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
              New Chat
            </button>
            <button className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
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
                      {activeTab === 'explain' && (
                        <div className="space-y-4">
                          <p>
                            Binary search is an efficient algorithm for finding an item from a sorted list of items.
                            It works by repeatedly dividing the search interval in half.
                          </p>
                          <div className="bg-muted/50 rounded-lg p-4">
                            <h4 className="text-sm mb-2">How it works:</h4>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                              <li>Compare target value to the middle element</li>
                              <li>If equal, the position is returned</li>
                              <li>If target is less, search the left half</li>
                              <li>If target is greater, search the right half</li>
                              <li>Repeat until the value is found or interval is empty</li>
                            </ol>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Time Complexity: O(log n) | Space Complexity: O(1)
                          </p>
                        </div>
                      )}
                      {activeTab === 'diagram' && (
                        <div className="bg-muted/50 rounded-lg p-8 text-center">
                          <div className="space-y-4">
                            <div className="text-sm text-muted-foreground mb-4">Binary Search Visualization</div>
                            <div className="flex justify-center gap-2">
                              {[1, 3, 5, 7, 9, 11, 13, 15, 17].map((num, i) => (
                                <div
                                  key={i}
                                  className={`w-12 h-12 flex items-center justify-center rounded border-2 ${
                                    i === 4 ? 'border-secondary bg-secondary/10' : 'border-border'
                                  }`}
                                >
                                  {num}
                                </div>
                              ))}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Middle element highlighted in teal
                            </div>
                          </div>
                        </div>
                      )}
                      {activeTab === 'code' && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 font-mono text-sm">
                          <pre className="overflow-x-auto">
{`def binary_search(arr, target):
    left, right = 0, len(arr) - 1

    while left <= right:
        mid = (left + right) // 2

        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1`}
                          </pre>
                        </div>
                      )}
                      {activeTab === 'practice' && (
                        <div className="space-y-4">
                          <div className="bg-muted/50 rounded-lg p-4">
                            <h4 className="text-sm mb-3">Practice Exercise</h4>
                            <p className="text-sm text-muted-foreground mb-4">
                              Implement binary search to find the number 7 in the array [1, 3, 5, 7, 9, 11, 13]
                            </p>
                            <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
                              Start Practice
                            </button>
                          </div>
                        </div>
                      )}
                      {activeTab === 'quiz' && (
                        <div className="space-y-4">
                          <div className="bg-muted/50 rounded-lg p-4">
                            <h4 className="text-sm mb-3">Quick Quiz</h4>
                            <p className="text-sm mb-4">What is the time complexity of binary search?</p>
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
                      )}
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
                <div className="bg-primary text-primary-foreground rounded-xl px-6 py-3 max-w-md">
                  {message.content}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-border p-4 bg-card">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask anything about programming..."
                className="flex-1 px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-secondary"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground text-center">
              Ask questions, request explanations, or explore topics
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
