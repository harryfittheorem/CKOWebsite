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

    const paymentData = {
      storeId: parseInt(clubreadyStoreId),
      userId: parseInt(clubreadyUserId),
      packageId: parseInt(packageId),
      payment: {
        cardNumber,
        expirationMonth: parseInt(cardExpMonth),
        expirationYear: parseInt(cardExpYear),
        cvv: cardCvv,
        cardholderName: cardholderName || `${prospectData.first_name} ${prospectData.last_name}`,
        billingZip: billingZip || "",
      },
    };

    const searchParams = new URLSearchParams({
      ApiKey: clubreadyApiKey,
      ChainId: clubreadyChainId,
    });

    const response = await fetch(`${clubreadyApiUrl}/sales/packages?${searchParams}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    const duration = Date.now() - startTime;
    const responseData = await response.json();

    const sanitizedRequest = {
      ...paymentData,
      payment: {
        cardNumber: `****${cardNumber.slice(-4)}`,
        expirationMonth: paymentData.payment.expirationMonth,
        expirationYear: paymentData.payment.expirationYear,
        cvv: "***",
        cardholderName: paymentData.payment.cardholderName,
        billingZip: paymentData.payment.billingZip,
      },
    };

    await supabase.from("payment_logs").insert({
      transaction_id: transaction.id,
      endpoint: "/sales/packages",
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
          error_message: responseData.message || "Payment processing failed",
        })
        .eq("id", transaction.id);

      throw new Error(responseData.message || "Payment processing failed");
    }

    const sale = responseData.data;

    await supabase
      .from("transactions")
      .update({
        status: "completed",
        clubready_transaction_id: sale.saleId?.toString() || null,
        completed_at: new Date().toISOString(),
        last_four: cardNumber.slice(-4),
        metadata: {
          clubready_sale_id: sale.saleId,
          package_name: packageData.name,
        },
      })
      .eq("id", transaction.id);

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: transaction.id,
        clubreadySaleId: sale.saleId,
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
