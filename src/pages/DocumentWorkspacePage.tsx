import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { DocumentItem } from '../types';
import { AudioSpeaker } from '../components/AudioSpeaker';
import {
  FileText,
  Upload,
  Trash2,
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Info
} from 'lucide-react';

export const DocumentWorkspacePage: React.FC = () => {
  const { t, language } = useLanguage();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Upload Form State
  const [filename, setFilename] = useState('');
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Q&A State
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [answerResult, setAnswerResult] = useState<{
    answer: string;
    citations: Array<{ chunk_id: string; snippet: string }>;
    has_sufficient_evidence: boolean;
  } | null>(null);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await api.getDocuments();
      setDocuments(res.documents);
      if (res.documents.length > 0 && !selectedDocId) {
        setSelectedDocId(res.documents[0].id);
      }
    } catch (err) {
      console.error('Fetch docs error:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    setUploadSuccess('');
    if (!filename.trim() || !content.trim()) {
      setUploadError('Filename and content cannot be empty.');
      return;
    }

    setUploading(true);
    try {
      const res = await api.uploadDocument(filename.trim(), content.trim());
      setUploadSuccess(res.message);
      setFilename('');
      setContent('');
      await fetchDocuments();
      if (res.document?.id) {
        setSelectedDocId(res.document.id);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.deleteDocument(docId);
      if (selectedDocId === docId) {
        setSelectedDocId('');
        setAnswerResult(null);
      }
      fetchDocuments();
    } catch (err) {
      alert('Failed to delete document.');
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !question.trim() || asking) return;

    setAsking(true);
    setAnswerResult(null);
    try {
      const res = await api.askDocument(selectedDocId, question.trim(), language);
      setAnswerResult(res);
    } catch (err: any) {
      alert(err.message || 'Error processing question.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">{t('documents')}</h1>
        <p className="text-xs text-slate-500 mt-1">
          {language === 'hi'
            ? 'अपनी पाठ्य सामग्री, नोट्स या गाइड अपलोड करें और उद्धरणों सहित उत्तर प्राप्त करें।'
            : 'Upload notes, syllabus excerpts or past papers and ask grounded questions with source citations.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Upload & Document Library */}
        <div className="space-y-6">
          {/* Upload Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Upload className="w-4 h-4 text-teal-600" />
              <span>{language === 'hi' ? 'नया दस्तावेज़ जोड़ें' : 'Upload Study Material'}</span>
            </h3>

            {uploadError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">{uploadError}</p>
            )}
            {uploadSuccess && (
              <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">{uploadSuccess}</p>
            )}

            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Title / Chapter Name
                </label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="e.g. Science Chapter 4 Notes.txt"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Text Content / Notes
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste or type textbook chapter text or study notes here..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? 'Processing Chunks...' : 'Save & Index Document'}</span>
              </button>
            </form>
          </div>

          {/* Uploaded Documents List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">
              Your Indexed Documents ({documents.length})
            </h3>

            {loadingDocs ? (
              <p className="text-xs text-slate-400">Loading documents...</p>
            ) : documents.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => { setSelectedDocId(doc.id); setAnswerResult(null); }}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                      selectedDocId === doc.id
                        ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-2xs font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className={`w-4 h-4 shrink-0 ${selectedDocId === doc.id ? 'text-teal-600' : 'text-slate-400'}`} />
                      <div className="truncate">
                        <p className="text-xs font-bold truncate">{doc.filename}</p>
                        <p className="text-[10px] text-slate-500">{doc.total_chunks} chunks • {Math.round(doc.file_size / 1024)} KB</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col (2 Cols): Grounded Q&A Workspace */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                Grounded Retrieval Pipeline
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-2">
                {language === 'hi' ? 'दस्तावेज़ आधारित प्रश्न पूछें' : 'Ask Questions Grounded in Document'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                The AI will extract supporting excerpts from your selected document and cite evidence passages.
              </p>
            </div>

            {/* Document Selection Banner */}
            {selectedDocId ? (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">
                  Target Document: <span className="font-bold text-teal-700">{documents.find(d => d.id === selectedDocId)?.filename}</span>
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                  Indexed & Ready
                </span>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Please select or upload a document from the left panel first.</span>
              </div>
            )}

            {/* Question Input */}
            <form onSubmit={handleAsk} className="space-y-3">
              <div className="relative">
                <textarea
                  rows={3}
                  disabled={!selectedDocId || asking}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={
                    selectedDocId
                      ? (language === 'hi' ? 'इस दस्तावेज़ के बारे में प्रश्न पूछें...' : 'Ask a specific question about this document...')
                      : 'Select a document to begin...'
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden disabled:bg-slate-50"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedDocId || !question.trim() || asking}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50 ml-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{asking ? 'Searching & Grounding...' : 'Get Grounded Answer'}</span>
              </button>
            </form>

            {/* Answer Display */}
            {answerResult && (
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Grounded Answer</span>
                  </h3>
                  <AudioSpeaker text={answerResult.answer} />
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {answerResult.answer}
                </div>

                {/* Evidence Citations */}
                {answerResult.citations && answerResult.citations.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Retrieved Source Citations ({answerResult.citations.length})</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {answerResult.citations.map((c, i) => (
                        <div key={i} className="p-2.5 bg-teal-50/60 rounded-xl border border-teal-200/80 text-[11px] text-teal-950">
                          <span className="font-bold text-teal-700 block mb-0.5">Citation [{c.chunk_id}]:</span>
                          <span className="italic">{c.snippet}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
