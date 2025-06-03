
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ valid: false, error: "Promo code is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve the promotion code from Stripe
    const promotionCodes = await stripe.promotionCodes.list({
      code: code,
      limit: 1,
    });

    if (promotionCodes.data.length === 0) {
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid promo code" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const promotionCode = promotionCodes.data[0];

    // Check if the promotion code is active
    if (!promotionCode.active) {
      return new Response(
        JSON.stringify({ valid: false, error: "Promo code is not active" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Check expiration date
    if (promotionCode.expires_at && promotionCode.expires_at < Math.floor(Date.now() / 1000)) {
      return new Response(
        JSON.stringify({ valid: false, error: "Promo code has expired" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get the coupon details
    const coupon = await stripe.coupons.retrieve(promotionCode.coupon);

    let discountAmount = 0;
    if (coupon.amount_off) {
      discountAmount = coupon.amount_off;
    } else if (coupon.percent_off) {
      // For percentage discounts, we'll return the percentage
      // The actual amount will be calculated on the frontend based on the plan price
      discountAmount = coupon.percent_off;
    }

    return new Response(
      JSON.stringify({
        valid: true,
        promotionCodeId: promotionCode.id,
        couponId: coupon.id,
        discountAmount,
        discountType: coupon.amount_off ? 'amount' : 'percent',
        couponDetails: {
          percent_off: coupon.percent_off,
          amount_off: coupon.amount_off,
          currency: coupon.currency,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error validating promo code:", error);
    return new Response(
      JSON.stringify({ valid: false, error: "Failed to validate promo code" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
