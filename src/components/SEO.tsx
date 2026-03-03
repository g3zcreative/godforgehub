import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  jsonLd?: Record<string, unknown>;
}

export function SEO({ title, description, image, url, type = "website", jsonLd }: SEOProps) {
  const siteName = "GodforgeHub";
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const defaultDescription = "A community information hub for Godforge by Fateless Games.";
  const desc = description || defaultDescription;
  const siteUrl = "https://godforgehub.lovable.app";
  const canonical = url ? `${siteUrl}${url}` : undefined;

  const defaultJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    description: defaultDescription,
  };

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      {canonical && <meta property="og:url" content={canonical} />}
      {image && <meta property="og:image" content={image} />}
      <meta property="og:site_name" content={siteName} />
      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd || defaultJsonLd)}
      </script>
    </Helmet>
  );
}
