import { SupabaseClient } from "npm:@supabase/supabase-js@2";

export interface LogEntry {
  endpoint: string;
  step: string;
  api_url: string;
  request_headers?: Record<string, string>;
  request_body?: any;
  response_data?: any;
  http_status: number;
  error_message?: string;
  error_details?: any;
  duration_ms: number;
  clubready_request_id?: string;
  transaction_id?: string;
}

export async function logApiCall(
  supabase: SupabaseClient,
  entry: LogEntry
): Promise<void> {
  try {
    const sanitizedHeaders = entry.request_headers ? {
      ...entry.request_headers,
      Authorization: entry.request_headers.Authorization ? '***REDACTED***' : undefined,
    } : undefined;

    await supabase.from("payment_logs").insert({
      endpoint: entry.endpoint,
      step: entry.step,
      api_url: entry.api_url,
      request_headers: sanitizedHeaders,
      request_body: entry.request_body,
      request_data: entry.request_body,
      response_data: entry.response_data,
      http_status: entry.http_status,
      status_code: entry.http_status,
      error_message: entry.error_message,
      error_details: entry.error_details,
      duration_ms: entry.duration_ms,
      clubready_request_id: entry.clubready_request_id,
      transaction_id: entry.transaction_id,
    });
  } catch (error) {
    console.error("Failed to log API call:", error);
  }
}

export function sanitizeRequestBody(body: any): any {
  if (!body) return body;

  const sanitized = { ...body };

  const sensitiveFields = [
    'password',
    'apiKey',
    'api_key',
    'creditCard',
    'cardNumber',
    'cvv',
    'ssn',
  ];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }

  return sanitized;
}
