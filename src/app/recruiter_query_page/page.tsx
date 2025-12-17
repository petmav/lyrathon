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

type Conversation = {
    conversation_id: string | null;
    title: string;
};

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

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
                setConversations([...conversations, { title: 'New Conversation', conversation_id: null }]);
            } catch (error) {
                console.error("Error fetching conversation history:", error);
            }
        };

        fetchConversations();
    }, []);

    useEffect(() => {
        const timers: number[] = [];

        const runTyping = (idValue: string, full: string) => {
            let i = 0;
            const total = Math.min(Math.max(full.length * 40, 800), 4500);
            const step = Math.max(20, Math.floor(total / Math.max(full.length, 1)));

            const tick = () => {
                i += 1;
                setTypedText((prev) => {
                    const current = prev[idValue] || "";
                    if (current.length >= full.length) return prev;
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

    const fetchConversation = async (conversationId: string | null) => {
        if (conversationId === null) {
            setTimeline([
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
            setCurrentConversationId(null);
            return;
        }
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
                    { conversation_id: conversation_id, title: conversation_title },
                    ...prev,
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

    const hasMessages = timeline.length > 1;

    return (
        <div className="page" style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <header className="site-header" style={{ zIndex: 50 }}>
                <div className="container header-row" style={{ maxWidth: '100%' }}>
                    <div className="brand" style={{ gap: 0, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="btn ghost"
                            style={{ padding: 8, marginRight: 16, display: 'grid', placeItems: 'center', color: 'var(--text)' }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                        <span className="brand-mark">L</span>
                        <span className="brand-text" style={{ marginLeft: 24 }}>Linkdr</span>
                        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 24px' }} />
                        <p className="eyebrow" style={{ margin: 0, fontSize: '0.85rem', letterSpacing: '0.05em', color: 'var(--muted)' }}>RECRUITER CONSOLE</p>
                    </div>
                </div>
                <div className='logoutWrap'>
                    {/* ... (keep logout) */}
                </div>
            </header>

            {/* SIDEBAR DRAWER */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: 320,
                    background: 'rgba(10, 12, 18, 0.8)',
                    backdropFilter: 'blur(24px)',
                    borderRight: '1px solid var(--border)',
                    zIndex: 49,
                    transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    paddingTop: 80 // Header height offset
                }}
            >
                <div style={{ padding: 24 }}>
                    <button
                        onClick={() => {
                            fetchConversation(null);
                            setIsSidebarOpen(false);
                        }}
                        className="btn secondary"
                        style={{ width: '100%', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}
                    >
                        <span>+</span> New Query
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 20px' }}>
                    <p className="eyebrow" style={{ padding: '0 12px', marginBottom: 12, fontSize: '0.75rem', opacity: 0.7 }}>History</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4 }}>
                        {conversations.map((c, i) => (
                            <li key={c.conversation_id || 'new'}
                                style={{
                                    opacity: isSidebarOpen ? 1 : 0,
                                    transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-10px)',
                                    transition: `opacity 0.3s ease ${i * 0.05}s, transform 0.3s ease ${i * 0.05}s`
                                }}
                            >
                                <button
                                    onClick={() => {
                                        fetchConversation(c.conversation_id);
                                        setIsSidebarOpen(false);
                                    }}
                                    className="btn-reset"
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '12px 16px',
                                        borderRadius: 12,
                                        fontSize: '0.9rem',
                                        color: currentConversationId === c.conversation_id ? 'var(--text)' : 'var(--muted)',
                                        background: currentConversationId === c.conversation_id ? 'linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))' : 'transparent',
                                        border: currentConversationId === c.conversation_id ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                                        transition: 'all 0.2s',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={e => {
                                        if (currentConversationId !== c.conversation_id) {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                            e.currentTarget.style.color = 'var(--text)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (currentConversationId !== c.conversation_id) {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = 'var(--muted)';
                                        }
                                    }}
                                >
                                    {c.title || 'Untitled Query'}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* BACKDROP */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(2px)',
                        zIndex: 48,
                        transition: 'opacity 0.3s'
                    }}
                />
            )}

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                {/* REMOVED OLD SIDEBAR */}

                {/* MAIN CONTENT AREA */}
                <main className="page-main" style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div className="scroll-container" style={{ flex: 1, overflowY: 'auto', padding: '40px 0 120px' }} ref={listRef}>
                        <div className="container" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', position: 'relative', width: '100%', maxWidth: 1000, margin: '0 auto' }}>

                            {/* Hero Empty State */}
                            {!hasMessages && (
                                <div className={`hero-content reveal ${!hasMessages ? "show reveal-delay-0" : ""}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', paddingBottom: 100 }}>
                                    <p className="eyebrow">AI Recruiter</p>
                                    <h1 className="hero-title" style={{ maxWidth: 800 }}>
                                        Who are you hiring today?
                                    </h1>
                                    <p className="hero-subtitle" style={{ maxWidth: 600, margin: '20px auto 40px' }}>
                                        Describe the ideal candidate using natural language. I&apos;ll handle the boolean logic, vector matching, and salary negotiation checks.
                                    </p>

                                    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', width: '100%', maxWidth: 900 }}>
                                        {quickPrompts.map((p, i) => (
                                            <button
                                                key={p}
                                                className="glass-card btn-reset"
                                                onClick={() => handleSend(p)}
                                                disabled={isThinking}
                                                style={{
                                                    textAlign: 'left',
                                                    padding: 24,
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.2s, background 0.2s',
                                                    background: 'rgba(255,255,255,0.03)'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Example {i + 1}</div>
                                                <div style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.4 }}>{p}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Chat Interface */}
                            {hasMessages && (
                                <div className="chat-window" style={{ border: 'none', background: 'transparent', height: 'auto', overflow: 'visible' }}>
                                    {timeline.slice(1).map((item) => { // Skip the initial prompt message in chat view
                                        if (item.kind === "message") {
                                            const m = item.msg;
                                            const isUser = m.role === "recruiter";
                                            return (
                                                <div key={m.id} className={`chat-row reveal show ${isUser ? 'user' : 'bot'}`} style={{ display: 'flex', flexDirection: 'row', gap: 16, marginBottom: 24, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                                                    {!isUser && (
                                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 900, flexShrink: 0, boxShadow: 'var(--shadow)' }}>L</div>
                                                    )}

                                                    <div className="chat-bubble"
                                                        style={{
                                                            background: isUser ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : 'rgba(255,255,255,0.05)',
                                                            color: isUser ? '#050712' : 'var(--text)',
                                                            border: isUser ? 'none' : '1px solid var(--border)',
                                                            backdropFilter: 'blur(12px)',
                                                            borderRadius: 24,
                                                            padding: '16px 24px',
                                                            maxWidth: '80%',
                                                            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                                                            order: isUser ? 1 : 2
                                                        }}
                                                    >
                                                        {m.role === "assistant" ? (
                                                            <div style={{ whiteSpace: 'pre-wrap' }}>{typedText[m.id] ?? m.text}</div>
                                                        ) : (
                                                            <div style={{ whiteSpace: 'pre-wrap', fontWeight: 500 }}>{m.text}</div>
                                                        )}
                                                    </div>

                                                    {isUser && (
                                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', flexShrink: 0, order: 2 }}>R</div>
                                                    )}
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={item.id} className="reveal show" style={{ width: '100%', padding: '20px 0 40px', maxWidth: 1000, margin: '0 auto' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                                    <h2 className="section-title" style={{ fontSize: '1.5rem' }}>Shortlist Candidates</h2>
                                                    <span className="badge">{item.data.shortlist.length} matches</span>
                                                </div>
                                                <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                                                    {item.data.shortlist.map((c, idx) => (
                                                        <div key={c.candidate_id} className="glass-card" style={{ padding: 20, transition: 'transform 0.2s', cursor: 'pointer' }}
                                                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                                                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                                        >
                                                            <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                                                <div>
                                                                    <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem' }}>{c.name}</h3>
                                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                                        {c.location && <span className="tag">{c.location}</span>}
                                                                        {c.experience_years !== null && <span className="tag">{c.experience_years}y exp</span>}
                                                                    </div>
                                                                </div>
                                                                <div style={{ textAlign: 'right' }}>
                                                                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Match</div>
                                                                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>
                                                                        {(c.confidence * 100).toFixed(0)}%
                                                                    </div>
                                                                </div>
                                                            </header>
                                                            <div style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--muted)', marginBottom: 16 }}>
                                                                {c.match_summary}
                                                            </div>
                                                            <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                                                                <span style={{ color: 'var(--text)' }}>{c.recommended_action}</span>
                                                                <button className="btn text" style={{ padding: 0 }}>View Profile →</button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {/* Thinking State */}
                                    {isThinking && (
                                        <div className="chat-row reveal show bot" style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 900, flexShrink: 0, boxShadow: 'var(--shadow)' }}>L</div>
                                            <div className="chat-bubble" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: '16px 24px', border: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}>
                                                <div style={{ fontStyle: 'italic', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span>{thinkingDisplay || THINKING_PHRASES[thinkingPhraseIdx]}</span>
                                                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{(thinkingElapsedMs / 1000).toFixed(1)}s</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div style={{ height: 100 }} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Floating Input Capsule - Repositioned relative to main content area to avoid sidebar overlap if sticking to screen */}
                    <div style={{
                        position: 'absolute', // Changed to absolute within the active relative container
                        bottom: 32,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 'min(720px, 90%)',
                        zIndex: 40
                    }}>
                        <div className="glass-card" style={{ padding: 8, backdropFilter: 'blur(20px)', background: 'rgba(10, 12, 20, 0.65)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', borderRadius: 20 }}>
                            <form
                                style={{ display: 'flex', gap: 12, alignItems: 'center' }}
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSend(input);
                                }}
                            >
                                <textarea
                                    className="textarea"
                                    style={{
                                        flex: 1,
                                        minHeight: 48,
                                        maxHeight: 120,
                                        background: 'transparent',
                                        border: 'none',
                                        resize: 'none',
                                        padding: '12px 16px',
                                        fontSize: '1rem',
                                        color: 'var(--text)'
                                    }}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey && !isThinking) {
                                            e.preventDefault();
                                            handleSend(input);
                                        }
                                    }}
                                    placeholder={hasMessages ? "Ask follow-up..." : "Describe your ideal candidate..."}
                                    rows={1}
                                />
                                <button
                                    className="btn primary"
                                    type="submit"
                                    aria-label="Send query"
                                    disabled={isThinking || !input.trim()}
                                    style={{ width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, flexShrink: 0, opacity: input.trim() ? 1 : 0.5 }}
                                >
                                    <span style={{ fontSize: '1.2rem', marginTop: -2 }}>↑</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
