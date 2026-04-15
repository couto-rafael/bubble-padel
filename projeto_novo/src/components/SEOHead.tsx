import React from "react";
import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "profile" | "article";
  noindex?: boolean;
}

const DEFAULT_DESCRIPTION =
  "A plataforma moderna para gestão de torneios de padel e beach tennis. Crie, gerencie e realize torneios profissionais sem complicação.";
const DEFAULT_IMAGE =
  "https://bubble-padel-production.up.railway.app/og-image.png";
const SITE_NAME = "Bubble Padel";

const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  noindex = false,
}) => {
  const fullTitle = title.includes("Bubble")
    ? title
    : `${title} — ${SITE_NAME}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEOHead;
