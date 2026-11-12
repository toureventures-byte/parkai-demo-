/**
 * Client API TypeScript pour la connexion au backend Django Ninja de ParkGrid.
 * Gere l'isolation multi-tenant fail-closed et l'authentification B2B SaaS 2026.
 */

export const DEMO_ORG_ID = "a0000000-0000-0000-0000-000000000001";
const API_BASE =
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api/v1` : "/api/v1");

const ACCESS_TOKEN_KEY = "parkgrid_access_token";
const REFRESH_TOKEN_KEY = "parkgrid_refresh_token";
const ACTIVE_ORG_KEY = "parkgrid_active_org_id";
const USER_KEY = "parkgrid_auth_user";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
}

export interface AuthOrganization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user?: AuthUser;
  organization?: AuthOrganization;
}

export interface AuthMessageResponse {
  message: string;
  code?: string | null;
  reset_token?: string | null;
}

export interface UserMembership {
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  role: string;
}

export interface UserMeResponse {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  active_organization?: {
    id: string;
    name: string;
    slug: string;
    role: string;
  } | null;
  memberships: UserMembership[];
}

export interface BackendFacility {
  id: string;
  name: string;
  code: string;
  facility_type: "VALET" | "SELF_PARK" | "MIXED";
  address: string;
  city: string;
  state: string;
  capacity: number;
  timezone: string;
  is_active: boolean;
}

export interface BackendKpis {
  facility_code: string;
  facility_name: string;
  total_revenue: number;
  total_transactions: number;
  average_ticket: number;
  total_comps: number;
  total_voids: number;
  active_monthly_parkers: number;
  total_overdue_45d: number;
  estimated_leakage_at_stake: number;
  open_findings_count: number;
}

export interface BackendAuditFinding {
  id: string;
  rule_code: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  detail: string;
  estimated_amount: number;
  is_resolved: boolean;
  metadata: Record<string, unknown>;
}

export interface BackendUploadResponse {
  job_id: string;
  status: string;
  filename: string;
  message: string;
}

export interface BackendChatResponse {
  answer: string;
  facility_code: string;
}

export interface SummaryResponse {
  summary: string;
  facility_code: string;
}

export function getStoredAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredOrgId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_ORG_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeAuthSession(tokens: AuthTokenResponse): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    if (tokens.organization?.id) {
      localStorage.setItem(ACTIVE_ORG_KEY, tokens.organization.id);
    }
    if (tokens.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(tokens.user));
    }
    sessionStorage.setItem("parkgrid-demo-authenticated", "true");
  } catch {
    // Local storage unavailable
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ACTIVE_ORG_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem("parkgrid-demo-authenticated");
  } catch {
    // Ignore
  }
}

function getHeaders(orgId?: string, extraHeaders: HeadersInit = {}): HeadersInit {
  const token = getStoredAccessToken();
  const effectiveOrgId = orgId || getStoredOrgId() || DEMO_ORG_ID;
  const headers: Record<string, string> = {
    "X-Organization-ID": effectiveOrgId,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return {
    ...headers,
    ...extraHeaders,
  };
}

let refreshInFlight: Promise<AuthTokenResponse> | null = null;

async function refreshSessionOnce(): Promise<AuthTokenResponse> {
  if (!refreshInFlight) {
    refreshInFlight = refreshToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function authFetch(
  path: string,
  init: Omit<RequestInit, "headers"> = {},
  orgId?: string,
  extraHeaders: HeadersInit = {},
): Promise<Response> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: getHeaders(orgId, extraHeaders),
  });
  if (res.status !== 401 || !getStoredRefreshToken()) {
    return res;
  }
  try {
    await refreshSessionOnce();
  } catch {
    return res;
  }
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: getHeaders(orgId, extraHeaders),
  });
}

export async function login(email: string, password: string): Promise<AuthTokenResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Login failed (${res.status})`);
  }
  const data: AuthTokenResponse = await res.json();
  storeAuthSession(data);
  return data;
}

export async function register(input: {
  email: string;
  full_name: string;
  org_name: string;
  password: string;
}): Promise<AuthTokenResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email.trim(),
      full_name: input.full_name.trim(),
      org_name: input.org_name.trim(),
      password: input.password,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Registration failed (${res.status})`);
  }
  const data: AuthTokenResponse = await res.json();
  storeAuthSession(data);
  return data;
}

export async function googleAuth(credential: string): Promise<AuthTokenResponse> {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Google authentication failed (${res.status})`);
  }
  const data: AuthTokenResponse = await res.json();
  storeAuthSession(data);
  return data;
}

