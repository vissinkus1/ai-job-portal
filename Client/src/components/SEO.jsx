import { Helmet } from "react-helmet-async";

/**
 * SEO component for per-page <title>, meta description, and Open Graph tags.
 *
 * Usage:
 *   <SEO title="Browse Jobs" description="Find your dream job..." />
 */
export default function SEO({
    title,
    description = "JobMatrix AI — Intelligent MERN job portal with TF-IDF recommendations, resume scoring, and skill gap analysis.",
    ogType = "website",
    ogImage = null,
}) {
    const siteName = "JobMatrix AI";
    const fullTitle = title ? `${title} | ${siteName}` : siteName;

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={ogType} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:site_name" content={siteName} />
            {ogImage && <meta property="og:image" content={ogImage} />}

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            {ogImage && <meta name="twitter:image" content={ogImage} />}
        </Helmet>
    );
}
