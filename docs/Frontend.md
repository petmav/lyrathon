# Frontend Documentation

The Linkdr frontend is a Next.js 14 application using the App Router.

## Design System
- **Theme**: "Glassmorphism" / Global CSS approach.
- **File**: `src/app/globals.css`.
- **Variables**: 
  - Colors: `--primary`, `--bg-dark`, `--glass-bg`, `--glass-border`.
  - Utilities: `.glass-card`, `.btn-primary`, `.btn-ghost`.
- **Components**: The app avoids heavy component libraries (MUI removed) in favor of standard HTML elements styled with these global classes to minimize bundle size.

## Page Structure

### Applicant Flow
- **`src/app/register/page.tsx`**: Initial sign-up.
- **`src/app/applicant/page.tsx`**: Main dashboard.
  - **Dashboard View**: Read-only summary of profile and verification status.
  - **Editor View**: Slide-over panel for editing profile sections (Employment, Education, etc.).
  - **State**: Uses `useState` to manage local form state before saving to the backend API.

### Recruiter Flow
- **`src/app/recruiter_query_page/page.tsx`**: Search interface.
  - **Chat Interface**: Natural language input for queries.
  - **Shortlist Evaluation**: Displays AI-ranked candidates with reasoning.

## State Management
- **Local State**: Most pages use local React state.
- **API State**: Fetched via `useEffect` on mount.
- **Transitions**: CSS transitions (`.sliding-stage`) used for smooth view switching (Dashboard <-> Editor).
