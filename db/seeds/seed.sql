-- Sample companies
INSERT INTO company (company_id, name, location, industry, website)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Aurora Labs', 'Toronto, CA', 'FinTech', 'https://auroralabs.example.com'),
  ('22222222-2222-2222-2222-222222222222', 'Nimbus Health', 'London, UK', 'HealthTech', 'https://nimbushealth.example.com')
ON CONFLICT (company_id) DO NOTHING;

-- Sample recruiters
INSERT INTO recruiter (recruiter_id, company_id, name, email, password_hash, organisation, role_title, notes)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Rue Patel', 'rue@auroralabs.example.com', '$2a$10$exampleRecruiterRue', 'Aurora Labs', 'Lead Talent Partner', 'Focus on payments org hiring.'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Marcus Lee', 'marcus@nimbushealth.example.com', '$2a$10$exampleRecruiterMarcus', 'Nimbus Health', 'Senior Recruiter', 'Owns data + ML roles.')
ON CONFLICT (recruiter_id) DO NOTHING;

-- Sample candidates
INSERT INTO candidate (
  candidate_id,
  name,
  age,
  email,
  password_hash,
  current_position,
  location,
  visa_status,
  experience_years,
  salary_expectation,
  availability_date,
  skills_text,
  awards_text,
  certifications_text,
  projects_text,
  previous_positions,
  education
) VALUES
(
  '33333333-3333-3333-3333-333333333333',
  'Tanya Rhodes',
  29,
  'tanya.rhodes@example.com',
  '$2a$10$exampleCandidateTanya',
  'Senior Frontend Engineer',
  'Remote - Canada',
  'Canadian PR, TN eligible',
  7.5,
  160000,
  CURRENT_DATE + INTERVAL '30 days',
  'React, TypeScript, GraphQL, Tailwind, Accessibility, Design Systems',
  'Winner - React Conf 2023 UI Challenge',
  'AWS Certified Developer',
  'Built Aurora Design System; Implemented realtime collaboration tools',
  '[{"title":"Frontend Engineer","org":"Vector Labs","start_date":"2019-01-01","end_date":"2022-05-01"}]',
  '[{"degree":"BSc Computer Science","school":"University of Waterloo","graduation_year":2017}]'
),
(
  '44444444-4444-4444-4444-444444444444',
  'Diego Alvarez',
  34,
  'diego.alvarez@example.com',
  '$2a$10$exampleCandidateDiego',
  'Staff Data Scientist',
  'Mexico City, MX',
  'Open to Canadian LMIA / US H1B transfer',
  11.0,
  195000,
  CURRENT_DATE + INTERVAL '60 days',
  'Python, PyTorch, LLMOps, Feature Stores, Airflow, Snowflake',
  NULL,
  'Databricks Certified Data Engineer',
  'Lead propensity scoring platform; Built multilingual retrieval system',
  '[{"title":"Data Scientist","org":"Innova","start_date":"2016-03-01","end_date":"2020-08-01"}]',
  '[{"degree":"MSc Applied Math","school":"UNAM","graduation_year":2015}]'
),
(
  '55555555-5555-5555-5555-555555555555',
  'Mira Shah',
  26,
  'mira.shah@example.com',
  '$2a$10$exampleCandidateMira',
  'Product Designer',
  'London, UK',
  'UK Skilled Worker Visa',
  4.5,
  110000,
  CURRENT_DATE + INTERVAL '15 days',
  'UX Research, Prototyping, Figma, HTML/CSS, Accessibility, Design Tokens',
  'Top 10 finalist - Behance Portfolio 2022',
  NULL,
  'Led redesign of telehealth intake; Created modular design token system',
  '[{"title":"UX Designer","org":"Wellnest","start_date":"2021-02-01","end_date":"2023-11-01"}]',
  '[{"degree":"BA Interaction Design","school":"Goldsmiths","graduation_year":2020}]'
)
ON CONFLICT (candidate_id) DO NOTHING;

-- Candidate documents
INSERT INTO candidate_documents (document_id, candidate_id, type, file_url, checksum, is_primary)
VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'resume', 'https://files.example.com/tanya-resume.pdf', 'sha256:tanya', TRUE),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 'resume', 'https://files.example.com/diego-resume.pdf', 'sha256:diego', TRUE),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '55555555-5555-5555-5555-555555555555', 'portfolio', 'https://files.example.com/mira-portfolio.pdf', 'sha256:mira', TRUE)
ON CONFLICT (document_id) DO NOTHING;

-- Candidate status entries
INSERT INTO candidate_status (
  candidate_status_id,
  candidate_id,
  recruiter_id,
  company_id,
  status,
  stage,
  notes,
  last_contacted_at
) VALUES
(
  '99999999-9999-9999-9999-999999999991',
  '33333333-3333-3333-3333-333333333333',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'prospect',
  'screen',
  'Strong front-end craft, confirm availability for US relocation.',
  NOW() - INTERVAL '2 days'
),
(
  '99999999-9999-9999-9999-999999999992',
  '44444444-4444-4444-4444-444444444444',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '22222222-2222-2222-2222-222222222222',
  'engaged',
  'portfolio',
  'Interested in ML lead role; waiting on salary expectations.',
  NOW() - INTERVAL '1 days'
),
(
  '99999999-9999-9999-9999-999999999993',
  '55555555-5555-5555-5555-555555555555',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '22222222-2222-2222-2222-222222222222',
  'pipeline',
  'sourcing',
  'Send case study request.',
  NULL
)
ON CONFLICT (candidate_status_id) DO NOTHING;
