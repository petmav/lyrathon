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
    const [messages, setMessages] = useState<Msg[]>(() => [
        {
            id: id(),
            role: "assistant",
            ts: Date.now(),
            text:
                "Describe the employee you’re looking for (role, location, skills, years). Example: “frontend engineer, Sydney, React + TypeScript, 2+ years”.",
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
        setMessages((m) => [...m, { id: id(), role, text, ts: Date.now() }]);
    }

    function handleSend(text: string) {
        const trimmed = text.trim();
        if (!trimmed) return;

        addMessage("recruiter", trimmed);
        setInput("");
        setIsThinking(true);

        // Replace this block with a real API call later.
        // const matches = simpleMatch(trimmed);
        // const reply =
        //     matches.length === 0
        //         ? "No matches found in the sample dataset. Try different keywords (skills, city, role)."
        //         : `Top matches:\n${matches
        //             .map(
        //                 (c, i) =>
        //                     `${i + 1}) ${c.name} — ${c.title} • ${c.location}\n   Skills: ${c.skills.join(
        //                         ", "
        //                     )}\n   Experience: ${c.years} yrs • Availability: ${c.availability}`
        //             )
        //             .join("\n")}\n\nTip: add must-have skills (e.g., “Next.js, tRPC”) to narrow results.`;
        
        const reply = "🚧 This is a demo page. Connect to your RAG/SQL/vector service to get real candidate matches. 🚧";
        addMessage("assistant", reply);
        setIsThinking(false);
        scrollToBottom();
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={`${styles.container} ${styles.headerInner}`}>
                    <div className={styles.brandRow}>
                        <div className={styles.brand}>
                            <span className={styles.brandMark}>L</span>
                            <span className={styles.brandText}>Linkdr</span>
                            <span className={styles.eyebrow}>Recruiter Console</span>
                        </div>
                        <Link className={styles.back} href="/">
                            ← Back to home
                        </Link>
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
                                        <button key={p} className={styles.quick} type="button" onClick={() => handleSend(p)}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div ref={listRef} className={styles.chatWindow} role="log" aria-label="Chat">
                            {messages.map((m) => (
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
                            ))}
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
                            if (e.key === "Enter" && !e.shiftKey) {
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
                        <span className={isThinking ? styles.spinner : ""}>→</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
