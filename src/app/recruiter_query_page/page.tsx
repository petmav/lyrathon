"use client";

import React, { useMemo, useRef, useState } from "react";
import styles from "./recruiter_query_page.module.css";
import { JSX } from "react/jsx-runtime";
import Link from "next/link";

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

const SAMPLE_CANDIDATES: Role[] = [
    {
        name: "Alex Chen",
        title: "Software Engineer (Frontend)",
        location: "Sydney (Hybrid)",
        skills: ["TypeScript", "React", "Next.js", "tRPC"],
        years: 3,
        availability: "2 weeks",
    },
    {
        name: "Sam Patel",
        title: "Data Analyst",
        location: "Remote (AU)",
        skills: ["SQL", "Python", "Power BI", "dbt"],
        years: 2,
        availability: "Immediate",
    },
    {
        name: "Jordan Lee",
        title: "Backend Engineer",
        location: "Melbourne",
        skills: ["Node.js", "PostgreSQL", "AWS", "REST"],
        years: 4,
        availability: "1 month",
    },
];

function id() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function simpleMatch(query: string): Role[] {
    const q = query.toLowerCase();
    const skills = q
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

    return SAMPLE_CANDIDATES
        .map((c) => {
            const hay = `${c.name} ${c.title} ${c.location} ${c.skills.join(" ")}`.toLowerCase();
            let score = 0;

            // boost matching keywords/skills
            for (const s of skills) if (hay.includes(s.toLowerCase())) score += 2;

            // loose keyword boosting
            if (q.includes("frontend") && c.title.toLowerCase().includes("front")) score += 2;
            if (q.includes("backend") && c.title.toLowerCase().includes("back")) score += 2;
            if (q.includes("data") && c.title.toLowerCase().includes("data")) score += 2;
            if (q.includes("remote") && c.location.toLowerCase().includes("remote")) score += 1;
            if (q.includes("sydney") && c.location.toLowerCase().includes("sydney")) score += 1;
            if (q.includes("melbourne") && c.location.toLowerCase().includes("melbourne")) score += 1;

            return { c, score };
        })
        .filter((x) => x.score > 0 || q.length < 6) // if query is short, still show something
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((x) => x.c);
}

