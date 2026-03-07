import { Helmet } from "react-helmet-async";
import { useSeoSettings } from "@/hooks/useSeoSettings";
import { usePageSeo } from "@/hooks/usePageSeo";

interface SEOProps {
  title?: string;
  rawTitle?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  jsonLd?: Record<string, unknown>;
}

export function SEO({ title, rawTitle, description, image, url, type = "website", jsonLd }: SEOProps) {
  const seo = useSeoSettings();
  const { data: pageOverride } = usePageSeo(url);
  const siteName = seo.siteTitle;

  const baseTitle = rawTitle || (title ? `${title} | ${siteName}` : siteName);
  const fullTitle = pageOverride?.meta_title || baseTitle;
  const desc = pageOverride?.meta_description || description || seo.metaDescription;
  const ogImage = image || seo.ogImage || undefined;
  const siteUrl = "https://godforgehub.lovable.app";
  const canonical = url ? `${siteUrl}${url}` : undefined;

  const defaultJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    description: desc,
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
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:site_name" content={siteName} />
      <meta name="twitter:card" content={ogImage ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd || defaultJsonLd)}
      </script>
    </Helmet>
  );
}
