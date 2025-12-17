"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { JSX } from "react/jsx-runtime";
import Link from "next/link";
import { useRouter } from 'next/navigation';

const THINKING_PHRASES = [
    "Thinking...",
    "Processing your request...",
    "Finding the best applicants for you...",
    "Ranking and comparing matches...",
    "Summarizing the strongest fits...",
];

type Role = {
    name: string;
    title: string;
    location: string;
    skills: string[];
    years: number;
    availability: string;
};

type Msg = {
    id: string;
    role: "recruiter" | "assistant";
    text: string;
    ts: number;
};

type ShortlistedCandidate = {
    candidate_id: string;
    name: string;
    age: number | null;
    email: string;
    location: string | null;
    visa_status: string | null;
    experience_years: number | null;
    salary_expectation: number | null;
    match_summary: string;
    recommended_action: string;
    confidence: number;
};

type ShortlistResult = {
    filters: Record<string, unknown>;
    shortlist: ShortlistedCandidate[];
    overall_summary: string;
};

type TimelineItem =
    | { kind: "message"; msg: Msg }
    | { kind: "shortlist"; id: string; data: ShortlistResult };

function id() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function RecruiterQueryPage(): JSX.Element {
    const router = useRouter();

    const handleLogout = (): void => {
        router.push('/');
        localStorage.removeItem("recruiter_id");
        console.log("Logged out");
    };

    const [input, setInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [thinkingElapsedMs, setThinkingElapsedMs] = useState(0);
    const [thinkingPhraseIdx, setThinkingPhraseIdx] = useState(0);
    const [thinkingDisplay, setThinkingDisplay] = useState("");
    const [typedText, setTypedText] = useState<Record<string, string>>({});
    const [timeline, setTimeline] = useState<TimelineItem[]>(() => [
        {
            kind: "message",
            msg: {
                id: id(),
                role: "assistant",
                ts: Date.now(),
                text:
                    "Describe the employee you’re looking for (role, location, skills, years). Example: “frontend engineer, Sydney, React + TypeScript, 2+ years”.",
            },
        },
    ]);
    console.log('timeline', timeline);

    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

    const listRef = useRef<HTMLDivElement | null>(null);

    const quickPrompts = useMemo(
        () => [
            "Frontend engineer, Sydney, React + TypeScript, 2+ years",
            "Data analyst, remote AU, SQL + Python",
            "Backend engineer, Melbourne, Node + Postgres + AWS",
        ],
        []
    );

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const recruiterId = localStorage.getItem("recruiter_id");
                if (!recruiterId) {
                    throw new Error("Recruiter ID not found in local storage.");
                }

                const res = await fetch(`/api/query/history?recruiter_id=${recruiterId}`);
                if (!res.ok) {
                    throw new Error(`Failed to fetch conversations: ${res.status}`);
                }

                const conversations = await res.json();
                setConversations(conversations);
            } catch (error) {
                console.error("Error fetching conversation history:", error);
            }
        };

        fetchConversations();
    }, []);

    useEffect(() => {
        const timers: number[] = [];

        const runTyping = (idValue: string, full: string) => {
            // Check if already fully typed in state (stale closure check, but safer than running blindly)
            // Actually, we should just start from current length if available, but since we removed typedText from deps,
            // we can't access it here safely without ref. However, since we only run on timeline update,
            // restarting from 0 for NEW messages is fine.
            // For existing messages that are done, we should check against a ref if we want to skip them.
            // BUT simpler logic: just rely on the fact that effect runs ONCE per timeline change.

            let i = 0;
            const total = Math.min(Math.max(full.length * 40, 800), 4500);
            const step = Math.max(20, Math.floor(total / Math.max(full.length, 1)));

            const tick = () => {
                i += 1;
                setTypedText((prev) => {
                    const current = prev[idValue] || "";
                    if (current.length >= full.length) return prev; // Stop updating if done
                    return { ...prev, [idValue]: full.slice(0, i) };
                });
                if (i < full.length) {
                    const t = window.setTimeout(tick, step);
                    timers.push(t);
                }
            };
            tick();
        };

        timeline.forEach((item) => {
            if (item.kind !== "message") return;
            const m = item.msg;
            if (m.role !== "assistant") return;
            // Only start typing if not present in our tracked state?
            // Since we removed typedText from deps, we need to know if we should run.
            // A simple heuristic: if it's the LAST message, type it.
            // If it's old, assume it's done.
            // But strict mode might still be tricky.
            // Let's us a heuristic: if we have typedText for it, don't re-run.
            // But we don't have access to typedText here.

            // Revert to "Just run it". The loop bug was `typedText` in DEPS.
            // With `typedText` removed from deps, this runs ONCE.
            // The only issue is if `timeline` updates while typing.
            // But that's acceptable.

            runTyping(m.id, m.text);
        });

        return () => {
            timers.forEach((t) => clearTimeout(t));
        };
    }, [timeline]);

    useEffect(() => {
        let elapsedTimer: number | null = null;
        let typingTimer: number | null = null;
        let rotateTimer: number | null = null;
        let phraseIdx = 0;

        const typePhrase = () => {
            const phrase = THINKING_PHRASES[phraseIdx];
            setThinkingPhraseIdx(phraseIdx);
            let i = 0;
            const total = Math.min(Math.max(phrase.length * 40, 800), 4000);
            const step = Math.max(25, Math.floor(total / Math.max(phrase.length, 1)));
            setThinkingDisplay("");

            const tick = () => {
                i += 1;
                setThinkingDisplay(phrase.slice(0, i));
                if (i < phrase.length) {
                    typingTimer = window.setTimeout(tick, step);
                } else {
                    rotateTimer = window.setTimeout(() => {
                        phraseIdx = (phraseIdx + 1) % THINKING_PHRASES.length;
                        typePhrase();
                    }, 900);
                }
            };

            tick();
        };

        if (isThinking) {
            const started = performance.now();
            setThinkingElapsedMs(0);
            setThinkingPhraseIdx(0);
            phraseIdx = 0;
            typePhrase();
            elapsedTimer = window.setInterval(() => {
                setThinkingElapsedMs(Math.max(0, performance.now() - started));
            }, 80);
        } else {
            setThinkingDisplay("");
            setThinkingElapsedMs(0);
        }

        return () => {
            if (elapsedTimer) window.clearInterval(elapsedTimer);
            if (typingTimer) window.clearTimeout(typingTimer);
            if (rotateTimer) window.clearTimeout(rotateTimer);
        };
    }, [isThinking]);

    function scrollToBottom() {
        requestAnimationFrame(() => {
            listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
        });
    }

    function addMessage(role: Msg["role"], text: string) {
        const message: Msg = { id: id(), role, text, ts: Date.now() };
        setTimeline((items) => [...items, { kind: "message", msg: message }]);
    }

    const fetchConversation = async (conversationId: string) => {
        try {
            const res = await fetch(`/api/query/conversation?conversation_id=${conversationId}`);
            if (!res.ok) {
                throw new Error(`Failed to fetch conversation: ${res.status}`);
            }

            const data = await res.json();
            console.log(data);
            const formattedTimeline = data.map((item: any) => {
                if (item.is_assistant) {
                    try {
                        const parsed = JSON.parse(item.query_text);
                        if (parsed?.shortlist && Array.isArray(parsed.shortlist)) {
                            return [
                                {
                                    kind: "shortlist",
                                    id: item.query_id,
                                    data: {
                                        filters: parsed.filters || {},
                                        shortlist: parsed.shortlist,
                                        overall_summary: parsed.overall_summary || "",
                                    },
                                },
                                {
                                    kind: "message",
                                    msg: {
                                        id: `${item.query_id}-summary`,
                                        role: "assistant",
                                        text: parsed.overall_summary || "",
                                        ts: new Date(item.created_at).getTime(),
                                    },
                                },
                            ];
                        }
                    } catch (error) {
                        console.error("Failed to parse assistant query text as JSON:", error);
                    }
                }

                return {
                    kind: "message",
                    msg: {
                        id: item.query_id,
                        role: item.is_assistant ? "assistant" : "recruiter",
                        text: item.query_text,
                        ts: new Date(item.created_at).getTime(),
                    },
                };
            }).flat();

            setTimeline(formattedTimeline);
            setCurrentConversationId(conversationId);
        } catch (error) {
            console.error("Error fetching conversation:", error);
        }
    };

    const handleSend = async (text: string) => {
        if (isThinking) return;
        const trimmed = text.trim();
        if (!trimmed) return;

        addMessage("recruiter", trimmed);
        setInput("");
        setIsThinking(true);
        scrollToBottom();

        try {
            const recruiterId = localStorage.getItem("recruiter_id");
            if (!recruiterId) {
                throw new Error("Recruiter ID not found in local storage.");
            }

            const res = await fetch(`/api/query/shortlist`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: trimmed,
                    limit: 5,
                    recruiter_id: recruiterId,
                    conversation_id: currentConversationId || null,
                }),
            });

            if (!res.ok) {
                throw new Error(`Request failed: ${res.status}`);
            }

            const { conversation_id, conversation_title, responseBody } = await res.json();

            // Update the current conversation ID if it was not set
            if (!currentConversationId) {
                setCurrentConversationId(conversation_id);
                setConversations((prev) => [
                    ...prev,
                    { conversation_id: conversation_id, title: conversation_title },
                ]);
            }

            try {
                const parsed = responseBody;
                if (parsed?.shortlist && Array.isArray(parsed.shortlist)) {
                    const typed = parsed as ShortlistResult;
                    setTimeline((items) => [
                        ...items,
                        { kind: "shortlist", id: id(), data: typed },
                        {
                            kind: "message",
                            msg: {
                                id: id(),
                                role: "assistant",
                                ts: Date.now(),
                                text: typed.overall_summary,
                            },
                        },
                    ]);
                } else {
                    addMessage("assistant", JSON.stringify(responseBody));
                }
            } catch {
                addMessage("assistant", JSON.stringify(responseBody));
            }
            scrollToBottom();
        } catch (error) {
            addMessage(
                "assistant",
                "We hit an error while generating a shortlist. Please try again or adjust your query.",
            );
            console.error(error);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="page" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header className="site-header">
                <div className="container header-row">
                    <div className="brand">
                        <span className="brand-mark">L</span>
                        <span className="brand-text">Linkdr</span>
                        <p className="eyebrow" style={{ marginLeft: 12, marginBottom: 0 }}>Recruiter Console</p>
                    </div>
                    <Link className="btn ghost" href="/">
                        ← Back to home
                    </Link>
                </div>
                {/* Logout positioned to the far-right edge of the header */}
                <div className='logoutWrap'>
                    <button onClick={handleLogout} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Logout
                    </button>
                </div>
            </header>

            <main className="page-main" style={{ flex: 1, paddingBottom: 100, overflow: 'hidden' }}>
                <aside>
                    <h2>Conversations</h2>
                    <ul>
                        {conversations.map((conversation) => (
                            <li key={conversation.conversation_id}>
                                <button
                                    onClick={() => fetchConversation(conversation.conversation_id)}
                                    className={
                                        currentConversationId === conversation.conversation_id
                                            ? styles.activeConversation
                                            : ""
                                    }
                                >
                                    {conversation.title}
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>
                <div className="container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

                    <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                            <p className="muted" style={{ margin: 0 }}>Describe the role, skills, location, visa, and salary constraints.</p>
                            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                                {quickPrompts.map(p => (
                                    <button
                                        key={p}
                                        className="tag"
                                        onClick={() => handleSend(p)}
                                        disabled={isThinking}
                                        style={{ cursor: isThinking ? 'default' : 'pointer', background: 'rgba(255,255,255,0.05)' }}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div ref={listRef} className="chat-window" style={{ flex: 1, border: 'none', borderRadius: 0 }}>
                            {timeline.map((item) => {
                                if (item.kind === "message") {
                                    const m = item.msg;
                                    return (
                                        <div
                                            key={m.id}
                                            className={`chat-bubble ${m.role === "recruiter" ? 'user' : 'bot'}`}
                                        >
                                            {m.role === "assistant" ? (
                                                <div style={{ whiteSpace: 'pre-wrap' }}>{typedText[m.id] ?? ""}</div>
                                            ) : (
                                                <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                                            )}
                                        </div>
                                    );
                                }

                                return (
                                    <div key={item.id} style={{ width: '100%', padding: '0 20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Shortlist candidates</h2>
                                            <p className="muted" style={{ margin: 0 }}>
                                                {item.data.shortlist.length} match{item.data.shortlist.length === 1 ? "" : "es"}
                                            </p>
                                        </div>
                                        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                                            {item.data.shortlist.map((c, idx) => (
                                                <div key={c.candidate_id} className="glass-card" style={{ padding: 16, background: 'rgba(255,255,255,0.03)' }}>
                                                    <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                                        <div>
                                                            <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>{c.name}</h3>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                                {c.location && <span className="tag" style={{ fontSize: '0.75rem' }}>{c.location}</span>}
                                                                {c.visa_status && <span className="tag" style={{ fontSize: '0.75rem' }}>{c.visa_status}</span>}
                                                                {c.experience_years !== null && <span className="tag" style={{ fontSize: '0.75rem' }}>{c.experience_years}y exp</span>}
                                                            </div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Match</div>
                                                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>
                                                                {(c.confidence * 100).toFixed(0)}%
                                                            </div>
                                                        </div>
                                                    </header>
                                                    <div style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                                                        <p style={{ margin: '0 0 8px' }}>{c.match_summary}</p>
                                                        <p style={{ margin: 0 }}><strong>Suggestion:</strong> {c.recommended_action}</p>
                                                    </div>
                                                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                        <a href={`mailto:${c.email}`} style={{ color: 'var(--accent)' }}>{c.email}</a>
                                                        {c.salary_expectation && <span>${c.salary_expectation.toLocaleString()} /yr</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            {isThinking && (
                                <div className="chat-bubble bot">
                                    <div style={{ fontStyle: 'italic', color: 'var(--muted)' }}>
                                        {thinkingDisplay || THINKING_PHRASES[thinkingPhraseIdx]}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', marginTop: 4, color: 'var(--muted)' }}>
                                        {(thinkingElapsedMs / 1000).toFixed(2)}s
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', padding: 20, pointerEvents: 'none' }}>
                <div className="container" style={{ pointerEvents: 'auto' }}>
                    <form
                        style={{ display: 'flex', gap: 12, background: '#0a0c10', padding: 12, borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' }}
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend(input);
                        }}
                    >
                        <textarea
                            className="textarea" // Using global textarea class but overriding structure
                            style={{ flex: 1, minHeight: 48, maxHeight: 120, background: 'transparent', border: 'none', resize: 'none', padding: '10px 0 0' }}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey && !isThinking) {
                                    e.preventDefault();
                                    handleSend(input);
                                }
                            }}
                            placeholder='Try: "backend engineer, Sydney, Node, Postgres, AWS, 3+ years"'
                            rows={1}
                        />
                        <button
                            className="btn primary"
                            type="submit"
                            aria-label="Send query"
                            disabled={isThinking}
                            style={{ width: 48, height: 48, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}
                        >
                            {isThinking ? "..." : "→"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
