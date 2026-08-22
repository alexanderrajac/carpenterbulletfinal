/**
 * Programmatic SEO & Structured Data Builder for CarpenterBullet
 * Generates SEO metadata, JSON-LD Schema (LocalBusiness, Service, FAQPage, BreadcrumbList),
 * canonical links, and local area mapping.
 */

export interface ProgrammaticSEOData {
  city: string;
  area: string;
  serviceCategory: string;
  canonicalUrl: string;
  providerCount?: number;
  avgRating?: number;
}

export function buildProgrammaticSEOMeta(data: ProgrammaticSEOData) {
  const formattedCategory = data.serviceCategory
    ? data.serviceCategory.charAt(0).toUpperCase() + data.serviceCategory.slice(1).replace(/-/g, " ")
    : "Carpentry Services";
  const formattedArea = data.area ? `${data.area}, ` : "";

  const titleTag = `Top ${formattedCategory} in ${formattedArea}${data.city} | Verified Carpenters | CarpenterBullet`;
  const metaDescription = `Looking for ${formattedCategory.toLowerCase()} in ${formattedArea}${data.city}? Find background-verified local carpenters, compare instant quotes, view project portfolios, and book doorstep service.`;
  const h1Heading = `Best ${formattedCategory} in ${formattedArea}${data.city}`;

  return {
    titleTag,
    metaDescription,
    h1Heading,
    canonicalUrl: data.canonicalUrl,
  };
}

export function buildProgrammaticJSONLD(data: ProgrammaticSEOData, faqs: Array<{ question: string; answer: string }>) {
  const formattedCategory = data.serviceCategory.replace(/-/g, " ");

  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.carpenterbullet.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Carpenters",
        "item": `https://www.carpenterbullet.com/carpenters/${data.city.toLowerCase()}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": `${data.area}, ${data.city}`,
        "item": `https://www.carpenterbullet.com/carpenters/${data.city.toLowerCase()}/${data.area.toLowerCase().replace(/\s+/g, "-")}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": formattedCategory,
        "item": data.canonicalUrl
      }
    ]
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `${formattedCategory} in ${data.area}, ${data.city}`,
    "provider": {
      "@type": "LocalBusiness",
      "name": "CarpenterBullet Verified Local Carpenters Network",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": data.area,
        "addressRegion": data.city,
        "addressCountry": "IN"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": data.avgRating || "4.8",
        "reviewCount": data.providerCount ? data.providerCount * 14 : "85"
      }
    },
    "areaServed": {
      "@type": "City",
      "name": `${data.area}, ${data.city}`
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": `${formattedCategory} Services`,
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": `Doorstep ${formattedCategory}`
          }
        }
      ]
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return {
    breadcrumbsSchema: JSON.stringify(breadcrumbsSchema),
    serviceSchema: JSON.stringify(serviceSchema),
    faqSchema: JSON.stringify(faqSchema),
  };
}

