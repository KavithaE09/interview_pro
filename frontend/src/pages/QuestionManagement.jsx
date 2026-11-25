import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import { ArrowLeft, PlusCircle, Edit2, Trash2, CheckCircle2, HelpCircle, Info, Key } from "lucide-react";

const QuestionManagement = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionText, setQuestionText] = useState("");
  const [marks, setMarks] = useState(10);
  const [questionOrder, setQuestionOrder] = useState(1);
  const [expectedKeywords, setExpectedKeywords] = useState("");
  const [explanation, setExplanation] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => { fetchQuestions(); }, [assessmentId]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/assessments/${assessmentId}`);
      if (res.data.success) {
        setAssessment(res.data.assessment);
        setQuestions(res.data.assessment.questions || []);
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError("Failed to load questions for this assessment.");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingQuestion(null);
    setQuestionText("");
    setMarks(10);
    setQuestionOrder(questions.length + 1);
    setExpectedKeywords("");
    setExplanation("");
    setError("");
    setShowModal(true);
  };

  const openEditModal = (q) => {
    setEditingQuestion(q);
    setQuestionText(q.question_text);
    setMarks(q.marks || 10);
    setQuestionOrder(q.question_order || 1);
    setExpectedKeywords(q.expected_keywords || "");
    setExplanation(q.explanation || "");
    setError("");
    setShowModal(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) { setError("Question text is required."); return; }

    const payload = {
      assessment_id: assessmentId,
      question_text: questionText.trim(),
      marks: Number(marks) || 10,
      question_order: Number(questionOrder) || 1,
      expected_keywords: expectedKeywords.trim(),
      explanation: explanation.trim()
    };

    try {
      setModalLoading(true);
      setError("");
      if (editingQuestion) {
        await api.put(`/admin/questions/${editingQuestion.id}`, payload);
        setSuccessMsg("Question updated successfully!");
      } else {
        await api.post("/admin/questions", payload);
        setSuccessMsg("Question added successfully!");
      }
      setShowModal(false);
      fetchQuestions();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save question.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await api.delete(`/admin/questions/${qId}`);
      setSuccessMsg("Question deleted successfully.");
      fetchQuestions();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete question.");
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="page-body">
          <div style={{ marginBottom: "1.5rem" }}>
            <button onClick={() => navigate("/admin/assessments")} className="btn btn-secondary btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem" }}>
              <ArrowLeft size={14} /><span>Back to Assessments</span>
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
                  Questions Bank: {assessment?.title}
                </h1>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                  {questions.length} Questions &bull; Total Marks: {assessment?.total_marks} &bull; Passing Score: {assessment?.passing_marks} Marks
                </p>
              </div>
              <button onClick={openAddModal} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <PlusCircle size={16} /><span>Add Question</span>
              </button>
            </div>
          </div>

          {successMsg && (
            <div style={{ background: "var(--success-light)", border: "1px solid var(--success-border)", color: "var(--success)", padding: "0.85rem 1.25rem", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <CheckCircle2 size={18} /><span>{successMsg}</span>
            </div>
          )}

          {error && !showModal && (
            <div style={{ background: "var(--danger-light)", border: "1px solid var(--danger-border)", color: "var(--danger)", padding: "0.85rem 1.25rem", borderRadius: "var(--radius-md)", marginBottom: "1.5rem" }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "4rem 0" }}>
              <div className="spinner" style={{ margin: "0 auto 0.75rem" }}></div>
              <p style={{ color: "var(--text-muted)" }}>Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px dashed var(--border-medium)", padding: "3rem", textAlign: "center" }}>
              <HelpCircle size={40} color="var(--text-light)" style={{ margin: "0 auto 0.75rem" }} />
              <h3 style={{ fontSize: "1.15rem", color: "var(--text-main)", marginBottom: "0.35rem" }}>No Questions Added Yet</h3>
              <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>Add open-ended questions with expected keywords to activate this assessment.</p>
              <button onClick={openAddModal} className="btn btn-primary">Add First Question</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {questions.map((q, idx) => (
                <div key={q.id} style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-light)", padding: "1.5rem", boxShadow: "var(--shadow-sm)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)", padding: "0.25rem 0.65rem", borderRadius: "var(--radius-sm)", fontWeight: 700, fontSize: "0.85rem" }}>Q{idx + 1}</span>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>{q.marks} Mark{q.marks > 1 ? "s" : ""}</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => openEditModal(q)} className="btn btn-secondary btn-sm" title="Edit Question"><Edit2 size={14} /></button>
                      <button onClick={() => handleDeleteQuestion(q.id)} className="btn btn-danger btn-sm" title="Delete Question"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-main)", lineHeight: 1.5, marginBottom: "1rem" }}>
                    {q.question_text}
                  </div>

                  {q.expected_keywords && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", background: "var(--bg-subtle)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "0.65rem 1rem", marginBottom: q.explanation ? "0.75rem" : 0, fontSize: "0.85rem" }}>
                      <Key size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <div>
                        <strong style={{ color: "var(--text-main)", marginRight: "0.4rem" }}>Keywords:</strong>
                        <span style={{ color: "var(--text-muted)" }}>{q.expected_keywords}</span>
                      </div>
                    </div>
                  )}

                  {q.explanation && (
                    <div style={{ backgroundColor: "var(--primary-light)", borderLeft: "4px solid var(--primary)", padding: "0.75rem 1rem", borderRadius: "0 var(--radius-sm) var(--radius-sm) 0", fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", gap: "0.5rem" }}>
                      <Info size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <div><strong style={{ color: "var(--primary)" }}>Explanation: </strong>{q.explanation}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editingQuestion ? "Edit Question" : "Add Question"}
        subtitle="Define question text, marks, and expected keywords for auto-scoring"
        icon={<HelpCircle size={18} />} maxWidth="600px">
        <form onSubmit={handleSaveQuestion}>
          {error && (
            <div style={{ background: "var(--danger-light)", border: "1px solid var(--danger-border)", color: "var(--danger)", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", marginBottom: "1rem", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Question Text *</label>
            <textarea rows={3} required placeholder="Enter the question clearly..." value={questionText}
              onChange={(e) => setQuestionText(e.target.value)} className="input-field" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Marks *</label>
              <input type="number" min="1" required value={marks} onChange={(e) => setMarks(e.target.value)} className="input-field" />
            </div>
            <div className="form-group">
              <label className="form-label">Question Order</label>
              <input type="number" min="1" value={questionOrder} onChange={(e) => setQuestionOrder(e.target.value)} className="input-field" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Expected Keywords
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 400, marginLeft: "0.5rem" }}>(comma-separated, used for auto-scoring)</span>
            </label>
            <input type="text" placeholder="e.g. ROI, conversion rate, A/B testing, campaign optimization"
              value={expectedKeywords} onChange={(e) => setExpectedKeywords(e.target.value)} className="input-field" />
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
              Candidate answers are scored based on how many of these keywords they include.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">
              Explanation
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 400, marginLeft: "0.5rem" }}>(shown after submission)</span>
            </label>
            <textarea rows={2} placeholder="Explain the ideal answer or key concepts..."
              value={explanation} onChange={(e) => setExplanation(e.target.value)} className="input-field" />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={modalLoading} className="btn btn-primary">
              {modalLoading ? "Saving..." : editingQuestion ? "Update Question" : "Save Question"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default QuestionManagement;
