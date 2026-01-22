import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { logApiCall, sanitizeRequestBody } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const startTime = Date.now();
  let apiUrl = "";
  let requestBody: any = {};
  let httpStatus = 500;
  let transactionId: string | undefined;

  try {
    requestBody = await req.json();
    const {
      prospectId,
      clubreadyUserId,
      packageId,
      cardNumber,
      cardExpMonth,
      cardExpYear,
      cardCvv,
      cardholderName,
      billingZip,
    } = requestBody;

    if (!clubreadyUserId || !packageId || !cardNumber || !cardExpMonth || !cardExpYear || !cardCvv) {
      return new Response(
        JSON.stringify({ error: "Missing required payment information" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: config, error: configError } = await supabase
      .from("clubready_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (configError || !config) {
      const duration = Date.now() - startTime;
      await logApiCall(supabase, {
        endpoint: "/sales/member/*/payment/makepayment",
        step: "process_payment",
        api_url: "N/A",
        request_body: sanitizeRequestBody(requestBody),
        http_status: 500,
        error_message: "ClubReady configuration not found",
        error_details: configError,
        duration_ms: duration,
      });

      return new Response(
        JSON.stringify({ error: "ClubReady configuration not found" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const clubreadyApiKey = config.api_key;
    const clubreadyChainId = config.chain_id;
    const clubreadyStoreId = config.store_id;
    const clubreadyApiUrl = config.api_url;

    const { data: packageData, error: packageError } = await supabase
      .from("packages")
      .select("*")
      .eq("clubready_package_id", packageId)
      .single();

    if (packageError || !packageData) {
      throw new Error("Package not found");
    }

    const { data: prospectData, error: prospectError } = await supabase
      .from("prospects")
      .select("*")
      .eq("id", prospectId)
      .single();

    if (prospectError || !prospectData) {
      throw new Error("Prospect not found");
    }

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        prospect_id: prospectId,
        package_id: packageData.id,
        amount: packageData.price,
        status: "pending",
        payment_method: "credit_card",
      })
      .select()
      .single();

    if (txError) {
      throw txError;
    }

    transactionId = transaction.id;

    const formData = new URLSearchParams({
      ApiKey: clubreadyApiKey,
      StoreId: clubreadyStoreId,
      ChainId: clubreadyChainId,
      Amount: packageData.price.toString(),
    });

    formData.append("AcctToken", cardNumber);
    formData.append("Last4", cardNumber.slice(-4));
    formData.append("ExpMonth", cardExpMonth);
    formData.append("ExpYear", cardExpYear);
    formData.append("CVV", cardCvv);
    formData.append("PostalCode", billingZip || "");

    if (cardholderName) {
      formData.append("NameOnCard", cardholderName);
    }

    apiUrl = `${clubreadyApiUrl}/sales/member/${clubreadyUserId}/payment/makepayment`;

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: requestHeaders,
      body: formData.toString(),
    });

    httpStatus = response.status;
    const duration = Date.now() - startTime;
    const responseText = await response.text();

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    const sanitizedRequest = {
      storeId: clubreadyStoreId,
      chainId: clubreadyChainId,
      userId: clubreadyUserId,
      amount: packageData.price,
      cardNumber: `****${cardNumber.slice(-4)}`,
      expMonth: cardExpMonth,
      expYear: cardExpYear,
      cvv: "***",
      postalCode: billingZip || "",
    };

    await logApiCall(supabase, {
      endpoint: `/sales/member/${clubreadyUserId}/payment/makepayment`,
      step: "process_payment",
      api_url: apiUrl,
      request_headers: { "Content-Type": "application/x-www-form-urlencoded" },
      request_body: sanitizedRequest,
      response_data: responseData,
      http_status: httpStatus,
      error_message: !response.ok ? (responseData.Message || responseData.message || "Payment processing failed") : undefined,
      error_details: !response.ok ? responseData : undefined,
      duration_ms: duration,
      clubready_request_id: response.headers.get("X-Request-Id") || undefined,
      transaction_id: transactionId,
    });

    if (!response.ok) {
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          error_message: responseData.Message || responseData.message || "Payment processing failed",
        })
        .eq("id", transaction.id);

      throw new Error(responseData.Message || responseData.message || "Payment processing failed");
    }

    const paymentId = responseData.PaymentId || responseData.paymentId || responseData.Id;

    await supabase
      .from("transactions")
      .update({
        status: "completed",
        clubready_transaction_id: paymentId?.toString() || null,
        completed_at: new Date().toISOString(),
        last_four: cardNumber.slice(-4),
        metadata: {
          clubready_payment_id: paymentId,
          package_name: packageData.name,
        },
      })
      .eq("id", transaction.id);

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: transaction.id,
        clubreadyPaymentId: paymentId,
        amount: packageData.price,
        packageName: packageData.name,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await logApiCall(supabase, {
      endpoint: "/sales/member/*/payment/makepayment",
      step: "process_payment",
      api_url: apiUrl || "N/A",
      request_body: sanitizeRequestBody(requestBody),
      http_status: httpStatus,
      error_message: error.message,
      error_details: { error: error.toString(), stack: error.stack },
      duration_ms: duration,
      transaction_id: transactionId,
    });

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
