"use client";

import React, { useEffect, useState } from "react";
import { JSX } from "react/jsx-runtime";

type CandidateDetail = {
    name: string;
    email: string;
    age: number;
    current_position: string;
    location: string;
    visa_status: string;
    experience_years: number;
    salary_expectation: number;
    availability_date: string;
    skills_text: string;
    awards_text: string;
    certifications_text: string;
    projects_text: string;
    previous_positions: any[];
    education: any[];
    documents: any[];
    verifications: any[];
};

interface CandidateDetailModalProps {
    candidateId: string;
    onClose: () => void;
}

export default function CandidateDetailModal({ candidateId, onClose }: CandidateDetailModalProps): JSX.Element {
    const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCandidate = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/candidates?candidate_id=${candidateId}`);
                if (!res.ok) {
                    throw new Error(`Failed to fetch candidate: ${res.status}`);
                }
                const json = await res.json();
                if (json.data) {
                    setCandidate(json.data);
                } else {
                    setError("Candidate not found");
                }
            } catch (err: any) {
                setError(err.message || "An error occurred");
            } finally {
                setLoading(false);
            }
        };

        if (candidateId) {
            fetchCandidate();
        }
    }, [candidateId]);

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    if (!candidateId) return <></>;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content glass-card"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: 900, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
                {/* Header */}
                <div className="modal-header" style={{ padding: "24px 32px", margin: 0, background: "rgba(255,255,255,0.03)" }}>
                    <div>
                        {loading ? (
                            <div style={{ height: 32, width: 200, background: "var(--border)", borderRadius: 8, animation: "pulse 2s infinite" }} />
                        ) : candidate ? (
                            <>
                                <h2 className="modal-title" style={{ fontSize: "1.8rem", marginBottom: 8 }}>{candidate.name}</h2>
                                <div style={{ display: "flex", gap: 12, color: "var(--muted)", fontSize: "0.95rem" }}>
                                    <span>{candidate.current_position}</span>
                                    <span>•</span>
                                    <span>{candidate.location}</span>
                                </div>
                            </>
                        ) : (
                            <h2 className="modal-title">Error loading candidate</h2>
                        )}
                    </div>
                    <button onClick={onClose} className="modal-close">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: 32, overflowY: "auto", flex: 1 }}>
                    {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ height: 20, width: "60%", background: "var(--border)", borderRadius: 4 }} />
                            <div style={{ height: 20, width: "80%", background: "var(--border)", borderRadius: 4 }} />
                            <div style={{ height: 100, width: "100%", background: "var(--border)", borderRadius: 4 }} />
                        </div>
                    ) : error ? (
                        <div style={{ color: "red", padding: 20, textAlign: "center" }}>{error}</div>
                    ) : candidate ? (
                        <div style={{ display: "grid", gap: 32 }}>
                            {/* Key Stats Grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
                                <StatBox label="Experience" value={`${candidate.experience_years ?? 0} years`} />
                                <StatBox label="Visa Status" value={candidate.visa_status || "N/A"} />
                                <StatBox label="Availability" value={candidate.availability_date ? new Date(candidate.availability_date).toLocaleDateString() : "Immediate"} />
                                <StatBox label="Salary Exp." value={candidate.salary_expectation ? `$${candidate.salary_expectation.toLocaleString()}` : "Negotiable"} />
                            </div>

                            {/* Skills */}
                            {candidate.skills_text && (
                                <div>
                                    <h3 className="eyebrow" style={{ marginBottom: 16, color: "var(--accent)" }}>Skills</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {candidate.skills_text.split(',').map((s, i) => (
                                            <span key={i} className="tag" style={{ background: 'rgba(154,107,255,0.15)', borderColor: 'rgba(154,107,255,0.3)', color: '#e8edf5' }}>
                                                {s.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Projects */}
                            {candidate.projects_text && (
                                <div>
                                    <h3 className="eyebrow" style={{ marginBottom: 16, color: "var(--accent)" }}>Projects</h3>
                                    <div className="glass-card" style={{ padding: 20, background: 'rgba(255,255,255,0.03)' }}>
                                        <p style={{ lineHeight: 1.6, color: "var(--text-secondary)", whiteSpace: "pre-wrap", margin: 0 }}>{candidate.projects_text}</p>
                                    </div>
                                </div>
                            )}

                            {/* Experience */}
                            {candidate.previous_positions && candidate.previous_positions.length > 0 && (
                                <div>
                                    <h3 className="eyebrow" style={{ marginBottom: 16, color: "var(--accent)" }}>Experience</h3>
                                    <div style={{ display: "grid", gap: 12 }}>
                                        {candidate.previous_positions.map((pos: any, i: number) => (
                                            <div key={i} className="glass-card" style={{ padding: 20, background: "rgba(255,255,255,0.03)" }}>
                                                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>{pos.title}</div>
                                                <div style={{ fontSize: "0.95rem", color: "var(--muted)", marginBottom: 8 }}>{pos.org || pos.company}</div>
                                                <div style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: 8 }}>{pos.start_date} - {pos.end_date || "Present"}</div>
                                                {pos.description && <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.5, color: 'var(--text-secondary)' }}>{pos.description}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Education */}
                            {candidate.education && candidate.education.length > 0 && (
                                <div>
                                    <h3 className="eyebrow" style={{ marginBottom: 16, color: "var(--accent)" }}>Education</h3>
                                    <div style={{ display: "grid", gap: 12 }}>
                                        {candidate.education.map((edu: any, i: number) => (
                                            <div key={i} className="glass-card" style={{ padding: 20, background: "rgba(255,255,255,0.03)" }}>
                                                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>{edu.school || edu.institution}</div>
                                                <div style={{ fontSize: "0.95rem", color: "var(--text)" }}>{edu.degree} {edu.field ? `in ${edu.field}` : ""}</div>
                                                <div style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: 4 }}>Class of {edu.graduation_year || edu.end_date}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Contact Info */}
                            <div>
                                <h3 className="eyebrow" style={{ marginBottom: 16, color: "var(--accent)" }}>Contact</h3>
                                <div className="glass-card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ overflow: 'hidden' }}>
                                        <div style={{ fontWeight: 700, wordBreak: 'break-word' }}>{candidate.email}</div>
                                        {candidate.location && (
                                            <div style={{ fontSize: '0.95rem', color: 'var(--muted)' }}>{candidate.location}</div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <a
                                            href={`mailto:${candidate.email}`}
                                            style={{
                                                background: 'var(--accent)',
                                                color: '#fff',
                                                padding: '8px 12px',
                                                borderRadius: 6,
                                                textDecoration: 'none',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Email
                                        </a>
                                        <button
                                            onClick={() => {
                                                try {
                                                    navigator.clipboard?.writeText(candidate.email || '');
                                                } catch (e) {
                                                    /* ignore */
                                                }
                                            }}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: 6,
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                background: 'transparent',
                                                color: 'var(--text)'
                                            }}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function StatBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="glass-card" style={{ padding: 16, background: "rgba(255,255,255,0.03)", textAlign: 'center' }}>
            <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{value}</div>
        </div>
    );
}