export async function magicLinkSend(email: string): Promise<AuthMessageResponse> {
  const res = await fetch(`${API_BASE}/auth/magic-link/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to send magic link (${res.status})`);
  }
  return await res.json();
}

export async function magicLinkVerify(email: string, code: string): Promise<AuthTokenResponse> {
  const res = await fetch(`${API_BASE}/auth/magic-link/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), code: code.trim() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Verification code failed (${res.status})`);
  }
  const data: AuthTokenResponse = await res.json();
  storeAuthSession(data);
  return data;
}

export async function forgotPassword(email: string): Promise<AuthMessageResponse> {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed (${res.status})`);
  }
  return await res.json();
}

export async function resetPassword(token: string, new_password: string): Promise<AuthMessageResponse> {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: token.trim(), new_password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Reset failed (${res.status})`);
  }
  return await res.json();
}

export async function getMe(): Promise<UserMeResponse> {
  const res = await authFetch("/auth/me");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch profile (${res.status})`);
  }
  return await res.json();
}

export async function refreshToken(refreshTokenValue?: string): Promise<AuthTokenResponse> {
  const token = refreshTokenValue || getStoredRefreshToken();
  if (!token) throw new Error("No refresh token available");
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: token }),
  });
  if (!res.ok) {
    clearAuthSession();
    throw new Error("Session expired. Please log in again.");
  }
  const data: AuthTokenResponse = await res.json();
  storeAuthSession(data);
  return data;
}

export async function logoutBackend(): Promise<void> {
  const token = getStoredAccessToken();
  const refresh = getStoredRefreshToken();
  if (token || refresh) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: getHeaders(undefined, { "Content-Type": "application/json" }),
        body: JSON.stringify({ refresh_token: refresh }),
      });
    } catch {
      // Best-effort backend logout
    }
  }
  clearAuthSession();
}

export async function checkBackendHealth(): Promise<{ status: string; version: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchFacilities(orgId?: string): Promise<BackendFacility[]> {
  const res = await authFetch("/facilities", {}, orgId);
  if (!res.ok) throw new Error(`Failed to fetch facilities: ${res.statusText}`);
  return await res.json();
}

export async function uploadFileToBackend(
  facilityId: string,
  file: File,
  orgId?: string,
): Promise<BackendUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await authFetch(
    `/facilities/${facilityId}/upload`,
    { method: "POST", body: formData },
    orgId,
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Upload failed with status ${res.status}`);
  }
  return await res.json();
}

export async function fetchFacilityKpis(facilityId: string, orgId?: string): Promise<BackendKpis> {
  const res = await authFetch(`/facilities/${facilityId}/kpis`, {}, orgId);
  if (!res.ok) throw new Error(`Failed to fetch KPIs: ${res.statusText}`);
  return await res.json();
}

export async function fetchFacilityAudits(
  facilityId: string,
  orgId?: string,
): Promise<BackendAuditFinding[]> {
  const res = await authFetch(`/facilities/${facilityId}/audits`, {}, orgId);
  if (!res.ok) throw new Error(`Failed to fetch audits: ${res.statusText}`);
  return await res.json();
}

export async function resolveAuditFinding(findingId: string, orgId?: string): Promise<void> {
  const res = await authFetch(
    `/audits/${findingId}/resolve`,
    {
      method: "PATCH",
      body: JSON.stringify({ is_resolved: true }),
    },
    orgId,
    { "Content-Type": "application/json" },
  );
  if (!res.ok) throw new Error(`Failed to resolve finding: ${res.statusText}`);
}

export async function chatWithBackend(
  facilityId: string,
  question: string,
  history: Array<{ role: string; content: string }> = [],
  orgId?: string,
): Promise<BackendChatResponse> {
  const res = await authFetch(
    `/facilities/${facilityId}/chat`,
    {
      method: "POST",
      body: JSON.stringify({ question, history }),
    },
    orgId,
    { "Content-Type": "application/json" },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Chat request failed: ${res.status}`);
  }
  return await res.json();
}

export async function fetchFacilitySummary(
  facilityId: string,
  orgId?: string,
): Promise<SummaryResponse> {
  const res = await authFetch(
    `/facilities/${facilityId}/summary`,
    { method: "POST" },
    orgId,
    { "Content-Type": "application/json" },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Summary request failed: ${res.status}`);
  }
  return await res.json();
}
