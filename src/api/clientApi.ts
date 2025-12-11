// src/api/clientApi.ts
import { useAuth } from '../context/AuthContext';

export type ClientInfo = {
  id: string;
  business_name: string;
  owner_email: string;
  website_url?: string | null;
  booking_link?: string | null;
  google_review_link?: string | null;
  twilio_number?: string | null;
  forwarding_phone?: string | null;
  custom_sms_template?: string | null;   // missed call
  review_sms_template?: string | null;   // NEW
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
const DEFAULT_CLIENT_ID = 'moiz-test'; // your test biz

export const useClientApi = () => {
  const { session } = useAuth();

  const ensureToken = () => {
    if (!session) throw new Error('Not authenticated');
    return session.access_token as string;
  };

  const getLeads = async (clientId: string = DEFAULT_CLIENT_ID) => {
    const token = ensureToken();

    const res = await fetch(
      `${BACKEND_URL}/api/leads?clientId=${encodeURIComponent(clientId)}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(body.error || `Failed to load leads (${res.status})`);
    }

    return body.leads || [];
  };

  const getReviews = async (clientId: string = DEFAULT_CLIENT_ID) => {
    const token = ensureToken();

    const res = await fetch(
      `${BACKEND_URL}/api/reviews?clientId=${encodeURIComponent(clientId)}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(body.error || `Failed to load reviews (${res.status})`);
    }

    return body.reviews || [];
  };

  const getClientInfo = async (
    clientId: string = DEFAULT_CLIENT_ID
  ): Promise<ClientInfo | null> => {
    const token = ensureToken();

    const res = await fetch(`${BACKEND_URL}/api/clients`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    const body = await res.json().catch(() => ({} as any));

    if (!res.ok) {
      throw new Error(body.error || 'Failed to fetch clients');
    }

    const clients: ClientInfo[] = body.clients || [];
    return clients.find((c) => c.id === clientId) || null;
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

    const body = await res.json().catch(() => ({} as any));

    if (!res.ok) {
      throw new Error(body.error || 'Failed to update customer');
    }

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

    const body = await res.json().catch(() => ({} as any));

    if (!res.ok) {
      throw new Error(body.error || 'Failed to delete customer');
    }
  };



  const updateClientInfo = async (
    updates: Partial<ClientInfo> & { id?: string }
  ): Promise<ClientInfo> => {
    const token = ensureToken();
    const id = updates.id ?? DEFAULT_CLIENT_ID;

    const res = await fetch(`${BACKEND_URL}/api/clients`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id,
        google_review_link: updates.google_review_link,
        twilio_number: updates.twilio_number,
        forwarding_phone: updates.forwarding_phone,
        custom_sms_template: updates.custom_sms_template,
        review_sms_template: updates.review_sms_template,  // NEW
        auto_review_enabled:
          typeof updates.auto_review_enabled === 'boolean'
            ? updates.auto_review_enabled
            : undefined,
      }),
    });

    const body = await res.json().catch(() => ({} as any));

    if (!res.ok) {
      throw new Error(body.error || 'Failed to update client');
    }

    return body.client as ClientInfo;
  };


  const getCustomers = async (
    clientId: string = DEFAULT_CLIENT_ID
  ): Promise<CustomerContact[]> => {
    const token = ensureToken();

    const res = await fetch(
      `${BACKEND_URL}/api/customers?clientId=${encodeURIComponent(clientId)}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const body = await res.json().catch(() => ({} as any));

    if (!res.ok) {
      throw new Error(body.error || 'Failed to fetch customers');
    }

    return (body.customers || []) as CustomerContact[];
  };


  const createCustomer = async (input: {
    clientId?: string;
    name?: string;
    phone: string;
    email?: string;
  }): Promise<CustomerContact> => {
    const token = ensureToken();
    const clientId = input.clientId ?? DEFAULT_CLIENT_ID;

    const res = await fetch(`${BACKEND_URL}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        clientId,
        name: input.name,
        phone: input.phone,
        email: input.email,
      }),
    });

    const body = await res.json().catch(() => ({} as any));

    if (!res.ok) {
      throw new Error(body.error || 'Failed to create customer');
    }

    return body.customer as CustomerContact;
  };


  // 🔹 Toggle auto review mode on/off for the business
  const updateClientAutoReview = async ({
    clientId = DEFAULT_CLIENT_ID,
    autoReviewEnabled,
  }: {
    clientId?: string;
    autoReviewEnabled: boolean;
  }) => {
    const token = ensureToken();

    const res = await fetch(`${BACKEND_URL}/api/clients`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: clientId,
        auto_review_enabled: autoReviewEnabled,
      }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        body.error || `Failed to update client settings (${res.status})`,
      );
    }

    return body.client;
  };

  // 🔹 Manually send a review request SMS to a saved contact
  const sendReviewRequest = async ({
    clientId = DEFAULT_CLIENT_ID,
    customerName,
    customerPhone,
  }: {
    clientId?: string;
    customerName: string;
    customerPhone: string;
  }) => {
    const token = ensureToken();

    const res = await fetch(`${BACKEND_URL}/api/review-request`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId,
        name: customerName,
        phone: customerPhone,
      }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        body.error || `Failed to send review request (${res.status})`,
      );
    }

    return body;
  };

  return {
    getLeads,
    getReviews,
    getClientInfo,
    getCustomers,
    createCustomer,
    updateClientAutoReview,
    sendReviewRequest,
    updateClientInfo,
    updateCustomer,
    deleteCustomer,
  };
};



