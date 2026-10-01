const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function getToken() {
  return sessionStorage.getItem("supportiq_token");
}

export function logout() {
  sessionStorage.removeItem("supportiq_token");
  sessionStorage.removeItem("supportiq_email");
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && path !== "/auth/login") {
      logout();
      window.dispatchEvent(new Event("supportiq:expired"));
    }
    const detail = Array.isArray(body.detail)
      ? body.detail
          .map((error) => `${error.loc.at(-1)}: ${error.msg}`)
          .join(". ")
      : body.detail;
    throw new Error(
      detail || `Request failed (${response.status}). Please try again.`,
    );
  }
  return body;
}

export async function loginAdmin(credentials) {
  const result = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  sessionStorage.setItem("supportiq_token", result.access_token);
  sessionStorage.setItem("supportiq_email", result.email);
  return result;
}

export const getCurrentAdmin = () => request("/auth/me");
export const submitComplaint = (data) =>
  request("/complaints", { method: "POST", body: JSON.stringify(data) });
export const getDashboardSummary = () => request("/dashboard/summary");
export const getTrends = () => request("/dashboard/trends");
export const getCategories = () => request("/analytics/categories");
export const getSentiment = () => request("/analytics/sentiment");
export const getClusters = () => request("/clusters");
export const getEvaluation = () => request("/ml/evaluation");
export const getComplaintById = (id) =>
  request(`/complaints/${encodeURIComponent(id)}`);
export const getComplaints = (filters) => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== undefined && value !== null)
      query.set(key, value);
  });
  return request(`/complaints?${query}`);
};
export const updateTicketStatus = (id, status) =>
  request(`/complaints/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
export const findSimilarComplaints = (text) =>
  request("/ml/similar", { method: "POST", body: JSON.stringify({ text }) });
