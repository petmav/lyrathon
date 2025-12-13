import { z } from 'zod';

const nonEmptyString = z.string().trim().min(1);

const optionalNonEmptyString = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  },
  nonEmptyString.optional(),
);

const optionalDateString = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  },
  z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), 'Invalid date value')
    .optional(),
);

const limitSchema = z.number().int().positive().max(100).optional();

export const previousPositionSchema = z
  .object({
    title: optionalNonEmptyString,
    org: optionalNonEmptyString,
    start_date: optionalNonEmptyString,
    end_date: optionalNonEmptyString,
  })
  .strict();

export const educationEntrySchema = z
  .object({
    degree: optionalNonEmptyString,
    school: optionalNonEmptyString,
    graduation_year: z.number().int().min(1900).max(2100).optional(),
  })
  .strict();

export const candidateInputSchema = z
  .object({
    name: nonEmptyString,
    email: z.string().email(),
    age: z.number().int().min(16),
    password_hash: z.string().min(8),
    current_position: optionalNonEmptyString,
    location: optionalNonEmptyString,
    visa_status: optionalNonEmptyString,
    experience_years: z.number().min(0).optional(),
    salary_expectation: z.number().min(0).optional(),
    availability_date: optionalDateString,
    skills_text: optionalNonEmptyString,
    awards_text: optionalNonEmptyString,
    certifications_text: optionalNonEmptyString,
    projects_text: optionalNonEmptyString,
    previous_positions: z.array(previousPositionSchema).optional(),
    education: z.array(educationEntrySchema).optional(),
  })
  .strict();

const nullableText = z.string().min(1).nullable().optional();

const previousPositionsResponseSchema = z.preprocess(
  (value) => (Array.isArray(value) ? value : []),
  z.array(previousPositionSchema),
);

const educationResponseSchema = z.preprocess(
  (value) => (Array.isArray(value) ? value : []),
  z.array(educationEntrySchema),
);

export const publicCandidateSchema = z.object({
  candidate_id: z.string().uuid(),
  name: nonEmptyString,
  age: z.number().int().min(16),
  email: z.string().email(),
  current_position: z.string().nullable(),
  location: z.string().nullable(),
  visa_status: z.string().nullable(),
  experience_years: z.number().nullable(),
  salary_expectation: z.number().nullable(),
  availability_date: z.string().nullable(),
  skills_text: z.string().nullable(),
  awards_text: z.string().nullable(),
  certifications_text: z.string().nullable(),
  projects_text: z.string().nullable(),
  previous_positions: previousPositionsResponseSchema,
  education: educationResponseSchema,
  profile_created_at: z.string().optional(),
  profile_updated_at: z.string(),
});

export const candidateRegistrationResponseSchema = z.object({
  data: publicCandidateSchema,
  embeddingUpdated: z.boolean(),
});

export const candidateFiltersSchema = z
  .object({
    searchTerm: nonEmptyString,
    location: optionalNonEmptyString,
    visaRequired: z.boolean().optional(),
    visaStatus: optionalNonEmptyString,
    minExperience: z.number().min(0).optional(),
    maxSalary: z.number().min(0).optional(),
    availabilityBefore: optionalDateString,
    limit: limitSchema,
  })
  .strict();

export const candidateSearchResultSchema = z.object({
  candidate_id: z.string().uuid(),
  name: nonEmptyString,
  age: z.number().nullable(),
  email: z.string().email(),
  current_position: z.string().nullable(),
  location: z.string().nullable(),
  visa_status: z.string().nullable(),
  experience_years: z.number().nullable(),
  salary_expectation: z.number().nullable(),
  availability_date: z.string().nullable(),
  skills_text: z.string().nullable(),
  projects_text: z.string().nullable(),
  profile_updated_at: z.string(),
  preference_score: z.number().optional(),
});

export const candidateSearchResponseSchema = z.object({
  data: z.array(candidateSearchResultSchema),
});

export const recruiterQueryRequestSchema = z
  .object({
    query: nonEmptyString,
    limit: limitSchema,
  })
  .strict();

export const recruiterQueryResponseSchema = z.object({
  filters: candidateFiltersSchema,
  data: z.array(candidateSearchResultSchema),
});

export const shortlistResultSchema = z.object({
  shortlist: z
    .array(
      z.object({
        candidate_id: z.string(),
        name: nonEmptyString,
        age: z.number().nullable(),
        email: z.string().email(),
        location: optionalNonEmptyString.nullable(),
        visa_status: optionalNonEmptyString.nullable(),
        experience_years: z.number().nullable(),
        salary_expectation: z.number().nullable(),
        match_summary: nonEmptyString,
        recommended_action: nonEmptyString,
        confidence: z.number().min(0).max(1),
      }),
    )
    .min(0)
    .max(5),
  overall_summary: nonEmptyString,
});

export const shortlistResponseSchema = z.object({
  filters: candidateFiltersSchema,
  shortlist: shortlistResultSchema.shape.shortlist,
  overall_summary: shortlistResultSchema.shape.overall_summary,
});

export type CandidateInputPayload = z.infer<typeof candidateInputSchema>;
export type PublicCandidatePayload = z.infer<typeof publicCandidateSchema>;
export type CandidateFiltersPayload = z.infer<typeof candidateFiltersSchema>;
export type CandidateSearchResultPayload = z.infer<typeof candidateSearchResultSchema>;
export type RecruiterQueryPayload = z.infer<typeof recruiterQueryRequestSchema>;
export type ShortlistCorePayload = z.infer<typeof shortlistResultSchema>;
