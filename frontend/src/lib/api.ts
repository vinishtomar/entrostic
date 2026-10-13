// Typed client for the FastAPI backend. Shapes mirror backend/app/schemas/*.py.

// Same-origin by default: /api/* is forwarded to the backend by next.config.ts rewrites.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export type AnalysisStatus = "pending" | "processed" | "failed";
export type Stage = "new" | "screening" | "interview" | "offer" | "hired" | "rejected";
export type WorkplaceType = "onsite" | "hybrid" | "remote";
export type EmploymentType = "full_time" | "part_time" | "contract" | "internship";
export type CompanyStatus = "pending" | "approved" | "rejected";

export interface Company {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  status: CompanyStatus;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "recruiter";
  company: Company | null;
}

export interface AdminCompany extends Company {
  contact_name: string | null;
  contact_email: string | null;
  reviewed_at: string | null;
}

export type StageCounts = Record<Stage, number>;

export interface Job {
  id: string;
  title: string;
  slug: string;
  location: string | null;
  workplace_type: WorkplaceType;
  employment_type: EmploymentType;
  description: string;
  must_have_skills: string[];
  nice_to_have_skills: string[];
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
  applicant_count: number;
  stage_counts: StageCounts;
}

export type JobInput = Pick<
  Job,
  "title" | "location" | "workplace_type" | "employment_type" | "description" | "must_have_skills" | "nice_to_have_skills"
>;

export interface JobRef {
  id: string;
  title: string;
  slug: string;
}

export interface ApplicationSummary {
  id: string;
  full_name: string;
  email: string;
  analysis_status: AnalysisStatus;
  stage: Stage;
  created_at: string;
  job: JobRef;
  headline: string | null;
  seniority: string | null;
  total_years_experience: number | null;
  location: string | null;
  skills: string[];
}

export interface WorkExperience {
  title: string;
  company: string;
  start: string | null;
  end: string | null;
  highlights: string[];
}

export interface Education {
  institution: string;
  degree: string | null;
  field_of_study: string | null;
  graduation_year: number | null;
}

export interface CandidateProfile {
  headline: string;
  summary: string;
  location: string | null;
  total_years_experience: number | null;
  seniority: string;
  skills: string[];
  soft_skills: string[];
  languages: string[];
  certifications: string[];
  experience: WorkExperience[];
  education: Education[];
  ai_model: string;
  analyzed_at: string;
}

export interface ApplicationDetail {
  id: string;
  full_name: string;
  email: string;
  linkedin_url: string | null;
  analysis_status: AnalysisStatus;
  analysis_detail: string | null;
  stage: Stage;
  created_at: string;
  job: JobRef;
  cv: { original_filename: string; mime_type: string; size_bytes: number; uploaded_at: string } | null;
  profile: CandidateProfile | null;
}

export interface DashboardSummary {
  open_jobs: number;
  total_jobs: number;
  total_applications: number;
  new_this_week: number;
  stage_counts: StageCounts;
  daily_applications: { date: string; count: number }[];
  recent_applications: ApplicationSummary[];
}

export interface PublicJob {
  slug: string;
  title: string;
  company_name: string;
  company_slug: string;
  company_website: string | null;
  location: string | null;
  workplace_type: WorkplaceType;
  employment_type: EmploymentType;
  description: string;
  must_have_skills: string[];
  nice_to_have_skills: string[];
  is_open: boolean;
  posted_at: string;
}

export interface PublicCompany {
  name: string;
  slug: string;
  website: string | null;
  jobs: Pick<PublicJob, "slug" | "title" | "location" | "workplace_type" | "employment_type" | "posted_at">[];
}

export interface Health {
  status: "ok" | "degraded";
  database: boolean;
  ai_configured: boolean;
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { cache: "no-store", credentials: "include", ...init });
  } catch {
    throw new ApiError("We couldn't reach the server. Please check your connection and try again.", 0);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(formatDetail(body?.detail) ?? `Something went wrong (${res.status}).`, res.status);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: body === undefined ? undefined : JSON.stringify(body),
});

// FastAPI returns `detail` as a string for our errors, or a list for validation errors.
function formatDetail(detail: unknown): string | null {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = Array.isArray(d?.loc) ? String(d.loc[d.loc.length - 1]).replaceAll("_", " ") : "";
        const msg = String(d?.msg ?? "").replace(/^Value error, /, "");
        return field && field !== "body" ? `${field[0].toUpperCase()}${field.slice(1)}: ${msg}` : msg;
      })
      .join(" · ");
  }
  return null;
}

export const api = {
  health: () => request<Health>("/api/health"),

  // auth
  signup: (b: { company_name: string; website?: string; full_name: string; email: string; password: string }) =>
    request<{ message: string }>("/api/auth/signup", json("POST", { ...b, website: b.website || null })),
  login: (email: string, password: string) => request<User>("/api/auth/login", json("POST", { email, password })),
  logout: () => request<void>("/api/auth/logout", json("POST")),
  me: () => request<User>("/api/auth/me"),

  // admin
  adminCompanies: () => request<AdminCompany[]>("/api/admin/companies"),
  approveCompany: (id: string) => request<AdminCompany>(`/api/admin/companies/${id}/approve`, json("POST")),
  rejectCompany: (id: string) => request<AdminCompany>(`/api/admin/companies/${id}/reject`, json("POST")),

  // recruiter
  dashboard: () => request<DashboardSummary>("/api/dashboard/summary"),
  jobs: () => request<Job[]>("/api/jobs"),
  job: (id: string) => request<Job>(`/api/jobs/${id}`),
  createJob: (b: JobInput) => request<Job>("/api/jobs", json("POST", b)),
  updateJob: (id: string, b: Partial<JobInput & { status: "open" | "closed" }>) =>
    request<Job>(`/api/jobs/${id}`, json("PATCH", b)),
  jobApplications: (id: string) => request<ApplicationSummary[]>(`/api/jobs/${id}/applications`),
  applications: () => request<ApplicationSummary[]>("/api/applications"),
  application: (id: string) => request<ApplicationDetail>(`/api/applications/${id}`),
  setStage: (id: string, stage: Stage) => request<ApplicationDetail>(`/api/applications/${id}`, json("PATCH", { stage })),
  reanalyze: (id: string) => request<ApplicationDetail>(`/api/applications/${id}/analyze`, json("POST")),
  deleteApplication: (id: string) => request<void>(`/api/applications/${id}`, json("DELETE")),
  cvUrl: (id: string) => `${API_URL}/api/applications/${id}/cv`,

  // public (candidates)
  publicJob: (slug: string) => request<PublicJob>(`/api/public/jobs/${slug}`),
  publicCompany: (slug: string) => request<PublicCompany>(`/api/public/companies/${slug}`),
  apply: (slug: string, f: { full_name: string; email: string; linkedin_url?: string; file: File }) => {
    const form = new FormData();
    form.append("full_name", f.full_name);
    form.append("email", f.email);
    if (f.linkedin_url) form.append("linkedin_url", f.linkedin_url);
    form.append("file", f.file);
    return request<{ message: string; job_title: string; company_name: string }>(`/api/public/jobs/${slug}/apply`, {
      method: "POST",
      body: form,
    });
  },
};
