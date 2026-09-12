import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import EmptyState from "../components/EmptyState";
import "./CompanyProfile.css";

export default function CompanyProfile() {
    const { id } = useParams();
    const [company, setCompany] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadCompany = async () => {
            try {
                // Try fetching by company ID first, then by owner user ID
                let res;
                try {
                    res = await api.get(`/company/${id}`);
                } catch {
                    res = await api.get(`/company/by-owner/${id}`);
                }
                setCompany(res.data.company);
                setJobs(res.data.jobs || []);
            } catch (err) {
                setError("Company profile not found");
            } finally {
                setLoading(false);
            }
        };
        loadCompany();
    }, [id]);

    if (loading) {
        return (
            <div className="company-profile page-container">
                <div className="company-profile__loading">
                    <div className="skeleton" style={{ height: 200, borderRadius: "var(--radius-xl)" }} />
                    <div className="skeleton skeleton-text long" style={{ marginTop: 20 }} />
                    <div className="skeleton skeleton-text medium" />
                    <div className="skeleton skeleton-text short" />
                </div>
            </div>
        );
    }

    if (error || !company) {
        return (
            <div className="company-profile page-container">
                <EmptyState
                    icon="search"
                    title="Company Not Found"
                    description="This company profile doesn't exist or hasn't been set up yet."
                    actionLabel="Browse Jobs"
                    actionTo="/jobs"
                />
            </div>
        );
    }

    const logoUrl = company.logo?.filename
        ? `${api.defaults.baseURL.replace('/api', '')}/uploads/${company.logo.filename}`
        : null;

    return (
        <div className="company-profile page-container">
            {/* Hero Section */}
            <div className="company-profile__hero">
                <div className="company-profile__hero-bg" />
                <div className="company-profile__hero-content">
                    <div className="company-profile__logo">
                        {logoUrl ? (
                            <img src={logoUrl} alt={company.name} />
                        ) : (
                            <div className="company-profile__logo-fallback">
                                {company.name?.charAt(0)?.toUpperCase() || "C"}
                            </div>
                        )}
                    </div>
                    <div className="company-profile__hero-info">
                        <h1>{company.name}</h1>
                        <div className="company-profile__meta">
                            {company.industry && <span className="badge badge--info">{company.industry}</span>}
                            {company.size && <span className="badge badge--info">👥 {company.size} employees</span>}
                            {company.founded && <span className="badge badge--info">📅 Founded {company.founded}</span>}
                        </div>
                        {company.website && (
                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="company-profile__website">
                                🔗 {company.website.replace(/^https?:\/\//, "")}
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <div className="company-profile__body">
                {/* About Section */}
                {company.description && (
                    <section className="company-profile__section">
                        <h2>About</h2>
                        <p>{company.description}</p>
                    </section>
                )}

                {/* Culture Section */}
                {company.culture && (
                    <section className="company-profile__section">
                        <h2>🌟 Culture & Values</h2>
                        <p>{company.culture}</p>
                    </section>
                )}

                {/* Benefits */}
                {company.benefits?.length > 0 && (
                    <section className="company-profile__section">
                        <h2>🎁 Benefits & Perks</h2>
                        <div className="company-profile__benefits">
                            {company.benefits.map((benefit, i) => (
                                <span key={i} className="company-profile__benefit-tag">
                                    {benefit}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                {/* Locations */}
                {company.locations?.length > 0 && (
                    <section className="company-profile__section">
                        <h2>📍 Locations</h2>
                        <div className="company-profile__locations">
                            {company.locations.map((loc, i) => (
                                <span key={i} className="badge badge--info">{loc}</span>
                            ))}
                        </div>
                    </section>
                )}

                {/* Social Links */}
                {(company.socialLinks?.linkedin || company.socialLinks?.twitter || company.socialLinks?.github) && (
                    <section className="company-profile__section">
                        <h2>🔗 Connect</h2>
                        <div className="company-profile__socials">
                            {company.socialLinks.linkedin && (
                                <a href={company.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="company-profile__social-link">
                                    LinkedIn ↗
                                </a>
                            )}
                            {company.socialLinks.twitter && (
                                <a href={company.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="company-profile__social-link">
                                    Twitter ↗
                                </a>
                            )}
                            {company.socialLinks.github && (
                                <a href={company.socialLinks.github} target="_blank" rel="noopener noreferrer" className="company-profile__social-link">
                                    GitHub ↗
                                </a>
                            )}
                        </div>
                    </section>
                )}

                {/* Open Positions */}
                <section className="company-profile__section">
                    <h2>💼 Open Positions ({jobs.length})</h2>
                    {jobs.length === 0 ? (
                        <p className="company-profile__no-jobs">No open positions right now.</p>
                    ) : (
                        <div className="company-profile__jobs">
                            {jobs.map((job) => (
                                <Link to={`/jobs/${job._id}`} key={job._id} className="company-profile__job-card">
                                    <div className="company-profile__job-header">
                                        <h3>{job.title}</h3>
                                        <span className="badge badge--info">{job.type}</span>
                                    </div>
                                    <div className="company-profile__job-details">
                                        <span>📍 {job.location}</span>
                                        <span>📊 {job.experienceLevel}</span>
                                        {job.salary && job.salary !== "Not disclosed" && <span>💰 {job.salary}</span>}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
