import React, { useState } from "react";
import {
  X,
  FileCode2,
  Terminal,
  Save,
  Download,
  Trash2,
  History,
  CheckCircle2,
  Layers,
  Sparkles,
  Tag,
} from "lucide-react";
import { LispItem } from "../types";
import { LispCodeViewer } from "./LispCodeViewer";
import { downloadLispFile, formatStandardLispFileName } from "../utils/lispUtils";

interface ViewLispModalProps {
  lisp: LispItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateLisp: (updatedLisp: LispItem) => void;
  onOpenVersionControl: (lisp: LispItem) => void;
}

export const ViewLispModal: React.FC<ViewLispModalProps> = ({
  lisp,
  isOpen,
  onClose,
  onUpdateLisp,
  onOpenVersionControl,
}) => {
  if (!isOpen || !lisp) return null;

  const [currentCode, setCurrentCode] = useState(lisp.code);
  const [currentCommand, setCurrentCommand] = useState(lisp.commandName);
  const [currentTitle, setCurrentTitle] = useState(lisp.title);
  const [currentDesc, setCurrentDesc] = useState(lisp.description);
  const [isSaved, setIsSaved] = useState(false);

  const handleCodeChange = (newCode: string, newCommand: string) => {
    setCurrentCode(newCode);
    setCurrentCommand(newCommand);
  };

  const handleSave = () => {
    const updated: LispItem = {
      ...lisp,
      title: currentTitle,
      commandName: currentCommand,
      description: currentDesc,
      code: currentCode,
      updatedAt: Date.now(),
    };
    onUpdateLisp(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-700 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
              <FileCode2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={currentTitle}
                  onChange={(e) => setCurrentTitle(e.target.value)}
                  className="font-bold text-base text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-red-500 focus:outline-none bg-transparent px-1"
                />
                <span className="rounded bg-red-100 text-red-700 text-xs font-mono font-bold px-2 py-0.5">
                  {currentCommand}
                </span>
              </div>
              <p className="text-xs text-slate-500">{lisp.category} - {lisp.compatibleCAD}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenVersionControl(lisp)}
              className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-red-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition"
            >
              <History className="h-4 w-4 text-red-500" />
              <span>Lịch sử phiên bản ({lisp.versions?.length || 1})</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaved}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                isSaved
                  ? "bg-emerald-600 text-white"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Đã lưu</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Description field */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Mô tả công năng Lisp:</label>
            <textarea
              value={currentDesc}
              onChange={(e) => setCurrentDesc(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* Usage Steps */}
          {lisp.steps && lisp.steps.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-red-600" />
                <span>Các bước thực hiện trong AutoCAD:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                {lisp.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="h-4 w-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Code Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Mã nguồn AutoLISP (Có thể chỉnh sửa & đổi tên lệnh trực tiếp):
              </label>
            </div>
            <LispCodeViewer
              code={currentCode}
              commandName={currentCommand}
              title={currentTitle}
              onCodeChange={handleCodeChange}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500">
          <span>Tác giả: {lisp.author || "Kỹ sư"} | Tạo lúc: {new Date(lisp.createdAt).toLocaleDateString("vi-VN")}</span>
          <button
            onClick={() =>
              downloadLispFile(currentCommand, currentCode, currentTitle)
            }
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <Download className="h-4 w-4 text-red-400" />
            <span>Xuất {formatStandardLispFileName(currentCommand, currentTitle)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
