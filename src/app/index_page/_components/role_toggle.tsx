"use client";

import React from "react";

export type Role = "applicant" | "recruiter";

export function RoleToggle({
  role,
  setRole,
}: {
  role: Role;
  setRole: (r: Role) => void;
}) {
  const isApplicant = role === "applicant";

  return (
    <div role="group" aria-label="View mode">
      <button
        type="button"
        aria-pressed={isApplicant}
        onClick={() => setRole("applicant")}
      >
        Applicant
      </button>

      <button
        type="button"
        aria-pressed={!isApplicant}
        onClick={() => setRole("recruiter")}
      >
        Recruiter
      </button>
    </div>
  );
}
