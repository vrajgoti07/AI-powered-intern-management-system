import React, { useState, useEffect, useRef } from 'react';
import { fetchDocuments, uploadDocument, deleteDocument } from '../../../services/mentorDetailsApi';
import type { MentorDocumentData } from '../../../types';
import { Upload, FileText, Trash2, Download, Eye, Loader2, File, FileImage, X } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import toast from 'react-hot-toast';

interface Props {
  mentorId: string;
}

const FILE_TYPES = [
  { value: 'resume', label: 'Resume', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { value: 'certificate', label: 'Certificate', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { value: 'id_proof', label: 'ID Proof', color: 'bg-violet-50 text-violet-600 border-violet-100' },
  { value: 'offer_letter', label: 'Offer Letter', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { value: 'performance_report', label: 'Performance Report', color: 'bg-pink-50 text-pink-600 border-pink-100' },
];

const getFileTypeColor = (type: string) => {
  return FILE_TYPES.find(t => t.value === type)?.color || 'bg-slate-50 text-slate-500 border-slate-200';
};

const getFileTypeLabel = (type: string) => {
  return FILE_TYPES.find(t => t.value === type)?.label || type;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const MentorDocuments: React.FC<Props> = ({ mentorId }) => {
  const [documents, setDocuments] = useState<MentorDocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState<MentorDocumentData | null>(null);
  const [previewDoc, setPreviewDoc] = useState<MentorDocumentData | null>(null);
  const [selectedFileType, setSelectedFileType] = useState('certificate');
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, [mentorId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await fetchDocuments(mentorId);
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      await uploadDocument(mentorId, file, selectedFileType);
      toast.success(`"${file.name}" uploaded successfully`);
      await loadDocuments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    try {
      setDeleting(true);
      await deleteDocument(mentorId, docToDelete.id);
      toast.success('Document deleted');
      setShowDeleteModal(false);
      setDocToDelete(null);
      await loadDocuments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const isImageOrPdf = (url: string) => {
    const cleanUrl = url.split('?')[0].toLowerCase();
    return (
      cleanUrl.endsWith('.pdf') ||
      cleanUrl.endsWith('.jpg') ||
      cleanUrl.endsWith('.jpeg') ||
      cleanUrl.endsWith('.png') ||
      cleanUrl.endsWith('.gif') ||
      cleanUrl.endsWith('.webp')
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Upload Area */}
      <div className="bg-gradient-to-br from-indigo-50/50 to-violet-50/50 rounded-2xl border-2 border-dashed border-indigo-200 p-6 text-center">
        <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
        <p className="text-xs font-bold text-slate-600 mb-1">Upload Document</p>
        <p className="text-[10px] text-slate-400 mb-3">PDF, JPG, PNG, DOC — Max 10MB</p>

        <div className="flex items-center justify-center gap-3 mb-3">
          <select
            value={selectedFileType}
            onChange={(e) => setSelectedFileType(e.target.value)}
            className="text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {FILE_TYPES.map(ft => (
              <option key={ft.value} value={ft.value}>{ft.label}</option>
            ))}
          </select>

          <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md cursor-pointer">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? 'Uploading...' : 'Choose File'}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-400">No documents uploaded</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  {/\.(jpg|jpeg|png|gif|webp)$/i.test(doc.fileUrl.split('?')[0]) ? (
                    <FileImage className="w-5 h-5 text-indigo-400" />
                  ) : (
                    <File className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">{doc.fileName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold rounded-full border ${getFileTypeColor(doc.fileType)}`}>
                      {getFileTypeLabel(doc.fileType)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{formatFileSize(doc.fileSize)}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-50">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3" /> Download
                </a>
                {isImageOrPdf(doc.fileUrl) && (
                  <button
                    onClick={() => { setPreviewDoc(doc); setShowPreviewModal(true); }}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye className="w-3 h-3" /> Preview
                  </button>
                )}
                <button
                  onClick={() => { setDocToDelete(doc); setShowDeleteModal(true); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Modal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} title={previewDoc?.fileName || 'Preview'}>
        {previewDoc && (
          <div className="max-h-[70vh] overflow-auto">
            {/\.(jpg|jpeg|png|gif|webp)$/i.test(previewDoc.fileUrl.split('?')[0]) ? (
              <img src={previewDoc.fileUrl} alt={previewDoc.fileName} className="w-full rounded-xl" />
            ) : (
              <iframe src={previewDoc.fileUrl} className="w-full h-[60vh] rounded-xl border border-slate-200" title="Document Preview" />
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Document">
        <div className="space-y-4 text-left">
          <p className="text-xs text-slate-600">
            Are you sure you want to delete <strong>"{docToDelete?.fileName}"</strong>? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Document'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
