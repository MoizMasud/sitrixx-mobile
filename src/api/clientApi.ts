// src/api/clientApi.ts
import { useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export type ClientInfo = {
  id: string;
  business_name: string;
  website_url?: string | null;
  booking_link?: string | null;
  google_review_link?: string | null;
  twilio_number?: string | null;
  forwarding_phone?: string | null;
  custom_sms_template?: string | null;
  review_sms_template?: string | null;
  auto_review_enabled?: boolean | null;
};

export type CustomerContact = {
  id: string;
  client_id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  created_at?: string;
  last_review_request_at?: string | null;
  review_request_count?: number | null;
};

const BACKEND_URL = 'https://sitrixx-website-backend.vercel.app';

type ApiErrorBody = { ok?: boolean; error?: string; message?: string };

export const useClientApi = () => {
  const { session } = useAuth();

  const ensureToken = () => {
    if (!session) throw new Error('Not authenticated');
    return session.access_token as string;
  };

  const parseError = async (res: Response) => {
    const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
    return body?.error || body?.message || `Request failed (${res.status})`;
  };

  const cachedClientIdRef = useRef<string | null>(null);




  const listClients = async (): Promise<ClientInfo[]> => {
    const token = ensureToken();

    const res = await fetch(`${BACKEND_URL}/api/clients?mine=1`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });


    if (!res.ok) throw new Error(await parseError(res));

    const body = await res.json().catch(() => ({} as any));
    return (body.clients || []) as ClientInfo[];
  };


  const resolveClientId = async (): Promise<string> => {
    if (cachedClientIdRef.current) return cachedClientIdRef.current;
    const clients = await listClients();
    if (!clients.length) throw new Error('No client found...');
    cachedClientIdRef.current = clients[0].id;
    return cachedClientIdRef.current;
  };
  // -------------------------
  // Leads
  // -------------------------
  const getLeads = async (clientId?: string) => {
    const token = ensureToken();
    const id = clientId ?? (await resolveClientId());

    const res = await fetch(
      `${BACKEND_URL}/api/leads?clientId=${encodeURIComponent(id)}`,
      { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) throw new Error(await parseError(res));

    const body = await res.json().catch(() => ({} as any));
    return body.leads || [];
  };

  // -------------------------
  // Reviews
  // -------------------------
  const getReviews = async (clientId?: string) => {
    const token = ensureToken();
    const id = clientId ?? (await resolveClientId());

    const res = await fetch(
      `${BACKEND_URL}/api/reviews?clientId=${encodeURIComponent(id)}`,
      { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) throw new Error(await parseError(res));

    const body = await res.json().catch(() => ({} as any));
    return body.reviews || [];
  };

  // -------------------------
  // Client Info
  // -------------------------
  const getClientInfo = async (clientId?: string): Promise<ClientInfo | null> => {
    const id = clientId ?? (await resolveClientId());
    const clients = await listClients();
    return clients.find((c) => c.id === id) || null;
  };

  const updateClientInfo = async (
    updates: Partial<ClientInfo> & { id?: string },
  ): Promise<ClientInfo> => {
    const token = ensureToken();
    const id = updates.id ?? (await resolveClientId());

    const res = await fetch(`${BACKEND_URL}/api/clients`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id,
        booking_link: updates.booking_link,
        google_review_link: updates.google_review_link,
        twilio_number: updates.twilio_number,
        forwarding_phone: updates.forwarding_phone,
        custom_sms_template: updates.custom_sms_template,
        review_sms_template: updates.review_sms_template,
        auto_review_enabled:
          typeof updates.auto_review_enabled === 'boolean'
            ? updates.auto_review_enabled
            : undefined,
            }),
    });

    if (!res.ok) throw new Error(await parseError(res));

    const body = await res.json().catch(() => ({} as any));
    return body.client as ClientInfo;
  };

  const updateClientAutoReview = async ({
    clientId,
    autoReviewEnabled,
  }: {
    clientId?: string;
    autoReviewEnabled: boolean;
  }) => {
    const token = ensureToken();
    const id = clientId ?? (await resolveClientId());

    const res = await fetch(`${BACKEND_URL}/api/clients`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        auto_review_enabled: autoReviewEnabled,
      }),
    });

    if (!res.ok) throw new Error(await parseError(res));

    const body = await res.json().catch(() => ({} as any));
    return body.client;
  };

  // -------------------------
  // Customers / Contacts
  // -------------------------
  const getCustomers = async (clientId?: string): Promise<CustomerContact[]> => {
    const token = ensureToken();
    const id = clientId ?? (await resolveClientId());

    const res = await fetch(
      `${BACKEND_URL}/api/customers?clientId=${encodeURIComponent(id)}`,
      { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) throw new Error(await parseError(res));

    const body = await res.json().catch(() => ({} as any));
    return (body.customers || []) as CustomerContact[];
  };

  const createCustomer = async (input: {
    clientId?: string;
    name?: string;
    phone: string;
    email?: string;
  }): Promise<CustomerContact> => {
    const token = ensureToken();
    const id = input.clientId ?? (await resolveClientId());

    const res = await fetch(`${BACKEND_URL}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        clientId: id,
        name: input.name,
        phone: input.phone,
        email: input.email,
      }),
    });

    if (!res.ok) throw new Error(await parseError(res));

    const body = await res.json().catch(() => ({} as any));
    return body.customer as CustomerContact;
  };

  const updateCustomer = async (input: {
    id: string;
    name?: string;
    phone?: string;
    email?: string;
  }): Promise<CustomerContact> => {
    const token = ensureToken();

    const res = await fetch(`${BACKEND_URL}/api/customers`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: input.id,
        name: input.name,
        phone: input.phone,
        email: input.email,
      }),
    });

    if (!res.ok) throw new Error(await parseError(res));

    const body = await res.json().catch(() => ({} as any));
    return body.customer as CustomerContact;
  };

  const deleteCustomer = async (input: { id: string }): Promise<void> => {
    const token = ensureToken();

    const res = await fetch(`${BACKEND_URL}/api/customers`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: input.id }),
    });

    if (!res.ok) throw new Error(await parseError(res));
  };

  // -------------------------
  // Review Request (manual)
  // -------------------------
  const sendReviewRequest = async ({
    clientId,
    customerName,
    customerPhone,
  }: {
    clientId?: string;
    customerName: string;
    customerPhone: string;
  }) => {
    const token = ensureToken();
    const id = clientId ?? (await resolveClientId());

    const res = await fetch(`${BACKEND_URL}/api/review-request`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: id,
        name: customerName,
        phone: customerPhone,
      }),
    });

    if (!res.ok) throw new Error(await parseError(res));

    return await res.json().catch(() => ({}));
  };

  return {
    // client
    listClients,
    getClientInfo,
    updateClientInfo,
    updateClientAutoReview,

    // data
    getLeads,
    getReviews,
    getCustomers,

    // customers
    createCustomer,
    updateCustomer,
    deleteCustomer,

    // actions
    sendReviewRequest,
  };
};
