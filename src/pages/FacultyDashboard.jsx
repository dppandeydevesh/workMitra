import React, { useState } from "react";
import { API_BASE_URL } from "../config";
import "./FacultyDashboard.css";

export default function FacultyDashboard() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skills: "",
    budget: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          // Split skills by comma and trim whitespace
          skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
          budget: formData.budget,
        }),
      });

      if (res.ok) {
        setMessage("Project posted successfully!");
        setFormData({ title: "", description: "", skills: "", budget: "" });
      } else {
        const errorData = await res.json();
        setMessage(`Error: ${errorData.message || "Failed to post project"}`);
      }
    } catch (error) {
      setMessage("Error posting project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="faculty-dashboard-container">
      <div className="glass-card faculty-form-card">
        <h1 className="faculty-dashboard-title">Faculty Dashboard</h1>
        <p className="faculty-dashboard-subtitle">Post a New Project</p>

        {message && (
          <div className={`status-message ${message.includes("Error") ? "error" : "success"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="faculty-project-form">
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              placeholder="e.g., AI Research Assistant"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              placeholder="Detailed description of the project and responsibilities..."
              rows="4"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="skills">Skills Required</label>
            <input
              type="text"
              id="skills"
              name="skills"
              placeholder="e.g., Python, React, Machine Learning (comma-separated)"
              value={formData.skills}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="budget">Incentive (Marks/Stipend)</label>
            <input
              type="text"
              id="budget"
              name="budget"
              placeholder="e.g., 50 Marks or ₹5000/month"
              value={formData.budget}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="faculty-submit-btn" disabled={loading}>
            {loading ? "Posting..." : "Post Project"}
          </button>
        </form>
      </div>
    </div>
  );
}
