import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Shield, CheckCircle, XCircle, User, MapPin, Calendar, Church, FileText, Loader2 } from 'lucide-react';
import apiClient from '@/services/api';

interface VerifyResult {
  valid: boolean;
  message?: string;
  certificateNumber?: string;
  candidateName?: string;
  baptismDate?: string;
  location?: string;
  churchName?: string;
  districtName?: string;
  officiatingPastor?: string;
  certificateSigned?: boolean;
  signedAt?: string;
  issuedOn?: string;
}

async function verifyCertificate(certNumber: string): Promise<VerifyResult> {
  const response = await apiClient.get(`/api/certificates/verify/${certNumber}`);
  return response.data;
}

export default function CertificateVerifyPage() {
  const { certNumber: urlCertNumber } = useParams<{ certNumber: string }>();
  const [inputCertNumber, setInputCertNumber] = useState(urlCertNumber || '');
  const [activeCertNumber, setActiveCertNumber] = useState(urlCertNumber || '');

  const { data: result, isLoading, error } = useQuery({
    queryKey: ['verify-certificate', activeCertNumber],
    queryFn: () => verifyCertificate(activeCertNumber),
    enabled: !!activeCertNumber,
    retry: false,
  });

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCertNumber.trim()) {
      setActiveCertNumber(inputCertNumber.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Certificate Verification</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Verify the authenticity of a baptism certificate</p>
        </div>

        {/* Search Form */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
          <form onSubmit={handleVerify}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Certificate Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputCertNumber}
                onChange={(e) => setInputCertNumber(e.target.value)}
                placeholder="Enter certificate number (e.g., CERT-0B681D4C)"
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={!inputCertNumber.trim() || isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Verify
              </button>
            </div>
          </form>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Verifying certificate...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-500" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-400">Verification Failed</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Unable to verify certificate. Please check the number and try again.</p>
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {result && !isLoading && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
            {/* Status Header */}
            <div className={`p-4 ${result.valid ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              <div className="flex items-center gap-3">
                {result.valid ? (
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                )}
                <div>
                  <p className={`font-bold ${result.valid ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                    {result.valid ? 'Certificate Valid' : 'Certificate Not Found'}
                  </p>
                  {result.message && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">{result.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Certificate Details */}
            {result.valid && (
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Certificate Number</p>
                    <p className="font-medium text-slate-900 dark:text-white">{result.certificateNumber}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Candidate Name</p>
                    <p className="font-medium text-slate-900 dark:text-white">{result.candidateName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Baptism Date</p>
                    <p className="font-medium text-slate-900 dark:text-white">{result.baptismDate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Location</p>
                    <p className="font-medium text-slate-900 dark:text-white">{result.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Church className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Church</p>
                    <p className="font-medium text-slate-900 dark:text-white">{result.churchName}</p>
                    {result.districtName && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{result.districtName}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Officiating Pastor</p>
                    <p className="font-medium text-slate-900 dark:text-white">{result.officiatingPastor}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Status:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      result.certificateSigned
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {result.certificateSigned ? 'Signed' : 'Pending Signature'}
                    </span>
                  </div>
                  {result.signedAt && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Signed At:</span>
                      <span className="text-sm text-slate-900 dark:text-white">{result.signedAt}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
