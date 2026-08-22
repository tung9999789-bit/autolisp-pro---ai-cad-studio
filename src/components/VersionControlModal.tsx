import React, { useState } from "react";
import {
  History,
  X,
  GitCommit,
  RotateCcw,
  Plus,
  ArrowRight,
  GitCompare,
  FileCode2,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  Download,
} from "lucide-react";
import { LispItem, LispVersion } from "../types";
import { computeLineDiff } from "../utils/diffUtils";
import { downloadLispFile } from "../utils/lispUtils";

interface VersionControlModalProps {
  lisp: LispItem;
  isOpen: boolean;
  onClose: () => void;
  onRollback: (lispId: string, version: LispVersion) => void;
  onCreateNewVersion: (
    lispId: string,
    newCode: string,
    changelog: string,
    commandName: string
  ) => void;
}

export const VersionControlModal: React.FC<VersionControlModalProps> = ({
  lisp,
  isOpen,
  onClose,
  onRollback,
  onCreateNewVersion,
}) => {
  const [selectedVersionForDiff, setSelectedVersionForDiff] =
    useState<LispVersion | null>(null);
  const [isCreatingCommit, setIsCreatingCommit] = useState(false);
  const [newChangelog, setNewChangelog] = useState("");
  const [newCommitCode, setNewCommitCode] = useState(lisp.code);
  const [diffMode, setDiffMode] = useState<"unified" | "side-by-side">(
    "unified"
  );

  if (!isOpen) return null;

  const versions = lisp.versions || [];
  const currentVersion =
    versions.length > 0 ? versions[versions.length - 1] : null;

  const handleSaveCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChangelog.trim()) return;

    onCreateNewVersion(
      lisp.id,
      newCommitCode,
      newChangelog.trim(),
      lisp.commandName
    );
    setIsCreatingCommit(false);
    setNewChangelog("");
  };

  const diffLines = selectedVersionForDiff
    ? computeLineDiff(selectedVersionForDiff.code, lisp.code)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-700 bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Quản Lý Phiên Bản Mã Nguồn & Bảo Mật: {lisp.title}
                </h2>
                <span className="rounded bg-red-100 text-red-700 text-xs font-mono font-bold px-2 py-0.5">
                  {lisp.commandName}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Hệ thống Version Control & Rollback lưu giữ lịch sử sửa đổi mã an toàn tuyệt đối.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left Column: Version Commits Timeline */}
          <div className="md:col-span-4 border-r border-slate-200 bg-slate-50/50 p-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Lịch sử phiên bản ({versions.length})
              </h3>
              <button
                onClick={() => {
                  setNewCommitCode(lisp.code);
                  setIsCreatingCommit(!isCreatingCommit);
                }}
                className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tạo bản mới</span>
              </button>
            </div>

            {/* Create new commit form */}
            {isCreatingCommit && (
              <form
                onSubmit={handleSaveCommit}
                className="rounded-xl border border-red-200 bg-white p-3.5 shadow-sm space-y-2.5 animate-in slide-in-from-top-2"
              >
                <div className="text-xs font-bold text-slate-800">
                  Ghi chú thay đổi (Commit changelog):
                </div>
                <input
                  type="text"
                  value={newChangelog}
                  onChange={(e) => setNewChangelog(e.target.value)}
                  placeholder="VD: Cập nhật hàm entmake tăng tốc 50%..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCommit(false)}
                    className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!newChangelog.trim()}
                    className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Lưu Commit
                  </button>
                </div>
              </form>
            )}

            {/* Version List */}
            <div className="space-y-3 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {versions.map((ver, idx) => {
                const isLatest = idx === versions.length - 1;
                const isSelected = selectedVersionForDiff?.versionId === ver.versionId;

                return (
                  <div
                    key={ver.versionId || idx}
                    className={`relative pl-8 text-xs transition`}
                  >
                    {/* Timeline bullet */}
                    <span
                      className={`absolute left-2.5 top-1.5 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 bg-white ${
                        isLatest
                          ? "border-red-600 bg-red-600 ring-4 ring-red-100"
                          : "border-slate-400"
                      }`}
                    />

                    <div
                      className={`rounded-xl border p-3 transition space-y-2 ${
                        isSelected
                          ? "border-red-400 bg-red-50/50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 font-mono">
                            {ver.versionNumber}
                          </span>
                          {isLatest && (
                            <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2">
                              Bản hiện hành
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ver.timestamp).toLocaleDateString("vi-VN")}
                        </span>
                      </div>

                      <p className="text-slate-600 font-medium leading-relaxed">
                        {ver.changelog || "Không có ghi chú"}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {ver.author || "Kỹ sư"}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedVersionForDiff(ver)}
                            className="text-red-600 hover:underline font-bold text-[11px]"
                          >
                            So sánh Diff
                          </button>

                          {!isLatest && (
                            <button
                              onClick={() => onRollback(lisp.id, ver)}
                              title="Khôi phục lại mã nguồn ở phiên bản này"
                              className="flex items-center gap-0.5 text-amber-600 hover:text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold"
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span>Rollback</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Diff Comparison Viewer */}
          <div className="md:col-span-8 flex flex-col bg-slate-950 text-slate-200 overflow-hidden">
            {/* Diff Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-red-400" />
                <span className="font-bold text-slate-200">
                  {selectedVersionForDiff
                    ? `So Sánh Mã: ${selectedVersionForDiff.versionNumber} ➔ Bản hiện hành (${currentVersion?.versionNumber})`
                    : `Xem mã nguồn bản hiện hành (${currentVersion?.versionNumber})`}
                </span>
              </div>

              {selectedVersionForDiff && (
                <button
                  onClick={() => setSelectedVersionForDiff(null)}
                  className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
                >
                  Đóng so sánh Diff
                </button>
              )}
            </div>

            {/* Diff Code Container */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs">
              {selectedVersionForDiff ? (
                <div className="table w-full border-collapse">
                  {diffLines.map((line, idx) => {
                    let rowBg = "hover:bg-slate-800/40";
                    let textClass = "text-slate-300";
                    let sign = " ";

                    if (line.type === "added") {
                      rowBg = "bg-emerald-950/40 hover:bg-emerald-900/50";
                      textClass = "text-emerald-300 font-bold";
                      sign = "+";
                    } else if (line.type === "removed") {
                      rowBg = "bg-red-950/40 hover:bg-red-900/50";
                      textClass = "text-red-400 line-through opacity-80";
                      sign = "-";
                    }

                    return (
                      <div key={idx} className={`table-row leading-5 ${rowBg}`}>
                        <span className="table-cell select-none pr-3 text-right text-slate-600 w-10">
                          {line.oldLineNumber || ""}
                        </span>
                        <span className="table-cell select-none pr-3 text-right text-slate-600 w-10">
                          {line.newLineNumber || ""}
                        </span>
                        <span className="table-cell select-none pr-2 text-center text-slate-500 w-6">
                          {sign}
                        </span>
                        <span className={`table-cell whitespace-pre ${textClass}`}>
                          {line.content}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-slate-400 text-xs italic mb-2">
                    ; Chọn một phiên bản ở cột bên trái và nhấn "So sánh Diff" để đối chiếu chi tiết từng dòng mã thay đổi.
                  </p>
                  <pre className="text-slate-300 whitespace-pre overflow-x-auto">
                    {lisp.code}
                  </pre>
                </div>
              )}
            </div>

            {/* Footer summary */}
            <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/90 px-4 py-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Bảo mật mã nguồn: Không chứa lệnh gọi shell nguy hại, cô lập biến cục bộ an toàn.</span>
              </div>
              <button
                onClick={() =>
                  downloadLispFile(
                    `${lisp.commandName.toLowerCase()}_${currentVersion?.versionNumber || "v1"}.lsp`,
                    lisp.code
                  )
                }
                className="flex items-center gap-1 rounded bg-red-600 px-2.5 py-1 text-white font-bold hover:bg-red-700 transition"
              >
                <Download className="h-3 w-3" />
                <span>Tải phiên bản này</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
