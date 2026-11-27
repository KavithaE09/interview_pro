import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import { ArrowLeft, PlusCircle, Edit2, Trash2, CheckCircle2, HelpCircle, Info, Key, AlertCircle, Check, X } from "lucide-react";

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
  const [questionType, setQuestionType] = useState("mcq");
  const [options, setOptions] = useState([
    { option_text: "", is_correct: true },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false }
  ]);
  const [marks, setMarks] = useState(10);
  const [questionOrder, setQuestionOrder] = useState(1);
  const [expectedKeywords, setExpectedKeywords] = useState("");
  const [explanation, setExplanation] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  // Delete Confirmation State
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
    setQuestionType("mcq");
    setOptions([
      { option_text: "", is_correct: true },
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false }
    ]);
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
    const qType = q.question_type || (q.options && q.options.length > 0 ? "mcq" : "text");
    setQuestionType(qType);
    setOptions(
      q.options && q.options.length > 0
        ? q.options.map((o) => ({ option_text: o.option_text, is_correct: Boolean(o.is_correct) }))
        : [
            { option_text: "", is_correct: true },
            { option_text: "", is_correct: false },
            { option_text: "", is_correct: false },
            { option_text: "", is_correct: false }
          ]
    );
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

    if (questionType === "mcq") {
      const validOpts = options.filter((o) => o.option_text.trim());
      if (validOpts.length < 2) {
        setError("Please provide at least 2 options for an MCQ question.");
        return;
      }
      if (!validOpts.some((o) => o.is_correct)) {
        setError("Please mark one option as correct.");
        return;
      }
    }

    const payload = {
      assessment_id: assessmentId,
      question_text: questionText.trim(),
      question_type: questionType,
      marks: Number(marks) || 10,
      question_order: Number(questionOrder) || 1,
      expected_keywords: questionType === "text" ? expectedKeywords.trim() : "",
      options: questionType === "mcq" ? options : [],
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

  const handleConfirmDeleteQuestion = async () => {
    if (!questionToDelete) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/admin/questions/${questionToDelete.id}`);
      setSuccessMsg("Question deleted successfully.");
      setQuestionToDelete(null);
      fetchQuestions();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete question.");
    } finally {
      setDeleteLoading(false);
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
              {questions.map((q, idx) => {
                const isMcq = q.question_type === "mcq" || (q.options && q.options.length > 0 && q.question_type !== "text");
                return (
                <div key={q.id} style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-light)", padding: "1.5rem", boxShadow: "var(--shadow-sm)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)", padding: "0.25rem 0.65rem", borderRadius: "var(--radius-sm)", fontWeight: 700, fontSize: "0.85rem" }}>Q{idx + 1}</span>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>{q.marks} Mark{q.marks > 1 ? "s" : ""}</span>
                      <span style={{ background: isMcq ? "#fef9c3" : "#ecfdf5", color: isMcq ? "#92400e" : "#065f46", fontSize: "0.72rem", fontWeight: 700, padding: "0.15rem 0.55rem", borderRadius: "999px", border: `1px solid ${isMcq ? "#fde68a" : "#a7f3d0"}` }}>
                        {isMcq ? "MCQ" : "Short Answer"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => openEditModal(q)} className="btn btn-secondary btn-sm" title="Edit Question"><Edit2 size={14} /></button>
                      <button onClick={() => setQuestionToDelete(q)} className="btn btn-danger btn-sm" title="Delete Question"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-main)", lineHeight: 1.5, marginBottom: "1rem" }}>
                    {q.question_text}
                  </div>

                  {isMcq && q.options && q.options.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: q.explanation ? "0.85rem" : 0 }}>
                      {q.options.map((opt, oi) => (
                        <div key={oi} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0.45rem 0.75rem", borderRadius: "8px", background: opt.is_correct ? "#f0fdf4" : "#f8fafc", border: `1px solid ${opt.is_correct ? "#86efac" : "#e2e8f0"}` }}>
                          <span style={{ width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${opt.is_correct ? "#22c55e" : "#cbd5e1"}`, background: opt.is_correct ? "#22c55e" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {opt.is_correct ? <Check size={12} color="#ffffff" strokeWidth={3} /> : null}
                          </span>
                          <span style={{ fontSize: "0.875rem", color: opt.is_correct ? "#065f46" : "#475569", fontWeight: opt.is_correct ? 700 : 500 }}>
                            {String.fromCharCode(65 + oi)}. {opt.option_text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isMcq && q.expected_keywords && (
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
              );})}
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

          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="form-label">Question Type *</label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {[
                { val: "mcq", label: "Multiple Choice (MCQ)" },
                { val: "text", label: "Short Answer" }
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setQuestionType(val)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    border: `2px solid ${questionType === val ? "#6366f1" : "#e2e8f0"}`,
                    background: questionType === val ? "#eef2ff" : "#f8fafc",
                    color: questionType === val ? "#4f46e5" : "#64748b",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
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

          {questionType === "mcq" ? (
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label className="form-label">
                Answer Options
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 400, marginLeft: "0.5rem" }}>(Select the correct option)</span>
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {options.map((opt, oidx) => (
                  <div key={oidx} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => setOptions(options.map((o, i) => ({ ...o, is_correct: i === oidx })))}
                      style={{
                        width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${opt.is_correct ? "#22c55e" : "#cbd5e1"}`,
                        background: opt.is_correct ? "#22c55e" : "#fff",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                      }}
                      title="Mark as correct"
                    >
                      {opt.is_correct && <Check size={13} color="#ffffff" strokeWidth={3} />}
                    </button>
                    <span style={{ width: "22px", height: "22px", borderRadius: "6px", background: "#eef2ff", color: "#4f46e5", fontWeight: 800, fontSize: "0.78rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {String.fromCharCode(65 + oidx)}
                    </span>
                    <input
                      type="text"
                      placeholder={`Option ${String.fromCharCode(65 + oidx)}`}
                      value={opt.option_text}
                      onChange={(e) => {
                        const newOpts = [...options];
                        newOpts[oidx] = { ...newOpts[oidx], option_text: e.target.value };
                        setOptions(newOpts);
                      }}
                      className="input-field"
                      style={{ flex: 1, marginBottom: 0, background: opt.is_correct ? "#f0fdf4" : undefined, borderColor: opt.is_correct ? "#86efac" : undefined }}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newOpts = options.filter((_, i) => i !== oidx);
                          if (!newOpts.some((o) => o.is_correct)) newOpts[0].is_correct = true;
                          setOptions(newOpts);
                        }}
                        style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", padding: "0.4rem 0.5rem", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center" }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {options.length < 6 && (
                  <button
                    type="button"
                    onClick={() => setOptions([...options, { option_text: "", is_correct: false }])}
                    style={{ alignSelf: "flex-start", padding: "0.35rem 0.9rem", background: "#f8fafc", border: "1.5px dashed #cbd5e1", borderRadius: "7px", color: "#64748b", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", marginTop: "0.2rem" }}
                  >
                    + Add Option
                  </button>
                )}
              </div>
            </div>
          ) : (
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
          )}

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

      {/* Delete Question Confirmation Modal */}
      <Modal
        isOpen={Boolean(questionToDelete)}
        onClose={() => setQuestionToDelete(null)}
        title="Delete Question"
        subtitle="This action will permanently delete this question"
        icon={<Trash2 size={20} color="#ef4444" />}
        maxWidth="480px"
      >
        <div style={{ padding: "0.25rem 0" }}>
          <p style={{ fontSize: "0.95rem", color: "#1e293b", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
            Are you sure you want to delete this question?
          </p>

          <div style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            fontSize: "0.85rem",
            color: "#334155",
            marginBottom: "1rem",
            fontStyle: "italic"
          }}>
            &ldquo;{questionToDelete?.question_text}&rdquo;
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button
              type="button"
              onClick={() => setQuestionToDelete(null)}
              className="btn btn-secondary"
              disabled={deleteLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteQuestion}
              className="btn btn-danger"
              disabled={deleteLoading}
              style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}
            >
              <Trash2 size={15} />
              <span>{deleteLoading ? "Deleting..." : "Yes, Delete Question"}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuestionManagement;
