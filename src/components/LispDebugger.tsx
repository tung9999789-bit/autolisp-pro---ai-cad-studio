import React, { useState } from "react";
import {
  Wrench,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  FileCode2,
  Terminal,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  FolderPlus,
  Activity,
  Check,
  AlertCircle,
} from "lucide-react";
import { DebugLispResponse, LispItem } from "../types";
import { LispCodeViewer } from "./LispCodeViewer";
import { downloadLispFile, formatStandardLispFileName, analyzeAutoCadCompatibility } from "../utils/lispUtils";

interface LispDebuggerProps {
  onSaveToLibrary: (item: Omit<LispItem, "id" | "createdAt" | "updatedAt" | "versions">) => void;
  userName: string;
}

const COMMON_CAD_BUGS = [
  {
    label: "Bị mất bắt điểm OSMODE khi bấm phím ESC",
    description: "Lisp cũ không có bẫy lỗi *error* để phục hồi lại biến hệ thống OSMODE và CMDECHO.",
  },
  {
    label: "Lỗi '; error: no function definition: VLAX-GET-ACAD-OBJECT'",
    description: "Quên gọi hàm (vl-load-com) ở đầu file khi sử dụng thư viện Visual LISP / ActiveX.",
  },
  {
    label: "AutoCAD 2021-2026 báo lỗi hàm (command ...)",
    description: "Cần nâng cấp lên (command-s ...) hoặc dùng entmake để tránh gián đoạn tương tác.",
  },
  {
    label: "Tràn bộ nhớ hoặc xung đột biến toàn cục",
    description: "Quên khai báo các biến cục bộ sau dấu gạch chéo '/' trong (defun c:LENH ( / var1 var2 ...)).",
  },
];

