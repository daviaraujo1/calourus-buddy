// Central place for the Kiwify checkout link so the URL only needs to be
// updated in one spot if the product/offer changes.
export const KIWIFY_PREMIUM_CHECKOUT_URL = "https://pay.kiwify.com.br/lXKfbIN";

/**
 * Kiwify's hosted checkout accepts `name`/`email` (and a few other) query
 * params to pre-fill the buyer's data — see:
 * https://ajuda.kiwify.com.br/pt-br/article/como-preencher-os-campos-do-checkout-pela-url-de7ezo/
 *
 * There is no official iframe/inline embed for Kiwify checkout, so the
 * purchase always opens in a new tab rather than replacing the page.
 */
export function buildKiwifyCheckoutUrl(buyer?: { name?: string | null; email?: string | null }) {
  const url = new URL(KIWIFY_PREMIUM_CHECKOUT_URL);
  if (buyer?.name) url.searchParams.set("name", buyer.name);
  if (buyer?.email) url.searchParams.set("email", buyer.email);
  return url.toString();
}
