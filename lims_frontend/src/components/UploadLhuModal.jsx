import React, { useState, useRef } from "react";
import {
  X,
  UploadCloud,
  FileType,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../api/axios";

export default function UploadLhuModal({
  registrationId,
  noReg,
  onClose,
  onSuccess,
}) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Format file tidak valid. Gunakan PDF, DOC/X, atau XLS/X.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB.");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // API request menggunakan multipart/form-data
      const res = await api.post(
        `/registrations/${registrationId}/upload-lhu`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (res.data.success) {
        toast.success("LHU Custom berhasil diunggah!");
        onSuccess(res.data.data.link_hasil);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Gagal mengunggah dokumen");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in print:hidden">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-cyan-50/50">
          <div>
            <h3 className="font-bold text-cyan-900 flex items-center gap-2">
              <UploadCloud size={18} className="text-cyan-600" />
              Upload LHU Custom
            </h3>
            <p className="text-[11px] text-cyan-700 font-mono mt-1">
              Ref: {noReg}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 rounded-xl transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="bg-blue-50 text-blue-700 p-3 rounded-xl text-xs font-medium border border-blue-100 flex items-start gap-2 mb-6">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p>
              Upload dokumen hasil uji dari instansi. File ini akan menggantikan
              auto-generate PDF sistem untuk pasien ini.
            </p>
          </div>

          <div
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              isDragging
                ? "border-cyan-500 bg-cyan-50"
                : file
                  ? "border-emerald-300 bg-emerald-50/50"
                  : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
            />

            {file ? (
              <div className="flex flex-col items-center gap-3 animate-fade-in">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                  <CheckCircle2 size={30} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 line-clamp-1 break-all">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="text-xs font-bold text-red-500 hover:text-red-700 mt-2"
                >
                  Ganti File
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 pointer-events-none">
                <div className="w-14 h-14 bg-white shadow-sm border border-gray-200 text-gray-400 rounded-full flex items-center justify-center">
                  <FileType size={26} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700">
                    Pilih atau Tarik file ke sini
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    PDF, DOC, DOCX, XLS, XLSX (Maks. 10MB)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="px-6 py-2.5 bg-cyan-600 text-white text-sm font-bold rounded-xl shadow-md shadow-cyan-200 hover:bg-cyan-700 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Mengunggah...
              </>
            ) : (
              <>
                <UploadCloud size={16} /> Unggah LHU
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
