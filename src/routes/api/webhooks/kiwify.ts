import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// Kiwify sends the webhook's shared secret as a `signature` query param on
// the URL you configure in Kiwify → Apps → Webhooks. Store that same value
// as KIWIFY_WEBHOOK_TOKEN in this project's server environment.
// Payload shape reference: https://docs.kiwify.com.br

const kiwifyPayloadSchema = z.object({
  order_status: z.string(),
  Customer: z.object({
    email: z.string().email(),
  }),
});

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = new TextEncoder().encode(a);
  const bufB = new TextEncoder().encode(b);
  if (bufA.length !== bufB.length) return false;
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) diff |= bufA[i] ^ bufB[i];
  return diff === 0;
}

export const Route = createFileRoute("/api/webhooks/kiwify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expectedToken = process.env.KIWIFY_WEBHOOK_TOKEN;
        if (!expectedToken) {
          console.error("[kiwify webhook] KIWIFY_WEBHOOK_TOKEN não configurado no ambiente.");
          return new Response("Webhook not configured", { status: 500 });
        }

        const url = new URL(request.url);
        const receivedToken = url.searchParams.get("signature") ?? "";
        if (!timingSafeEqual(receivedToken, expectedToken)) {
          return new Response("Unauthorized", { status: 401 });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const parsed = kiwifyPayloadSchema.safeParse(body);
        if (!parsed.success) {
          console.error("[kiwify webhook] Payload inesperado:", parsed.error.flatten());
          return new Response("Invalid payload", { status: 400 });
        }

        // Only a fully approved payment unlocks premium. Other events
        // (boleto/pix gerado, recusada, carrinho abandonado, etc.) are
        // acknowledged but ignored.
        if (parsed.data.order_status !== "paid") {
          return new Response("Ignored", { status: 200 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.rpc("grant_premium_by_email", {
          p_email: parsed.data.Customer.email,
        });

        if (error) {
          console.error("[kiwify webhook] grant_premium_by_email falhou:", error.message);
          return new Response("Error activating premium", { status: 500 });
        }

        return new Response("OK", { status: 200 });
      },
    },
  },
});
