import { auth } from "./firebase";

export interface Location {
  lat: number;
  lng: number;
  address?: string | null;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  author: string;
  author_uid: string;
  total_distance_km: number;
  total_spent: number;
  photo_url: string | null;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface PlanItem {
  id: string;
  plan_id: string;
  name: string;
  author: string;
  author_uid: string;
  planned_stop_time: string | null;
  stopped_time: string | null;
  order: number;
  location: Location;
  spent_money: number;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanDetail extends Plan {
  items: PlanItem[];
}

export type PlanInput = Pick<Plan, "name" | "description" | "photo_url">;
export type PlanItemInput = Pick<
  PlanItem,
  "name" | "planned_stop_time" | "stopped_time" | "location" | "spent_money" | "photo_url"
>;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  const res = await fetch(path, { ...init, headers });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      msg = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail ?? body);
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new ApiError(res.status, msg);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

const json = (body: unknown) => JSON.stringify(body);

export const api = {
  listPlans: () => request<Plan[]>("/api/plans"),
  getPlan: (id: string) => request<PlanDetail>(`/api/plans/${id}`),
  createPlan: (body: PlanInput) => request<Plan>("/api/plans", { method: "POST", body: json(body) }),
  updatePlan: (id: string, body: Partial<PlanInput>) =>
    request<Plan>(`/api/plans/${id}`, { method: "PATCH", body: json(body) }),
  deletePlan: (id: string) => request<void>(`/api/plans/${id}`, { method: "DELETE" }),

  listAllItems: () => request<PlanItem[]>("/api/items"),
  createItem: (planId: string, body: PlanItemInput) =>
    request<PlanItem>(`/api/plans/${planId}/items`, { method: "POST", body: json(body) }),
  updateItem: (planId: string, itemId: string, body: Partial<PlanItemInput>) =>
    request<PlanItem>(`/api/plans/${planId}/items/${itemId}`, { method: "PATCH", body: json(body) }),
  deleteItem: (planId: string, itemId: string) =>
    request<void>(`/api/plans/${planId}/items/${itemId}`, { method: "DELETE" }),
  reorderItems: (planId: string, itemIds: string[]) =>
    request<PlanItem[]>(`/api/plans/${planId}/items/order`, { method: "PUT", body: json({ item_ids: itemIds }) }),

  uploadPhoto: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<{ url: string }>("/api/uploads", { method: "POST", body: fd });
  },
};
