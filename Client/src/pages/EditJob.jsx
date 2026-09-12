import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import api from "../services/api";
import { useToast } from "../components/ToastContext";
import "../App.css";

export default function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    title: "", company: "", location: "", type: "Full-time",
    experienceLevel: "Entry", description: "", skills: "", salary: "", deadline: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      const res = await api.get(`/jobs/${id}`);
      const job = res.data;
      setForm({
        title: job.title || "",
        company: job.company || "",
        location: job.location || "",
        type: job.type || "Full-time",
        experienceLevel: job.experienceLevel || "Entry",
        description: job.description || "",
        skills: (job.skills || []).join(", "),
        salary: job.salary || "",
        deadline: job.deadline ? job.deadline.slice(0, 10) : "",
      });
    } catch {
      toast.error("Failed to load job");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const skillsArray = form.skills.split(",").map((s) => s.trim()).filter((s) => s);
      await api.put(`/jobs/${id}`, { ...form, skills: skillsArray, deadline: form.deadline || undefined });
      toast.success("Job updated successfully!");
      setTimeout(() => navigate("/manage-jobs"), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: "700px" }}>
      <div className="page-header">
        <h1>Edit Job</h1>
        <p>Update your job listing</p>
      </div>

      <div className="profile-form-card">
        <form onSubmit={handleSubmit}>
          <label className="form-label">Job Title *</label>
          <input type="text" name="title" className="glass-input" value={form.title}
            onChange={handleChange} required />

          <label className="form-label">Company *</label>
          <input type="text" name="company" className="glass-input" value={form.company}
            onChange={handleChange} required />

          <label className="form-label">Location *</label>
          <input type="text" name="location" className="glass-input" value={form.location}
            onChange={handleChange} required />

          <label className="form-label">Job Type</label>
          <select name="type" className="glass-select" value={form.type} onChange={handleChange}>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Remote">Remote</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>

          <label className="form-label">Experience Level</label>
          <select name="experienceLevel" className="glass-select" value={form.experienceLevel} onChange={handleChange}>
            <option value="Entry">Entry Level</option>
            <option value="Mid">Mid Level</option>
            <option value="Senior">Senior Level</option>
            <option value="Lead">Lead / Principal</option>
          </select>

          <label className="form-label">Salary Range</label>
          <input type="text" name="salary" className="glass-input" value={form.salary}
            onChange={handleChange} />

          <label className="form-label">Application Deadline</label>
          <input type="date" name="deadline" className="glass-input" value={form.deadline}
            onChange={handleChange} />

          <label className="form-label">Skills (comma separated)</label>
          <input type="text" name="skills" className="glass-input" value={form.skills}
            onChange={handleChange} />

          <label className="form-label">Description *</label>
          <div className="quill-container" style={{ marginBottom: "20px" }}>
            <ReactQuill
              theme="snow"
              value={form.description}
              onChange={(value) => setForm({ ...form, description: value })}
              style={{ backgroundColor: "var(--glass-bg)", borderRadius: "10px" }}
            />
          </div>

          <button type="submit" className="glass-button" disabled={saving}>
            {saving ? "Saving..." : "💾 Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
