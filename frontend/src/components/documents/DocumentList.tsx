import React, { useEffect, useState } from 'react';
import { documentApi, InternDocument } from '../../services/documentApi';
import { FileText, Download, FileCheck, FileOutput, Loader2, Plus, Eye } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth'; // Assumed to exist for role checking
import { ConfirmModal } from '../common/ConfirmModal';
import toast from 'react-hot-toast';

interface DocumentListProps {
  internId: string;
}

const DocumentList: React.FC<DocumentListProps> = ({ internId }) => {
  const [documents, setDocuments] = useState<InternDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const { user } = useAuth(); // Assuming useAuth provides current user and role
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const isHR = user?.role === 'hr' || user?.role === 'admin';

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const docs = await documentApi.getInternDocuments(internId);
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [internId]);

  const handleGenerateCertificate = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Generate Certificate',
      message: 'Are you sure you want to generate a certificate for this intern?',
      onConfirm: async () => {
        try {
          setGenerating('CERTIFICATE');
          await documentApi.generateCertificate(internId);
          await fetchDocuments();
          toast.success('Certificate generated successfully!');
        } catch (error) {
          console.error('Failed to generate certificate:', error);
          toast.error('Failed to generate certificate.');
        } finally {
          setGenerating(null);
        }
      },
    });
  };

  const handleGenerateOfferLetter = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Generate Offer Letter',
      message: 'Are you sure you want to generate an offer letter for this intern?',
      onConfirm: async () => {
        try {
          setGenerating('OFFER_LETTER');
          await documentApi.generateOfferLetter(internId);
          await fetchDocuments();
          toast.success('Offer letter generated successfully!');
        } catch (error) {
          console.error('Failed to generate offer letter:', error);
          toast.error('Failed to generate offer letter.');
        } finally {
          setGenerating(null);
        }
      },
    });
  };

  const handleGenerateReport = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Generate Performance Report',
      message: 'Are you sure you want to generate a performance report for this intern?',
      onConfirm: async () => {
        try {
          setGenerating('PERFORMANCE_REPORT');
          await documentApi.generatePerformanceReport(internId);
          await fetchDocuments();
          toast.success('Performance report generated successfully!');
        } catch (error) {
          console.error('Failed to generate report:', error);
          toast.error('Failed to generate report.');
        } finally {
          setGenerating(null);
        }
      },
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'CERTIFICATE': return <FileCheck className="text-green-500 w-5 h-5" />;
      case 'OFFER_LETTER': return <FileOutput className="text-blue-500 w-5 h-5" />;
      case 'PERFORMANCE_REPORT': return <FileText className="text-purple-500 w-5 h-5" />;
      default: return <FileText className="text-gray-500 w-5 h-5" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="text-lg font-semibold text-gray-800">Generated Documents</h3>
        
        {isHR && (
          <div className="flex gap-2">
            <button
              onClick={handleGenerateOfferLetter}
              disabled={!!generating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              {generating === 'OFFER_LETTER' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Offer Letter
            </button>
            <button
              onClick={handleGenerateCertificate}
              disabled={!!generating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              {generating === 'CERTIFICATE' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Certificate
            </button>
            <button
              onClick={handleGenerateReport}
              disabled={!!generating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              {generating === 'PERFORMANCE_REPORT' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Report
            </button>
          </div>
        )}
      </div>

      <div className="p-0">
        {documents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>No documents have been generated yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                    {getIcon(doc.type)}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{doc.name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Generated on {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Preview Document"
                  >
                    <Eye className="w-5 h-5" />
                  </a>
                  <a
                    href={doc.url}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant="info"
        confirmLabel="Generate"
      />
    </div>
  );
};

export default DocumentList;
