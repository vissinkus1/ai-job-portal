import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/ToastContext";
import "../App.css";
import "./JobAlerts.css";

export default function JobAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const toast = useToast();

  const [form, setForm] = useState({
    name: "",
    keywords: "",
    skills: "",
    locations: "",
    jobTypes: [],
    experienceLevels: [],
    emailNotify: true,
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await api.get("/job-alerts");
      setAlerts(res.data);
    } catch {
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      keywords: "",
      skills: "",
      locations: "",
      jobTypes: [],
      experienceLevels: [],
      emailNotify: true,
    });
    setEditingId(null);
    setPreviewData(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (alert) => {
    setForm({
      name: alert.name || "",
      keywords: (alert.keywords || []).join(", "),
      skills: (alert.skills || []).join(", "),
      locations: (alert.locations || []).join(", "),
      jobTypes: alert.jobTypes || [],
      experienceLevels: alert.experienceLevels || [],
      emailNotify: alert.emailNotify !== false,
    });
    setEditingId(alert._id);
    setShowForm(true);
    setPreviewData(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name || "My Alert",
      keywords: form.keywords.split(",").map((s) => s.trim()).filter(Boolean),
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      locations: form.locations.split(",").map((s) => s.trim()).filter(Boolean),
      jobTypes: form.jobTypes,
      experienceLevels: form.experienceLevels,
      emailNotify: form.emailNotify,
    };

    // Validate at least one criterion
    if (!payload.keywords.length && !payload.skills.length && !payload.locations.length &&
        !payload.jobTypes.length && !payload.experienceLevels.length) {
      toast.error("Please set at least one filter criterion");
      setSaving(false);
      return;
    }

    try {
      if (editingId) {
        await api.put(`/job-alerts/${editingId}`, payload);
        toast.success("Alert updated");
      } else {
        await api.post("/job-alerts", payload);
        toast.success("Alert created!");
      }
      setShowForm(false);
      resetForm();
      fetchAlerts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save alert");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this alert?")) return;
    try {
      await api.delete(`/job-alerts/${id}`);
      toast.success("Alert deleted");
      setAlerts(alerts.filter((a) => a._id !== id));
    } catch {
      toast.error("Failed to delete alert");
    }
  };

  const handleToggleActive = async (id, currentState) => {
    try {
      await api.put(`/job-alerts/${id}`, { isActive: !currentState });
      setAlerts(alerts.map((a) => a._id === id ? { ...a, isActive: !currentState } : a));
      toast.success(!currentState ? "Alert activated" : "Alert paused");
    } catch {
      toast.error("Failed to update alert");
    }
  };

  const handlePreview = async (id) => {
    try {
      const res = await api.get(`/job-alerts/${id}/preview`);
      setPreviewData({ id, ...res.data });
    } catch {
      toast.error("Failed to preview");
    }
  };

  const toggleType = (type) => {
    setForm((prev) => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(type)
        ? prev.jobTypes.filter((t) => t !== type)
        : [...prev.jobTypes, type],
    }));
  };

  const toggleLevel = (level) => {
    setForm((prev) => ({
      ...prev,
      experienceLevels: prev.experienceLevels.includes(level)
        ? prev.experienceLevels.filter((l) => l !== level)
        : [...prev.experienceLevels, level],
    }));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>🔔 Smart Job Alerts</h1>
            <p>Get notified when new jobs match your criteria</p>
          </div>
          {alerts.length < 5 && (
            <button className="glass-button" onClick={handleOpenCreate}>
              + Create Alert
            </button>
          )}
        </div>
      </div>

      {/* Alert Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="modal-content alert-form-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? "✏️ Edit Alert" : "🔔 New Job Alert"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Alert Name</label>
                <input
                  type="text"
                  className="glass-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., React Developer Jobs"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Keywords (title, company)</label>
                <input
                  type="text"
                  className="glass-input"
                  value={form.keywords}
                  onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                  placeholder="e.g., Frontend, Google, Startup"
                />
                <span className="form-hint">Comma separated</span>
              </div>

              <div className="form-group">
                <label className="form-label">Skills</label>
                <input
                  type="text"
                  className="glass-input"
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  placeholder="e.g., React, Node.js, Python"
                />
                <span className="form-hint">Comma separated</span>
              </div>

              <div className="form-group">
                <label className="form-label">Locations</label>
                <input
                  type="text"
                  className="glass-input"
                  value={form.locations}
                  onChange={(e) => setForm({ ...form, locations: e.target.value })}
                  placeholder="e.g., Bangalore, Remote, Delhi"
                />
                <span className="form-hint">Comma separated</span>
              </div>

              <div className="form-group">
                <label className="form-label">Job Types</label>
                <div className="chip-group">
                  {["Full-time", "Part-time", "Remote", "Contract", "Internship"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`chip ${form.jobTypes.includes(type) ? "active" : ""}`}
                      onClick={() => toggleType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Experience Level</label>
                <div className="chip-group">
                  {["Entry", "Mid", "Senior", "Lead"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`chip ${form.experienceLevels.includes(level) ? "active" : ""}`}
                      onClick={() => toggleLevel(level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={form.emailNotify}
                    onChange={(e) => setForm({ ...form, emailNotify: e.target.checked })}
                  />
                  <span>📧 Email notifications</span>
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  className="glass-button secondary"
                  onClick={() => { setShowForm(false); resetForm(); }}
                >
                  Cancel
                </button>
                <button type="submit" className="glass-button" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update Alert" : "Create Alert"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <h3>No alerts yet</h3>
          <p>Create your first job alert to get notified about new matching jobs</p>
          <button className="glass-button" onClick={handleOpenCreate} style={{ marginTop: "16px" }}>
            + Create Your First Alert
          </button>
        </div>
      ) : (
        <div className="alerts-list">
          {alerts.map((alert, index) => (
            <div
              key={alert._id}
              className={`alert-card fade-in-up ${!alert.isActive ? "paused" : ""}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="alert-card-header">
                <div className="alert-card-title">
                  <h3>{alert.name}</h3>
                  <div className="alert-badges">
                    <span className={`badge ${alert.isActive ? "success" : "ghost"}`}>
                      {alert.isActive ? "🟢 Active" : "⏸️ Paused"}
                    </span>
                    {alert.emailNotify && (
                      <span className="badge secondary">📧 Email</span>
                    )}
                    {alert.matchCount > 0 && (
                      <span className="badge primary">{alert.matchCount} matches</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="alert-criteria">
                {alert.keywords?.length > 0 && (
                  <div className="criteria-row">
                    <span className="criteria-label">🔑 Keywords:</span>
                    {alert.keywords.map((k, i) => (
                      <span key={i} className="badge primary">{k}</span>
                    ))}
                  </div>
                )}
                {alert.skills?.length > 0 && (
                  <div className="criteria-row">
                    <span className="criteria-label">⚡ Skills:</span>
                    {alert.skills.map((s, i) => (
                      <span key={i} className="badge secondary">{s}</span>
                    ))}
                  </div>
                )}
                {alert.locations?.length > 0 && (
                  <div className="criteria-row">
                    <span className="criteria-label">📍 Locations:</span>
                    {alert.locations.map((l, i) => (
                      <span key={i} className="badge primary">{l}</span>
                    ))}
                  </div>
                )}
                {alert.jobTypes?.length > 0 && (
                  <div className="criteria-row">
                    <span className="criteria-label">💼 Types:</span>
                    {alert.jobTypes.map((t, i) => (
                      <span key={i} className="badge secondary">{t}</span>
                    ))}
                  </div>
                )}
                {alert.experienceLevels?.length > 0 && (
                  <div className="criteria-row">
                    <span className="criteria-label">📊 Levels:</span>
                    {alert.experienceLevels.map((l, i) => (
                      <span key={i} className="badge primary">{l}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview */}
              {previewData?.id === alert._id && (
                <div className="alert-preview">
                  <p className="preview-count">
                    {previewData.count} existing job{previewData.count !== 1 ? "s" : ""} match this alert
                  </p>
                  {previewData.jobs?.slice(0, 5).map((job) => (
                    <Link to={`/jobs/${job._id}`} key={job._id} className="preview-job-row">
                      <span>{job.title}</span>
                      <span className="preview-company">{job.company}</span>
                    </Link>
                  ))}
                </div>
              )}

              <div className="alert-card-actions">
                <button
                  className="glass-button small secondary"
                  onClick={() => handlePreview(alert._id)}
                >
                  👁️ Preview
                </button>
                <button
                  className={`glass-button small ${alert.isActive ? "ghost" : ""}`}
                  onClick={() => handleToggleActive(alert._id, alert.isActive)}
                >
                  {alert.isActive ? "⏸️ Pause" : "▶️ Activate"}
                </button>
                <button
                  className="glass-button small secondary"
                  onClick={() => handleEdit(alert)}
                >
                  ✏️ Edit
                </button>
                <button
                  className="glass-button small danger"
                  onClick={() => handleDelete(alert._id)}
                >
                  🗑️ Delete
                </button>
              </div>

              {alert.lastNotified && (
                <p className="alert-last-notified">
                  Last notified: {new Date(alert.lastNotified).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
