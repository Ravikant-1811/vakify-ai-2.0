import { useEffect, useMemo, useState } from 'react';
import { Send, Sparkles, Copy, RotateCcw, ThumbsUp, ThumbsDown, MessageSquareText } from 'lucide-react';
import { apiFetch } from '../lib/api';

type ConfidenceLevel = 'High' | 'Medium' | 'Low';

type ChatPayload = {
  answer?: string;
  text?: string;
  follow_up_prompts?: string[];
  response_type?: string;
  confidence?: ConfidenceLevel;
  chat_id?: number;
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: ConfidenceLevel;
  timestamp: Date;
  chatId?: number;
  followUps?: string[];
}

const starter = (): Message => ({
  id: 'starter',
  role: 'assistant',
  content: 'Ask me anything. I will answer like a normal AI chat assistant and keep the conversation going.',
  confidence: 'High',
  timestamp: new Date(),
  followUps: ['Explain recursion simply', 'Give me a Java example', 'Help me debug my code'],
});

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
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
            chatId: row.chat_id,
            followUps: parsed?.follow_up_prompts?.slice(0, 4) || [],
          });
        });

        setMessages(restored.length ? restored : [starter()]);
      } catch {
        if (!cancelled) {
          setMessages([starter()]);
        }
      }
    };

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  const latestAssistant = useMemo(
    () => [...messages].reverse().find((message) => message.role === 'assistant') || null,
    [messages],
  );

  const suggestionChips = latestAssistant?.followUps?.length ? latestAssistant.followUps : starter().followUps || [];

  const handleSend = async (value?: string) => {
    const text = (value ?? input).trim();
    if (!text || sending) return;

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const response = await apiFetch<ChatPayload>('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ question: text }),
      });

      const assistantMessage: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: response.answer || response.text || 'I could not generate a response right now.',
        confidence: response.confidence || 'High',
        timestamp: new Date(),
        followUps: response.follow_up_prompts?.slice(0, 4) || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Sorry, the assistant is temporarily unavailable.',
          confidence: 'Low',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const copyMessage = async (message: Message) => {
    await navigator.clipboard.writeText(message.content);
    setCopiedId(message.id);
    window.setTimeout(() => setCopiedId(null), 1200);
  };

  const feedback = async (message: Message, rating: 1 | -1) => {
    if (!message.chatId) return;
    await apiFetch('/api/chat/feedback', {
      method: 'POST',
      body: JSON.stringify({
        chat_id: message.chatId,
        rating,
      }),
    });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto">
      <aside className="hidden lg:flex w-72 border-r border-border bg-card p-4 flex-col gap-5">
        <div>
          <h3 className="text-sm text-muted-foreground mb-2">Quick Start</h3>
          <div className="space-y-2">
            <button onClick={() => setMessages([starter()])} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
              New Chat
            </button>
            <button onClick={() => setMessages([starter()])} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset Thread
            </button>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-sm text-muted-foreground mb-2">Suggested prompts</h3>
          <div className="space-y-2">
            {suggestionChips.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInput(prompt)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <div className="border-b border-border bg-card/80 backdrop-blur px-4 py-3 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2 text-sm">
            <MessageSquareText className="w-4 h-4 text-secondary" />
            AI Chat
          </div>
          <button onClick={() => setMessages([starter()])} className="text-xs text-muted-foreground hover:text-foreground">
            Reset
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' ? (
                <div className="max-w-3xl w-full">
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-secondary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">AI Assistant</div>
                        <div className="text-xs text-muted-foreground">Natural conversation mode</div>
                      </div>
                    </div>

                    <div className="space-y-4 text-sm leading-7">
                      {renderRichContent(message.content)}
                    </div>

                    <div className="flex items-center gap-3 pt-4 mt-4 border-t border-border flex-wrap">
                      <button
                        onClick={() => void copyMessage(message)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        {copiedId === message.id ? 'Copied' : 'Copy'}
                      </button>
                      <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ThumbsUp className="w-4 h-4" />
                        Helpful
                      </button>
                      <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ThumbsDown className="w-4 h-4" />
                        Not helpful
                      </button>
                      <div className="flex-1"></div>
                      <span className="text-xs text-muted-foreground">Confidence: {message.confidence || 'High'}</span>
                    </div>

                    {message.followUps?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {message.followUps.map((prompt) => (
                          <button
                            key={prompt}
                            onClick={() => void handleSend(prompt)}
                            className="px-3 py-2 rounded-full text-xs border border-border hover:bg-muted transition-colors"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    ) : null}
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
              <div className="text-xs text-muted-foreground mb-2">
                Ask naturally. The assistant keeps the conversation context.
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

function renderRichContent(content: string) {
  const blocks = parseBlocks(content);
  return blocks.map((block, index) => {
    if (block.type === 'heading') {
      return (
        <div key={index} className="text-base font-semibold text-foreground">
          {renderInline(block.text)}
        </div>
      );
    }

    if (block.type === 'code') {
      return (
        <pre key={index} className="rounded-xl bg-slate-950 text-slate-50 p-4 overflow-x-auto text-xs leading-6">
          <code>{block.text}</code>
        </pre>
      );
    }

    if (block.type === 'quote') {
      return (
        <div key={index} className="border-l-4 border-secondary bg-secondary/5 rounded-r-xl p-4 text-muted-foreground">
          {renderInline(block.text)}
        </div>
      );
    }

    if (block.type === 'list') {
      return (
        <ul key={index} className="space-y-2">
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-secondary flex-shrink-0" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    }

    if (block.type === 'ordered') {
      return (
        <ol key={index} className="space-y-3 pl-5 list-decimal">
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </ol>
      );
    }

    if (block.type === 'table') {
      return (
        <div key={index} className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex === 0 ? 'bg-muted/60 font-medium' : 'border-t border-border'}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 align-top">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <p key={index} className="whitespace-pre-wrap">
        {renderInline(block.text)}
      </p>
    );
  });
}

function renderInline(text: string) {
  const html = escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '<a class="text-secondary underline" href="$2" target="_blank" rel="noreferrer">$1</a>');

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseBlocks(content: string): Array<
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'ordered'; items: string[] }
  | { type: 'code'; text: string }
  | { type: 'table'; rows: string[][] }
> {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: Array<any> = [];
  let buffer: string[] = [];
  let codeBuffer: string[] | null = null;
  let listBuffer: string[] = [];
  let orderedBuffer: string[] = [];
  let tableBuffer: string[] = [];

  const flushParagraph = () => {
    const text = buffer.join(' ').trim();
    if (text) blocks.push({ type: 'paragraph', text });
    buffer = [];
  };
  const flushList = () => {
    if (listBuffer.length) blocks.push({ type: 'list', items: listBuffer });
    listBuffer = [];
  };
  const flushOrdered = () => {
    if (orderedBuffer.length) blocks.push({ type: 'ordered', items: orderedBuffer });
    orderedBuffer = [];
  };
  const flushTable = () => {
    if (tableBuffer.length >= 2) {
      const rows = tableBuffer.map((row) =>
        row
          .split('|')
          .map((cell) => cell.trim())
          .filter(Boolean),
      );
      blocks.push({ type: 'table', rows });
    }
    tableBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.startsWith('```')) {
      if (codeBuffer) {
        blocks.push({ type: 'code', text: codeBuffer.join('\n') });
        codeBuffer = null;
      } else {
        flushParagraph();
        flushList();
        flushOrdered();
        flushTable();
        codeBuffer = [];
      }
      continue;
    }

    if (codeBuffer) {
      codeBuffer.push(rawLine);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      flushOrdered();
      flushTable();
      continue;
    }

    if (/^#{1,3}\s+/.test(line)) {
      flushParagraph();
      flushList();
      flushOrdered();
      flushTable();
      blocks.push({ type: 'heading', text: line.replace(/^#{1,3}\s+/, '').trim() });
      continue;
    }

    if (/^>\s+/.test(line)) {
      flushParagraph();
      flushList();
      flushOrdered();
      flushTable();
      blocks.push({ type: 'quote', text: line.replace(/^>\s+/, '').trim() });
      continue;
    }

    if (/^(\-|\*|•)\s+/.test(line)) {
      flushParagraph();
      flushOrdered();
      flushTable();
      listBuffer.push(line.replace(/^(\-|\*|•)\s+/, '').trim());
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      flushParagraph();
      flushList();
      flushTable();
      orderedBuffer.push(line.replace(/^\d+\.\s+/, '').trim());
      continue;
    }

    if (line.includes('|') && line.split('|').length > 2) {
      flushParagraph();
      flushList();
      flushOrdered();
      tableBuffer.push(line);
      continue;
    }

    buffer.push(line);
  }

  if (codeBuffer) {
    blocks.push({ type: 'code', text: codeBuffer.join('\n') });
  }
  flushParagraph();
  flushList();
  flushOrdered();
  flushTable();

  return blocks.length ? blocks : [{ type: 'paragraph', text: content }];
}

function safeParseChatPayload(raw: string): ChatPayload | null {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as ChatPayload) : null;
  } catch {
    return null;
  }
}

function confidenceFromResponseType(responseType: string): ConfidenceLevel {
  if (responseType === 'visual') return 'High';
  if (responseType === 'auditory') return 'Medium';
  return 'High';
}
