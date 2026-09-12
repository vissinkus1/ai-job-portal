import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./CompanySetup.css";

export default function CompanySetup() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [form, setForm] = useState({
        name: "",
        description: "",
        industry: "",
        size: "",
        founded: "",
        website: "",
        locations: "",
        benefits: "",
        culture: "",
        linkedin: "",
        twitter: "",
        github: "",
    });
    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        const loadCompany = async () => {
            try {
                const res = await api.get("/company/me");
                const c = res.data;
                setForm({
                    name: c.name || "",
                    description: c.description || "",
                    industry: c.industry || "",
                    size: c.size || "",
                    founded: c.founded || "",
                    website: c.website || "",
                    locations: (c.locations || []).join(", "),
                    benefits: (c.benefits || []).join(", "),
                    culture: c.culture || "",
                    linkedin: c.socialLinks?.linkedin || "",
                    twitter: c.socialLinks?.twitter || "",
                    github: c.socialLinks?.github || "",
                });
                if (c.logo?.filename) {
                    setLogoPreview(`${api.defaults.baseURL.replace('/api', '')}/uploads/${c.logo.filename}`);
                }
            } catch {
                // No existing company — that's fine
            } finally {
                setLoading(false);
            }
        };
        loadCompany();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: "", text: "" });

        try {
            const payload = {
                name: form.name,
                description: form.description,
                industry: form.industry,
                size: form.size,
                founded: form.founded,
                website: form.website,
                locations: form.locations.split(",").map((s) => s.trim()).filter(Boolean),
                benefits: form.benefits.split(",").map((s) => s.trim()).filter(Boolean),
                culture: form.culture,
                socialLinks: {
                    linkedin: form.linkedin,
                    twitter: form.twitter,
                    github: form.github,
                },
            };

            await api.post("/company", payload);

            // Upload logo if selected
            if (logoFile) {
                const formData = new FormData();
                formData.append("logo", logoFile);
                await api.post("/company/logo", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            setMessage({ type: "success", text: "Company profile saved! 🎉" });
            setTimeout(() => navigate("/dashboard"), 1500);
        } catch (error) {
            setMessage({
                type: "error",
                text: error.response?.data?.message || "Failed to save company profile",
            });
        } finally {
            setSaving(false);
        }
    };

    const totalSteps = 4;

    if (loading) {
        return (
            <div className="company-setup">
                <div className="company-setup__container">
                    <div style={{ textAlign: "center", padding: "60px 0" }}>
                        <div className="spinner"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="company-setup">
            <div className="company-setup__container">
                <div className="company-setup__header">
                    <h1>🏢 Company Profile</h1>
                    <p>Set up your company profile to attract top talent</p>
                </div>

                {/* Progress Steps */}
                <div className="company-setup__progress">
                    {[1, 2, 3, 4].map((s) => (
                        <div
                            key={s}
                            className={`company-setup__step ${step >= s ? "company-setup__step--active" : ""} ${step > s ? "company-setup__step--done" : ""}`}
                            onClick={() => setStep(s)}
                        >
                            <div className="company-setup__step-num">{step > s ? "✓" : s}</div>
                            <span className="company-setup__step-label">
                                {s === 1 ? "Basic Info" : s === 2 ? "Details" : s === 3 ? "Culture" : "Logo"}
                            </span>
                        </div>
                    ))}
                    <div className="company-setup__progress-bar">
                        <div
                            className="company-setup__progress-fill"
                            style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
                        />
                    </div>
                </div>

                {message.text && (
                    <div className={`company-setup__message company-setup__message--${message.type}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="company-setup__section fade-in-up">
                            <h2>Basic Information</h2>
                            <div className="company-setup__field">
                                <label htmlFor="name">Company Name *</label>
                                <input id="name" name="name" type="text" value={form.name} onChange={handleChange} placeholder="e.g. Acme Corp" required />
                            </div>
                            <div className="company-setup__field">
                                <label htmlFor="industry">Industry</label>
                                <input id="industry" name="industry" type="text" value={form.industry} onChange={handleChange} placeholder="e.g. Technology, Healthcare, Finance" />
                            </div>
                            <div className="company-setup__row">
                                <div className="company-setup__field">
                                    <label htmlFor="size">Company Size</label>
                                    <select id="size" name="size" value={form.size} onChange={handleChange}>
                                        <option value="">Select size</option>
                                        <option value="1-10">1-10 employees</option>
                                        <option value="11-50">11-50 employees</option>
                                        <option value="51-200">51-200 employees</option>
                                        <option value="201-500">201-500 employees</option>
                                        <option value="501-1000">501-1000 employees</option>
                                        <option value="1000+">1000+ employees</option>
                                    </select>
                                </div>
                                <div className="company-setup__field">
                                    <label htmlFor="founded">Founded Year</label>
                                    <input id="founded" name="founded" type="text" value={form.founded} onChange={handleChange} placeholder="e.g. 2020" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Details */}
                    {step === 2 && (
                        <div className="company-setup__section fade-in-up">
                            <h2>Company Details</h2>
                            <div className="company-setup__field">
                                <label htmlFor="description">Description</label>
                                <textarea id="description" name="description" value={form.description} onChange={handleChange} placeholder="Tell candidates about your company, mission, and what you do..." rows={5} />
                            </div>
                            <div className="company-setup__field">
                                <label htmlFor="website">Website</label>
                                <input id="website" name="website" type="url" value={form.website} onChange={handleChange} placeholder="https://yourcompany.com" />
                            </div>
                            <div className="company-setup__field">
                                <label htmlFor="locations">Office Locations</label>
                                <input id="locations" name="locations" type="text" value={form.locations} onChange={handleChange} placeholder="e.g. New York, San Francisco, Remote (comma-separated)" />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Culture & Benefits */}
                    {step === 3 && (
                        <div className="company-setup__section fade-in-up">
                            <h2>Culture & Benefits</h2>
                            <div className="company-setup__field">
                                <label htmlFor="culture">Work Culture</label>
                                <textarea id="culture" name="culture" value={form.culture} onChange={handleChange} placeholder="Describe your team culture, work environment, and values..." rows={4} />
                            </div>
                            <div className="company-setup__field">
                                <label htmlFor="benefits">Benefits & Perks</label>
                                <input id="benefits" name="benefits" type="text" value={form.benefits} onChange={handleChange} placeholder="e.g. Health Insurance, Remote Work, Stock Options (comma-separated)" />
                            </div>
                            <h3 style={{ marginTop: "20px", marginBottom: "12px" }}>Social Links</h3>
                            <div className="company-setup__field">
                                <label htmlFor="linkedin">LinkedIn</label>
                                <input id="linkedin" name="linkedin" type="url" value={form.linkedin} onChange={handleChange} placeholder="https://linkedin.com/company/..." />
                            </div>
                            <div className="company-setup__row">
                                <div className="company-setup__field">
                                    <label htmlFor="twitter">Twitter / X</label>
                                    <input id="twitter" name="twitter" type="url" value={form.twitter} onChange={handleChange} placeholder="https://x.com/..." />
                                </div>
                                <div className="company-setup__field">
                                    <label htmlFor="github">GitHub</label>
                                    <input id="github" name="github" type="url" value={form.github} onChange={handleChange} placeholder="https://github.com/..." />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Logo */}
                    {step === 4 && (
                        <div className="company-setup__section fade-in-up">
                            <h2>Company Logo</h2>
                            <div className="company-setup__logo-upload">
                                <div className="company-setup__logo-preview">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Company logo" />
                                    ) : (
                                        <div className="company-setup__logo-placeholder">🏢</div>
                                    )}
                                </div>
                                <div className="company-setup__logo-info">
                                    <p>Upload your company logo for a professional appearance</p>
                                    <label className="btn btn--secondary" htmlFor="logo-input">
                                        {logoPreview ? "Change Logo" : "Upload Logo"}
                                    </label>
                                    <input id="logo-input" type="file" accept="image/*" onChange={handleLogoChange} hidden />
                                    <span className="company-setup__logo-hint">PNG, JPG, or SVG. Max 2MB.</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="company-setup__nav">
                        {step > 1 && (
                            <button type="button" className="btn btn--secondary" onClick={() => setStep(step - 1)}>
                                ← Back
                            </button>
                        )}
                        <div style={{ flex: 1 }} />
                        {step < totalSteps ? (
                            <button type="button" className="btn btn--primary" onClick={() => setStep(step + 1)}>
                                Next →
                            </button>
                        ) : (
                            <button type="submit" className="btn btn--primary" disabled={saving || !form.name.trim()}>
                                {saving ? "Saving..." : "Save Company Profile"}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
