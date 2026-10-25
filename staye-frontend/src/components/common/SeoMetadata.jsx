import { useEffect } from "react";

function setMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!content) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

export default function SeoMetadata({
  title,
  description,
  canonicalPath,
  image,
  structuredData,
  noIndex = false,
}) {
  const structuredDataJson = structuredData ? JSON.stringify(structuredData) : "";

  useEffect(() => {
    const canonicalUrl = new URL(canonicalPath, window.location.origin).href;
    document.title = title;
    setMeta("name", "description", description);
    setMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");
    setMeta("property", "og:type", "website");
    setMeta("property", "og:site_name", "Staye");
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:image", image);
    setMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    let schema = document.getElementById("seo-jsonld");
    if (structuredDataJson) {
      if (!schema) {
        schema = document.createElement("script");
        schema.id = "seo-jsonld";
        schema.type = "application/ld+json";
        document.head.appendChild(schema);
      }
      schema.textContent = structuredDataJson;
    } else {
      schema?.remove();
    }
  }, [title, description, canonicalPath, image, noIndex, structuredDataJson]);

  return null;
}
