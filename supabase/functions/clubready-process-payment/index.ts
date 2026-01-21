import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

  try {
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
    } = await req.json();

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

    const startTime = Date.now();

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

    const response = await fetch(
      `${clubreadyApiUrl}/sales/member/${clubreadyUserId}/payment/makepayment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

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

    await supabase.from("payment_logs").insert({
      transaction_id: transaction.id,
      endpoint: `/sales/member/${clubreadyUserId}/payment/makepayment`,
      request_data: sanitizedRequest,
      response_data: responseData,
      status_code: response.status,
      duration_ms: duration,
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
