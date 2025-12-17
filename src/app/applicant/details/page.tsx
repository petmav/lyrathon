"use client"

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type ApplicationForm = {
  name: string;
  email: string;
  location: string;
  visaStatus: string;
  skills: string[];
  experience: string;
  jobHistory: string;
  certifications: string;
  resumeName: string;
  status: string;
};

const initialApplication: ApplicationForm = {
  name: "Jane Doe",
  email: "jane.doe@example.com",
  location: "Sydney, Australia",
  visaStatus: "Permanent Resident",
  skills: ["JavaScript", "React", "Node.js"],
  experience:
    "3+ years experience building full-stack web applications in React and Node.js.",
  jobHistory:
    "Frontend Engineer at Acme Corp (2022–Present)\nJunior Developer at Beta Labs (2020–2022)",
  certifications: "AWS Certified Cloud Practitioner",
  resumeName: "Jane_Doe_Resume.pdf",
  status: "Submitted",
};

export default function ApplicationDetailsPage() {
  const [application, setApplication] = useState<ApplicationForm>(initialApplication);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<ApplicationForm>(initialApplication);

  const router = useRouter();

  const handleLogout = () => {
    router.push('/');
  };

  const handleSave = () => {
    const normalizedSkills = Array.isArray(editData.skills)
      ? editData.skills
      : String(editData.skills)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    setApplication({
      ...editData,
      skills: normalizedSkills,
    });
    setEditOpen(false);
  };

  const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, color: '#e8edf5' }}>
        {title}
      </h3>
      <div style={{ color: '#b7c2d9' }}>{children}</div>
    </div>
  );

  return (
    <div className="no-scroll-app">
      <div className="viewport-container" style={{
        background: 'radial-gradient(circle at 50% 10%, rgba(20, 25, 50, 0.6) 0%, rgba(5, 8, 20, 1) 100%)',
        overflowY: 'auto'
      }}>

        {/* Header */}
        <div style={{
          padding: '16px 32px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(5, 8, 20, 0.8)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>My Application</div>
          <button onClick={handleLogout} className="btn secondary" style={{ padding: '6px 16px' }}>
            Logout
          </button>
        </div>

        <div style={{
          maxWidth: 900,
          margin: '32px auto',
          padding: '0 24px'
        }}>
          <div className="glass-card" style={{ padding: 40 }}>
            {/* Title Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Application details</h1>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{
                  padding: '4px 12px',
                  borderRadius: 99,
                  background: 'rgba(154, 107, 255, 0.15)',
                  color: '#9a6bff',
                  border: '1px solid rgba(154, 107, 255, 0.3)',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}>
                  {application.status}
                </div>
                <button
                  onClick={() => { setEditData({ ...application }); setEditOpen(true); }}
                  className="btn secondary"
                >
                  Edit
                </button>
              </div>
            </div>

            <hr style={{ border: '0', borderTop: '1px solid rgba(255,255,255,0.1)', marginBottom: 32 }} />

            <Section title="Personal information">
              <div style={{ display: 'grid', gap: 8 }}>
                <div>Name: <span style={{ color: '#fff' }}>{application.name}</span></div>
                <div>Email: <span style={{ color: '#fff' }}>{application.email}</span></div>
                <div>Location: <span style={{ color: '#fff' }}>{application.location}</span></div>
                <div>Visa status: <span style={{ color: '#fff' }}>{application.visaStatus}</span></div>
              </div>
            </Section>

            <Section title="Skills">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {application.skills.map((skill, idx) => (
                  <span key={idx} style={{
                    padding: '4px 12px',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '0.9rem'
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </Section>

            <Section title="Professional experience">
              <div style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                {application.experience}
              </div>
            </Section>

            <Section title="Job history">
              <div style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                {application.jobHistory}
              </div>
            </Section>

            <Section title="Certifications">
              <div>{application.certifications}</div>
            </Section>

            <Section title="Resume">
              <div style={{ color: '#4fd1c5', fontWeight: 500 }}>{application.resumeName}</div>
            </Section>
          </div>
        </div>

        {/* Edit Modal / Slide-over Overlay */}
        {editOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'grid',
            placeItems: 'center',
            padding: 24
          }}>
            <div className="glass-card" style={{
              width: '100%',
              maxWidth: 600,
              padding: 32,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#0a0e1a' // Darker background for contrast
            }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 24 }}>Edit application</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="input-label">Full Name</label>
                  <input
                    className="textarea"
                    value={editData.name}
                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                    style={{ width: '100%', minHeight: 40 }}
                  />
                </div>
                <div>
                  <label className="input-label">Email</label>
                  <input
                    className="textarea"
                    value={editData.email}
                    onChange={e => setEditData({ ...editData, email: e.target.value })}
                    style={{ width: '100%', minHeight: 40 }}
                  />
                </div>
                <div>
                  <label className="input-label">Location</label>
                  <input
                    className="textarea"
                    value={editData.location}
                    onChange={e => setEditData({ ...editData, location: e.target.value })}
                    style={{ width: '100%', minHeight: 40 }}
                  />
                </div>
                <div>
                  <label className="input-label">Visa Status</label>
                  <input
                    className="textarea"
                    value={editData.visaStatus}
                    onChange={e => setEditData({ ...editData, visaStatus: e.target.value })}
                    style={{ width: '100%', minHeight: 40 }}
                  />
                </div>
                <div>
                  <label className="input-label">Skills (comma separated)</label>
                  <input
                    className="textarea"
                    value={Array.isArray(editData.skills) ? editData.skills.join(", ") : editData.skills}
                    onChange={(e) => setEditData({ ...editData, skills: e.target.value.split(",") })}
                    style={{ width: '100%', minHeight: 40 }}
                  />
                </div>
                <div>
                  <label className="input-label">Experience</label>
                  <textarea
                    className="textarea"
                    rows={4}
                    value={editData.experience}
                    onChange={e => setEditData({ ...editData, experience: e.target.value })}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label className="input-label">Job History</label>
                  <textarea
                    className="textarea"
                    rows={4}
                    value={editData.jobHistory}
                    onChange={e => setEditData({ ...editData, jobHistory: e.target.value })}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
                <button onClick={() => setEditOpen(false)} className="btn text">Cancel</button>
                <button onClick={handleSave} className="btn primary">Save Changes</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
