import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import api from "../services/api";
import "../App.css";
import "./Forms.css";

export default function PostJob() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    type: "Full-time",
    experienceLevel: "Entry",
    description: "",
    skills: "",
    salary: "",
    deadline: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [posting, setPosting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPosting(true);
    setMessage({ type: "", text: "" });

    try {
      const skillsArray = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);

      await api.post("/jobs", {
        ...form,
        skills: skillsArray,
        deadline: form.deadline || undefined,
      });

      setMessage({ type: "success", text: "Job posted successfully!" });
      setTimeout(() => navigate("/jobs"), 1500);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to post job",
      });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: "700px" }}>
      <div className="page-header">
        <h1>Post a Job</h1>
        <p>Find the best talent for your team</p>
      </div>

      <div className="profile-form-card">
        {message.text && (
          <div className={message.type === "error" ? "error-message" : "success-message"}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="form-label">Job Title *</label>
          <input
            type="text"
            name="title"
            className="glass-input"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Senior React Developer"
            required
          />

          <label className="form-label">Company *</label>
          <input
            type="text"
            name="company"
            className="glass-input"
            value={form.company}
            onChange={handleChange}
            placeholder="e.g. Google"
            required
          />

          <label className="form-label">Location *</label>
          <input
            type="text"
            name="location"
            className="glass-input"
            value={form.location}
            onChange={handleChange}
            placeholder="e.g. Bangalore, India"
            required
          />

          <label className="form-label">Job Type</label>
          <select
            name="type"
            className="glass-select"
            value={form.type}
            onChange={handleChange}
          >
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Remote">Remote</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>

          <label className="form-label">Experience Level</label>
          <select
            name="experienceLevel"
            className="glass-select"
            value={form.experienceLevel}
            onChange={handleChange}
          >
            <option value="Entry">Entry Level</option>
            <option value="Mid">Mid Level</option>
            <option value="Senior">Senior Level</option>
            <option value="Lead">Lead / Principal</option>
          </select>

          <label className="form-label">Salary Range</label>
          <input
            type="text"
            name="salary"
            className="glass-input"
            value={form.salary}
            onChange={handleChange}
            placeholder="e.g. ₹8L - ₹15L / year"
          />

          <label className="form-label">Required Skills (comma separated)</label>
          <input
            type="text"
            name="skills"
            className="glass-input"
            value={form.skills}
            onChange={handleChange}
            placeholder="React, Node.js, Python..."
          />

          {form.skills && (
            <div className="skills-preview" style={{ marginBottom: "8px" }}>
              {form.skills.split(",").map((s, i) =>
                s.trim() ? (
                  <span key={i} className="badge primary">{s.trim()}</span>
                ) : null
              )}
            </div>
          )}

          <label className="form-label">Application Deadline</label>
          <input
            type="date"
            name="deadline"
            className="glass-input"
            value={form.deadline}
            onChange={handleChange}
          />

          <label className="form-label">Job Description *</label>
          <div className="quill-container" style={{ marginBottom: "20px" }}>
            <ReactQuill
              theme="snow"
              value={form.description}
              onChange={(value) => setForm({ ...form, description: value })}
              placeholder="Describe the role, responsibilities, and requirements..."
              style={{ backgroundColor: "var(--glass-bg)", borderRadius: "10px" }}
            />
          </div>

          <button
            type="submit"
            className="glass-button"
            disabled={posting}
          >
            {posting ? "Posting..." : "📝 Post Job"}
          </button>
        </form>
      </div>
    </div>
  );
}
