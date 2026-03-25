export interface PaymentInfo {
  promoPrice: string;
  originalPrice: string | null;
  currency: string;
  link: string;
  labelKey: string;
  useStripeCheckout: boolean;
  stripePriceId?: string;
}

const STRIPE_USD_PRICE_ID = "price_1SidA7Dw4LupjPaOS8tpT2OP";

const STRIPE_USD_LINK = "https://buy.stripe.com/14AbIU9Lw2KF6VR0Id4Ni02";
const STRIPE_EUR_LINK = "https://buy.stripe.com/5kQbIU4rc1GB0xt76B4Ni04";

const EUR_LANGUAGES = ["fr", "de", "it"];

export function getPaymentInfo(userLanguage?: string): PaymentInfo {
  const lang = (userLanguage || "pt").toLowerCase();
  const baseLang = lang.split(/[-_]/)[0];

  const isBrazilian = baseLang === "pt";

  if (isBrazilian) {
    return {
      promoPrice: "16,49",
      originalPrice: "24,90",
      currency: "R$ ",
      link: "https://pay.kiwify.com.br/3lfpi2F",
      labelKey: "upgrade.launchPromo",
      useStripeCheckout: false,
    };
  }

  const isEurRegion = EUR_LANGUAGES.includes(baseLang);

  if (isEurRegion) {
    return {
      promoPrice: "4,25",
      originalPrice: "10",
      currency: "€",
      link: STRIPE_EUR_LINK,
      labelKey: "upgrade.internationalPricing",
      useStripeCheckout: false,
    };
  }

  return {
    promoPrice: "4.99",
    originalPrice: "10",
    currency: "$",
    link: STRIPE_USD_LINK,
    labelKey: "upgrade.internationalPricing",
    useStripeCheckout: false,
  };
}