export default function RecruiterQueryPage(): JSX.Element {
    const [input, setInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
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

  const listRef = useRef<HTMLDivElement | null>(null);

  const quickPrompts = useMemo(
        () => [
            "Frontend engineer, Sydney, React + TypeScript, 2+ years",
            "Data analyst, remote AU, SQL + Python",
            "Backend engineer, Melbourne, Node + Postgres + AWS",
        ],
        []
    );

    function scrollToBottom() {
        requestAnimationFrame(() => {
            listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
        });
    }

    function addMessage(role: Msg["role"], text: string) {
        const message: Msg = { id: id(), role, text, ts: Date.now() };
        setTimeline((items) => [...items, { kind: "message", msg: message }]);
    }

    async function handleSend(text: string) {
        if (isThinking) return;
        const trimmed = text.trim();
        if (!trimmed) return;

        addMessage("recruiter", trimmed);
        setInput("");
        setIsThinking(true);
        scrollToBottom();

        try {
            const res = await fetch("/api/query/shortlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: trimmed, limit: 5 }),
            });

            if (!res.ok) {
                throw new Error(`Request failed: ${res.status}`);
            }
            const replyText = await res.text();
            try {
                const parsed = JSON.parse(replyText);
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
                                text: `Summary: ${typed.overall_summary}`,
                            },
                        },
                    ]);
                } else {
                    addMessage("assistant", replyText);
                }
            } catch {
                addMessage("assistant", replyText);
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
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={`${styles.container} ${styles.headerInner}`}>
                    <div className={styles.brandRow}>
                        <div className={styles.brand}>
                            <span className={styles.brandMark}>L</span>
                            <span className={styles.brandText}>Linkdr</span>
                        </div>
                        <Link className={styles.back} href="/">
                            ← Back to home
                        </Link>
                    </div>
                    <div className={styles.headerCopy}>
                        <p className={styles.eyebrow}>Recruiter Console</p>
                        <p className={styles.subtitle}>
                            Hard filters via SQL, semantic recall via vectors, re-ranked with LLM reasoning.
                        </p>
                    </div>
                </div>
            </header>

            <main className={styles.main}>
                <div className={styles.container}>
                    <section className={styles.chatShell}>
                        <div className={styles.chatTop}>
                            <div>
                                <p className={styles.muted}>Describe the role, skills, location, visa, and salary constraints.</p>
                                <div className={styles.quickRow} aria-label="Quick prompts">
                                    {quickPrompts.map((p) => (
                                        <button
                                            key={p}
                                            className={styles.quick}
                                            type="button"
                                            disabled={isThinking}
                                            onClick={() => handleSend(p)}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div ref={listRef} className={styles.chatWindow} role="log" aria-label="Chat">
                            {timeline.map((item) => {
                                if (item.kind === "message") {
                                    const m = item.msg;
                                    return (
                                        <div
                                            key={m.id}
                                            className={`${styles.msgRow} ${m.role === "recruiter" ? styles.right : styles.left}`}
                                        >
                                            <div className={`${styles.msg} ${m.role === "recruiter" ? styles.user : styles.bot}`}>
                                                {m.text.split("\n").map((line, idx) => (
                                                    <p key={idx} className={styles.line}>
                                                        {line}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={item.id} className={styles.shortlistBlock}>
                                        <div className={styles.resultsHeader}>
                                            <h2 className={styles.sectionTitle}>Shortlist</h2>
                                            <p className={styles.muted}>
                                                Showing {item.data.shortlist.length} candidate
                                                {item.data.shortlist.length === 1 ? "" : "s"}
                                            </p>
                                        </div>
                                        <div className={styles.shortlistGrid}>
                                            {item.data.shortlist.map((c) => (
                                                <article key={c.candidate_id} className={styles.shortlistCard}>
                                                    <header className={styles.cardHeader}>
                                                        <div>
                                                            <h3 className={styles.cardTitle}>{c.name}</h3>
                                                            <div className={styles.tags}>
                                                                {c.location && <span className={styles.tag}>{c.location}</span>}
                                                                {c.visa_status && <span className={styles.tag}>{c.visa_status}</span>}
                                                                {c.experience_years !== null && (
                                                                    <span className={styles.tag}>{c.experience_years} yrs exp</span>
                                                                )}
                                                                {c.age !== null && <span className={styles.tag}>{c.age} y/o</span>}
                                                            </div>
                                                        </div>
                                                        <div className={styles.confidence}>
                                                            <span className={styles.confLabel}>Confidence</span>
                                                            <div className={styles.confBar}>
                                                                <span
                                                                    className={styles.confFill}
                                                                    style={{
                                                                        width: `${Math.min(Math.max(c.confidence * 100, 0), 100)}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className={styles.confValue}>
                                                                {(Math.min(Math.max(c.confidence, 0), 1) * 100).toFixed(0)}%
                                                            </span>
                                                        </div>
                                                    </header>

                                                    <div className={styles.cardBody}>
                                                        <p className={styles.cardText}>{c.match_summary}</p>
                                                        <p className={styles.cardText}>
                                                            <strong>Recommended:</strong> {c.recommended_action}
                                                        </p>
                                                        <div className={styles.metaRow}>
                                                            <a className={styles.emailLink} href={`mailto:${c.email}`}>
                                                                {c.email}
                                                            </a>
                                                            {c.salary_expectation !== null && (
                                                                <span className={styles.metaPill}>
                                                                    Salary exp: {c.salary_expectation.toLocaleString("en-US")}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            {isThinking && (
                                <div className={`${styles.msgRow} ${styles.left}`}>
                                    <div className={`${styles.msg} ${styles.bot}`}>
                                        <p className={`${styles.line} ${styles.thinking}`}>Thinking…</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                </div>
            </main>

            <div className={styles.container}>
                <form
                    className={styles.composerBar}
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend(input);
                    }}
                >
                    <textarea
                        className={styles.input}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey && !isThinking) {
                                e.preventDefault();
                                handleSend(input);
                            }
                        }}
                        placeholder='Try: "backend engineer, Sydney, Node, Postgres, AWS, 3+ years"'
                        rows={2}
                    />
                    <button
                        className={styles.sendBtn}
                        type="submit"
                        aria-label="Send query"
                        disabled={isThinking}
                    >
                        {isThinking ? <span className={styles.spinner} aria-hidden="true" /> : "→"}
                    </button>
                </form>
            </div>
        </div>
    );
}
