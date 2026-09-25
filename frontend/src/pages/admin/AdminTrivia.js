import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, Search, Plus, Download, Trash2, Edit2, 
  Check, X, AlertTriangle, HelpCircle as HelpIcon, Filter, 
  TrendingUp, Award, BookOpen, ChevronDown, ChevronUp,
  Upload, FileJson, LayoutGrid
} from 'lucide-react';
import { toast } from 'sonner';
import { QUIZ_LEVELS, QUIZ_CATEGORIES } from '@/data/bibleQuizData';


const DIFFICULTY_CONFIGS = {
  easy: {
    color: 'from-emerald-500/20 to-teal-500/20',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10'
  },
  hard: {
    color: 'from-amber-500/20 to-orange-500/20',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/10'
  },
  expert: {
    color: 'from-rose-500/20 to-purple-500/20',
    borderColor: 'border-rose-500/30',
    textColor: 'text-rose-400',
    badgeBg: 'bg-rose-500/10'
  }
};

export default function AdminTrivia() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [diffFilter, setDiffFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  
  // Panels
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  // New question form state
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    difficulty: 'easy',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    answer: '',
    explanation: ''
  });

  // Edit question form state
  const [editForm, setEditForm] = useState({
    question: '',
    difficulty: 'easy',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    answer: '',
    explanation: ''
  });

  // Fetch Questions
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/trivia');
      setQuestions(Array.isArray(res.data.trivia) ? res.data.trivia : []);
    } catch (err) {
      toast.error('Failed to load trivia questions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Handle Input Changes for Add
  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setNewQuestion(prev => {
      const updated = { ...prev, [name]: value };
      // Keep correct answer updated to option if option was edited
      if (name === 'answer') {
        updated.answer = value;
      }
      return updated;
    });
  };

  // Handle Input Changes for Edit
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // Add Question Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const { question, difficulty, optionA, optionB, optionC, optionD, answer, explanation } = newQuestion;

    if (!question || !optionA || !optionB || !optionC || !optionD || !answer) {
      toast.error('Please fill out all required fields');
      return;
    }

    const options = [optionA, optionB, optionC, optionD];
    if (!options.includes(answer)) {
      toast.error('Correct answer must exactly match one of the four options');
      return;
    }

    try {
      const res = await api.post('/api/admin/trivia', {
        question,
        difficulty,
        options,
        answer,
        explanation
      });

      setQuestions(prev => [res.data, ...prev]);
      setNewQuestion({
        question: '',
        difficulty: 'easy',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        answer: '',
        explanation: ''
      });
      setShowAddPanel(false);
      toast.success('Successfully added new trivia question');
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Failed to create trivia question';
      toast.error(errMsg);
    }
  };

  // Delete Question
  const handleDelete = async (id, questionText) => {
    const confirmMessage = `Are you sure you want to delete this trivia question?\n\n"${questionText.substring(0, 60)}..."`;
    if (!window.confirm(confirmMessage)) return;

    try {
      await api.delete(`/api/admin/trivia/${id}`);
      setQuestions(prev => prev.filter(q => q._id !== id));
      toast.success('Question deleted successfully');
    } catch (err) {
      toast.error('Failed to delete question');
    }
  };

  // Start Editing
  const startEdit = (q) => {
    setEditingQuestionId(q._id);
    setEditForm({
      question: q.question,
      difficulty: q.difficulty,
      optionA: q.options[0] || '',
      optionB: q.options[1] || '',
      optionC: q.options[2] || '',
      optionD: q.options[3] || '',
      answer: q.answer,
      explanation: q.explanation || ''
    });
  };

  // Submit Edit
  const handleEditSubmit = async (e, id) => {
    e.preventDefault();
    const { question, difficulty, optionA, optionB, optionC, optionD, answer, explanation } = editForm;

    if (!question || !optionA || !optionB || !optionC || !optionD || !answer) {
      toast.error('Please fill out all required fields');
      return;
    }

    const options = [optionA, optionB, optionC, optionD];
    if (!options.includes(answer)) {
      toast.error('Correct answer must exactly match one of the four options');
      return;
    }

    try {
      const res = await api.put(`/api/admin/trivia/${id}`, {
        question,
        difficulty,
        options,
        answer,
        explanation
      });

      setQuestions(prev => prev.map(q => q._id === id ? res.data : q));
      setEditingQuestionId(null);
      toast.success('Trivia question updated successfully');
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Failed to update trivia question';
      toast.error(errMsg);
    }
  };

  // Export all questions as JSON download
  const downloadJSON = () => {
    if (questions.length === 0) {
      toast.error('No questions available to export');
      return;
    }
    const jsonContent = JSON.stringify(questions, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'bible_trivia_questions_export.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${questions.length} questions to JSON!`);
  };

  // Bulk import from JSON
  const handleBulkImport = async () => {
    try {
      const parsed = JSON.parse(bulkJson);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      let imported = 0;
      for (const item of items) {
        if (!item.question || !item.options || !item.answer) continue;
        try {
          await api.post('/api/admin/trivia', {
            question: item.question,
            difficulty: item.difficulty || 'easy',
            options: item.options,
            answer: item.answer,
            explanation: item.explanation || '',
            category: item.category || 'full_bible',
          });
          imported++;
        } catch (_) {}
      }
      toast.success(`Imported ${imported} questions`);
      setShowBulkImport(false);
      setBulkJson('');
      fetchQuestions();
    } catch (_) {
      toast.error('Invalid JSON format');
    }
  };

  // Download all trivia as CSV
  const downloadCSV = () => {
    if (questions.length === 0) {
      toast.error('No questions available to export');
      return;
    }

    // Prepare CSV header
    const headers = ['ID', 'Difficulty', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Explanation'];
    
    // Format rows
    const rows = questions.map(q => {
      return [
        q._id,
        q.difficulty,
        q.question,
        q.options[0] || '',
        q.options[1] || '',
        q.options[2] || '',
        q.options[3] || '',
        q.answer,
        q.explanation || ''
      ].map(val => {
        // Escape quotes and wrap in quotes
        const formatted = String(val).replace(/"/g, '""');
        return `"${formatted}"`;
      }).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'bible_trivia_questions_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${questions.length} questions to CSV!`);
  };

  // Filter and Search Logic
  const filteredQuestions = (Array.isArray(questions) ? questions : []).filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (q.explanation && q.explanation.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          q.options.some(o => o.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDiff = diffFilter === 'all' || q.difficulty === diffFilter;
    const matchesCat = catFilter === 'all' || q.category === catFilter;
    return matchesSearch && matchesDiff && matchesCat;
  });

  // Question counts per level+category
  const questionCounts = {};
  QUIZ_LEVELS.forEach(level => {
    questionCounts[level.id] = {};
    QUIZ_CATEGORIES.forEach(cat => {
      questionCounts[level.id][cat.id] = questions.filter(q => q.difficulty === level.id && q.category === cat.id).length;
    });
    questionCounts[level.id]._total = questions.filter(q => q.difficulty === level.id).length;
  });

  // Calculate difficulty counts
  const easyCount = questions.filter(q => q.difficulty === 'easy').length;
  const hardCount = questions.filter(q => q.difficulty === 'hard').length;
  const expertCount = questions.filter(q => q.difficulty === 'expert').length;

  return (
    <div className="space-y-6" data-testid="admin-trivia-page">
      {/* Upper Title Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Trivia Management
          </h1>
          <p className="text-xs text-slate-400">
            Audit, edit, expand, and export the live Scripture Trivia databank.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold transition-all duration-200"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={downloadJSON}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl text-xs font-bold transition-all duration-200"
          >
            <FileJson size={14} />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => setShowBulkImport(!showBulkImport)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-xl text-xs font-bold transition-all duration-200"
          >
            <Upload size={14} />
            <span>Bulk Import</span>
          </button>
          <button
            onClick={() => {
              setShowAddPanel(!showAddPanel);
              setEditingQuestionId(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black transition-all duration-200"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Stats Cards - Level+Category Matrix */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {QUIZ_LEVELS.map(level => (
            <div key={level.id} className="bg-slate-900/40 border border-white/[0.04] p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{level.icon}</span>
                <span className="text-[10px] uppercase font-black tracking-wider" style={{ color: level.color }}>{level.label}</span>
              </div>
              <span className="text-2xl font-black text-white">{questionCounts[level.id]?._total || 0}</span>
              <span className="text-[10px] text-slate-500 ml-1">total</span>
              <div className="mt-2 grid grid-cols-2 gap-1">
                {QUIZ_CATEGORIES.map(cat => (
                  <div key={cat.id} className="text-[9px] text-slate-400 flex justify-between">
                    <span>{cat.abbr}</span>
                    <span className="font-bold" style={{ color: cat.color }}>{questionCounts[level.id]?.[cat.id] || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Question Panel */}
      <AnimatePresence>
        {showAddPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAddSubmit} className="bg-slate-900/60 border border-white/[0.05] p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-center border-b border-white/[0.05] pb-3 mb-2">
                <h3 className="text-sm font-black uppercase text-slate-200 tracking-wider">Add New Bible Question</h3>
                <button 
                  type="button" 
                  onClick={() => setShowAddPanel(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-400 font-bold mb-1">Question Text *</label>
                  <input
                    type="text"
                    name="question"
                    value={newQuestion.question}
                    onChange={handleAddChange}
                    required
                    placeholder="e.g. How many people were on Noah's Ark?"
                    className="w-full px-4 py-2.5 bg-[#0f172a]/60 border border-white/[0.08] rounded-xl text-sm focus:border-amber-400/50 outline-none text-white transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-bold mb-1">Difficulty *</label>
                  <select
                    name="difficulty"
                    value={newQuestion.difficulty}
                    onChange={handleAddChange}
                    required
                    className="w-full px-4 py-2.5 bg-[#0f172a]/60 border border-white/[0.08] rounded-xl text-sm focus:border-amber-400/50 outline-none text-white transition-all duration-200"
                  >
                    <option value="easy">Easy</option>
                    <option value="hard">Hard</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-bold mb-1">Option A *</label>
                  <input
                    type="text"
                    name="optionA"
                    value={newQuestion.optionA}
                    onChange={handleAddChange}
                    required
                    placeholder="First option option text"
                    className="w-full px-4 py-2.5 bg-[#0f172a]/60 border border-white/[0.08] rounded-xl text-sm focus:border-amber-400/50 outline-none text-white transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-bold mb-1">Option B *</label>
                  <input
                    type="text"
                    name="optionB"
                    value={newQuestion.optionB}
                    onChange={handleAddChange}
                    required
                    placeholder="Second option option text"
                    className="w-full px-4 py-2.5 bg-[#0f172a]/60 border border-white/[0.08] rounded-xl text-sm focus:border-amber-400/50 outline-none text-white transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-bold mb-1">Option C *</label>
                  <input
                    type="text"
                    name="optionC"
                    value={newQuestion.optionC}
                    onChange={handleAddChange}
                    required
                    placeholder="Third option option text"
                    className="w-full px-4 py-2.5 bg-[#0f172a]/60 border border-white/[0.08] rounded-xl text-sm focus:border-amber-400/50 outline-none text-white transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-bold mb-1">Option D *</label>
                  <input
                    type="text"
                    name="optionD"
                    value={newQuestion.optionD}
                    onChange={handleAddChange}
                    required
                    placeholder="Fourth option option text"
                    className="w-full px-4 py-2.5 bg-[#0f172a]/60 border border-white/[0.08] rounded-xl text-sm focus:border-amber-400/50 outline-none text-white transition-all duration-200"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-bold mb-1">Correct Answer *</label>
                  <select
                    name="answer"
                    value={newQuestion.answer}
                    onChange={handleAddChange}
                    required
                    className="w-full px-4 py-2.5 bg-[#0f172a]/60 border border-white/[0.08] rounded-xl text-sm focus:border-amber-400/50 outline-none text-white transition-all duration-200"
                  >
                    <option value="">-- Choose option --</option>
                    {newQuestion.optionA && <option value={newQuestion.optionA}>{newQuestion.optionA} (Option A)</option>}
                    {newQuestion.optionB && <option value={newQuestion.optionB}>{newQuestion.optionB} (Option B)</option>}
                    {newQuestion.optionC && <option value={newQuestion.optionC}>{newQuestion.optionC} (Option C)</option>}
                    {newQuestion.optionD && <option value={newQuestion.optionD}>{newQuestion.optionD} (Option D)</option>}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-400 font-bold mb-1">Context / Explanation (Optional)</label>
                  <input
                    type="text"
                    name="explanation"
                    value={newQuestion.explanation}
                    onChange={handleAddChange}
                    placeholder="e.g. Genesis 7:13 states that Noah, his wife, his sons, and their wives entered..."
                    className="w-full px-4 py-2.5 bg-[#0f172a]/60 border border-white/[0.08] rounded-xl text-sm focus:border-amber-400/50 outline-none text-white transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPanel(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-black text-xs uppercase"
                >
                  Create Trivia
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Import Panel */}
      <AnimatePresence>
        {showBulkImport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-900/60 border border-purple-500/20 p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-center border-b border-white/[0.05] pb-3 mb-2">
                <h3 className="text-sm font-black uppercase text-purple-300 tracking-wider flex items-center gap-2">
                  <Upload size={14} /> Bulk Import Questions (JSON)
                </h3>
                <button type="button" onClick={() => setShowBulkImport(false)} className="text-slate-400 hover:text-slate-200">
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs text-slate-400">Paste a JSON array of question objects. Each must have: question, options (array), answer, difficulty (beginners|intermediate|skilled|expert), category (full_bible|new_testament|old_testament|apologetics), explanation (optional).</p>
              <textarea
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
                className="w-full h-48 px-4 py-3 bg-[#0f172a]/60 border border-white/[0.08] rounded-xl text-xs font-mono focus:border-purple-400/50 outline-none text-white transition-all"
                placeholder='[\n  {\n    "question": "Who wrote Genesis?",\n    "options": ["Moses", "Abraham", "David", "Paul"],\n    "answer": "Moses",\n    "difficulty": "beginners",\n    "category": "old_testament",\n    "explanation": "Tradition attributes Genesis to Moses."\n  }\n]'
              />
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => { setShowBulkImport(false); setBulkJson(''); }} className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-bold text-xs uppercase">Cancel</button>
                <button type="button" onClick={handleBulkImport} className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-black text-xs uppercase">Import</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Search controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Level Filter Pills */}
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/[0.04] self-start md:self-auto shrink-0">
          {[{ id: 'all', label: 'All' }, ...QUIZ_LEVELS.map(l => ({ id: l.id, label: `${l.icon} ${l.label}` }))].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setDiffFilter(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                diffFilter === id
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Category Filter Pills */}
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/[0.04] self-start md:self-auto shrink-0">
          {[{ id: 'all', label: 'All' }, ...QUIZ_CATEGORIES.map(c => ({ id: c.id, label: c.label }))].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setCatFilter(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                catFilter === id
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search questions, options, or context..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2 bg-slate-900/60 border border-white/[0.04] rounded-xl text-xs text-white focus:outline-none focus:border-amber-400/40"
          />
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400" />
            <span className="text-xs text-slate-400 mt-4">Retrieving active questions...</span>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/20 border border-white/[0.03] rounded-3xl">
            <HelpIcon size={36} className="text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 font-bold text-sm">No Scripture Questions Found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or adding a new question.</p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const isEditing = editingQuestionId === q._id;
            const cfg = DIFFICULTY_CONFIGS[q.difficulty] || DIFFICULTY_CONFIGS.easy;

            if (isEditing) {
              return (
                <motion.div key={q._id} layout className="bg-slate-900/80 border border-amber-400/40 p-6 rounded-3xl space-y-4">
                  <form onSubmit={(e) => handleEditSubmit(e, q._id)} className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                      <span className="text-xs font-black text-amber-400 uppercase tracking-wider">Editing Question</span>
                      <button 
                        type="button" 
                        onClick={() => setEditingQuestionId(null)}
                        className="text-slate-400 hover:text-slate-200 text-xs"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs text-slate-400 font-bold mb-1">Question Text</label>
                        <input
                          type="text"
                          name="question"
                          value={editForm.question}
                          onChange={handleEditChange}
                          required
                          className="w-full px-4 py-2 bg-[#0f172a]/80 border border-white/[0.08] rounded-xl text-sm focus:border-amber-400 outline-none text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 font-bold mb-1">Difficulty</label>
                        <select
                          name="difficulty"
                          value={editForm.difficulty}
                          onChange={handleEditChange}
                          required
                          className="w-full px-4 py-2 bg-[#0f172a]/80 border border-white/[0.08] rounded-xl text-sm focus:border-amber-400 outline-none text-white"
                        >
                          <option value="easy">Easy</option>
                          <option value="hard">Hard</option>
                          <option value="expert">Expert</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 font-bold mb-1">Option A</label>
                        <input
                          type="text"
                          name="optionA"
                          value={editForm.optionA}
                          onChange={handleEditChange}
                          required
                          className="w-full px-4 py-2 bg-[#0f172a]/80 border border-white/[0.08] rounded-xl text-sm focus:border-amber-400 outline-none text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 font-bold mb-1">Option B</label>
                        <input
                          type="text"
                          name="optionB"
                          value={editForm.optionB}
                          onChange={handleEditChange}
                          required
                          className="w-full px-4 py-2 bg-[#0f172a]/80 border border-white/[0.08] rounded-xl text-sm focus:border-amber-400 outline-none text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 font-bold mb-1">Option C</label>
                        <input
                          type="text"
                          name="optionC"
                          value={editForm.optionC}
                          onChange={handleEditChange}
                          required
                          className="w-full px-4 py-2 bg-[#0f172a]/80 border border-white/[0.08] rounded-xl text-sm focus:border-amber-400 outline-none text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 font-bold mb-1">Option D</label>
                        <input
                          type="text"
                          name="optionD"
                          value={editForm.optionD}
                          onChange={handleEditChange}
                          required
                          className="w-full px-4 py-2 bg-[#0f172a]/80 border border-white/[0.08] rounded-xl text-sm focus:border-amber-400 outline-none text-white"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 font-bold mb-1">Correct Answer</label>
                        <select
                          name="answer"
                          value={editForm.answer}
                          onChange={handleEditChange}
                          required
                          className="w-full px-4 py-2 bg-[#0f172a]/80 border border-white/[0.08] rounded-xl text-sm focus:border-amber-400 outline-none text-white"
                        >
                          <option value="">-- Choose correct --</option>
                          {editForm.optionA && <option value={editForm.optionA}>{editForm.optionA} (Option A)</option>}
                          {editForm.optionB && <option value={editForm.optionB}>{editForm.optionB} (Option B)</option>}
                          {editForm.optionC && <option value={editForm.optionC}>{editForm.optionC} (Option C)</option>}
                          {editForm.optionD && <option value={editForm.optionD}>{editForm.optionD} (Option D)</option>}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-slate-400 font-bold mb-1">Explanation / Context</label>
                        <input
                          type="text"
                          name="explanation"
                          value={editForm.explanation}
                          onChange={handleEditChange}
                          className="w-full px-4 py-2 bg-[#0f172a]/80 border border-white/[0.08] rounded-xl text-sm focus:border-amber-400 outline-none text-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingQuestionId(null)}
                        className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-bold text-xs uppercase"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-black text-xs uppercase"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={q._id}
                layout
                className="bg-slate-900/40 border border-white/[0.04] hover:border-white/[0.08] p-6 rounded-2xl transition-all duration-200"
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="space-y-3 flex-1">
                    {/* Header line with difficulty */}
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${cfg.badgeBg} ${cfg.textColor}`}>
                        {q.difficulty}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">ID: {q._id}</span>
                    </div>

                    {/* Question */}
                    <h3 className="text-sm font-bold text-slate-100 leading-relaxed">
                      {q.question}
                    </h3>

                    {/* Options list */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 max-w-2xl">
                      {q.options && q.options.map((opt, oIdx) => {
                        const isCorrect = opt === q.answer;
                        return (
                          <div 
                            key={oIdx} 
                            className={`px-3 py-1.5 rounded-lg border text-xs flex items-center justify-between ${
                              isCorrect 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold' 
                                : 'bg-[#0f172a]/40 border-white/[0.03] text-slate-400'
                            }`}
                          >
                            <span>{opt}</span>
                            {isCorrect && <Check size={12} className="text-emerald-400" />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <p className="text-xs text-slate-500 bg-[#0f172a]/20 p-2.5 rounded-lg border border-white/[0.02] mt-2">
                        <span className="text-slate-400 font-bold block mb-0.5">Explanation</span>
                        {q.explanation}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col items-center gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 border-white/[0.05] pt-3 md:pt-0 justify-end">
                    <button
                      onClick={() => startEdit(q)}
                      className="p-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.05] text-slate-300 hover:text-white rounded-xl transition-all duration-200"
                      title="Edit question"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(q._id, q.question)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl transition-all duration-200"
                      title="Delete question"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