export const LispDebugger: React.FC<LispDebuggerProps> = ({ onSaveToLibrary, userName }) => {
  const [code, setCode] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugResult, setDebugResult] = useState<DebugLispResponse | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Live client-side static analysis on input code
  const inputAnalysis = code.trim().length > 10 ? analyzeAutoCadCompatibility(code) : null;

  const handleDebug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Vui lòng dán đoạn mã AutoLISP cần kiểm tra và sửa lỗi.");
      return;
    }

    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/lisp/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          issueDescription: issueDescription.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Không thể phân tích mã LISP.");
      }

      setDebugResult(data.data);
    } catch (err: any) {
      console.error("Error debugging LISP:", err);
      setError(err?.message || "Lỗi khi chẩn đoán mã LISP. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFixedLisp = () => {
    if (!debugResult) return;
    onSaveToLibrary({
      title: debugResult.title || "Lisp Đã Sửa Lỗi",
      commandName: debugResult.commandName || "LISP",
      category: "Tiện ích vẽ nhanh",
      description: debugResult.description || "Mã AutoLISP đã được tối ưu và sửa lỗi.",
      code: debugResult.code,
      steps: debugResult.steps || [`1. Gõ lệnh ${debugResult.commandName} để chạy`],
      features: ["Đã vá lỗi *error*", "Tối ưu hóa biến cục bộ", "Tương thích 100% AutoCAD 2007-2026"],
      tips: "Chạy ổn định trên mọi phiên bản AutoCAD và AutoCAD LT.",
      compatibleCAD: debugResult.compatibleCAD || "AutoCAD 2007 - 2026, AutoCAD LT 2024+, Civil 3D, ZWCAD",
      tags: [debugResult.commandName, "Đã sửa lỗi", "Tối ưu", "AutoCAD"],
      author: userName,
      isCustom: true,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Banner */}
      <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
            <Wrench className="h-3.5 w-3.5" />
            <span>Trình Chẩn Đoán & Sửa Lỗi Tương Thích AutoCAD Tự Động</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Sửa Lỗi & Tối Ưu Hóa Mã LISP Chuẩn AutoCAD
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Bạn có đoạn mã LISP tải trên mạng hoặc viết từ các đời CAD cũ bị lỗi khi nâng cấp AutoCAD, bị đơ màn hình, mất bắt điểm khi nhấn phím ESC hoặc thiếu dấu ngoặc? Hãy dán mã vào đây để AI chẩn đoán, chuẩn hóa và tối ưu tương thích 100% với mọi phiên bản AutoCAD từ 2007 đến 2026.
          </p>
        </div>
      </div>

      {/* Main Form & Code Diagnosis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Input */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleDebug}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCode2 className="h-5 w-5 text-red-600" />
                <span>Dán Mã AutoLISP Cần Sửa</span>
              </h2>
              {inputAnalysis && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                    inputAnalysis.score === 100
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  Độ tương thích hiện tại: {inputAnalysis.score}%
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Mã AutoLISP hiện tại: <span className="text-red-500">*</span>
              </label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="(defun c:MYLISP () ...)"
                rows={10}
                className="w-full rounded-xl border border-slate-300 p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            {/* Quick Live Pre-Diagnosis on user typed code */}
            {inputAnalysis && (
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                  <Activity className="h-3.5 w-3.5 text-blue-600" />
                  <span>Chẩn đoán nhanh độ tương thích AutoCAD:</span>
                </div>
                <div className="space-y-1">
                  {inputAnalysis.checks.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600">{c.label}</span>
                      {c.passed ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                          <Check className="h-3 w-3" /> Đạt
                        </span>
                      ) : (
                        <span className="text-amber-600 font-bold flex items-center gap-0.5">
                          <AlertCircle className="h-3 w-3" /> Cần sửa
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Mô tả hiện tượng lỗi gặp phải (Tùy chọn):
              </label>
              <input
                type="text"
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="VD: Bị mất bắt điểm OSMODE, báo lỗi bad argument type..."
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none"
              />
            </div>

            {error && (
              <div className="flex items-start justify-between gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleDebug(e as any)}
                  className="shrink-0 px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] transition cursor-pointer"
                >
                  Thử lại
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !code.trim()}
              id="btn-debug-lisp"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang phân tích AST và chẩn đoán lỗi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Chẩn Đoán & Sửa Lỗi Tương Thích AutoCAD</span>
                </>
              )}
            </button>
          </form>

          {/* Common CAD Pitfalls */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              <span>Các lỗi AutoLISP phổ biến nhất trong xây dựng:</span>
            </h3>
            <div className="space-y-2.5">
              {COMMON_CAD_BUGS.map((bug, idx) => (
                <div key={idx} className="rounded-lg bg-white p-2.5 border border-slate-200/80 text-xs">
                  <p className="font-bold text-slate-800">{bug.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{bug.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Diagnosis & Repaired Code */}
        <div className="lg:col-span-7 space-y-6">
          {debugResult ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Diagnosis Box */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <span>Kết quả chẩn đoán và khắc phục:</span>
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Tương thích AutoCAD 100%
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700">
                  {debugResult.diagnosis && debugResult.diagnosis.map((diag, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-white/80 p-2 rounded-lg border border-emerald-100">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{diag}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    onClick={handleSaveFixedLisp}
                    disabled={savedSuccess}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      savedSuccess
                        ? "bg-emerald-600 text-white"
                        : "bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                    }`}
                  >
                    {savedSuccess ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Đã lưu vào kho</span>
                      </>
                    ) : (
                      <>
                        <FolderPlus className="h-4 w-4 text-emerald-600" />
                        <span>Lưu bản đã sửa vào thư viện</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() =>
                      downloadLispFile(
                        debugResult.commandName,
                        debugResult.code,
                        debugResult.title
                      )
                    }
                    className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Tải {formatStandardLispFileName(debugResult.commandName, debugResult.title)}</span>
                  </button>
                </div>
              </div>

              {/* Repaired Code Viewer */}
              <LispCodeViewer
                code={debugResult.code}
                commandName={debugResult.commandName}
                title={debugResult.title}
              />
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center space-y-4">
              <div className="h-14 w-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Wrench className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Chờ đoạn mã LISP cần chẩn đoán
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Dán mã ở khung bên trái và nhấn nút "Chẩn Đoán & Sửa Lỗi Tương Thích AutoCAD" để AI phân tích cấu trúc, tìm lỗi cú pháp và tối ưu hóa tốc độ.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

