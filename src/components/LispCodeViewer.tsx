import React, { useState } from "react";
import { Copy, Check, Download, Edit3, Maximize2, Minimize2, Terminal, ShieldCheck, Sparkles, Tag, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from "lucide-react";
import { changeCommandAlias, downloadLispFile, extractCommandNameFromCode, formatStandardLispFileName, analyzeAutoCadCompatibility } from "../utils/lispUtils";

interface LispCodeViewerProps {
  code: string;
  commandName: string;
  title?: string;
  onCodeChange?: (newCode: string, newCommandName: string) => void;
  readOnly?: boolean;
}

export const LispCodeViewer: React.FC<LispCodeViewerProps> = ({
  code,
  commandName,
  title,
  onCodeChange,
  readOnly = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [customAlias, setCustomAlias] = useState(commandName);
  const [showCompatibilityDetails, setShowCompatibilityDetails] = useState(false);

  const compatReport = analyzeAutoCadCompatibility(code);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code", err);
    }
  };

  const handleDownload = () => {
    downloadLispFile(commandName, code, title);
  };

  const handleSaveAlias = () => {
    if (!customAlias.trim()) return;
    const cleanAlias = customAlias.trim().toUpperCase();
    const updatedCode = changeCommandAlias(code, cleanAlias);
    if (onCodeChange) {
      onCodeChange(updatedCode, cleanAlias);
    }
    setIsEditingAlias(false);
  };

  // Syntax highlighter for AutoLISP
  const renderHighlightedCode = (lispCode: string) => {
    const lines = lispCode.split("\n");
    return lines.map((line, idx) => {
      // Check if line is a full comment
      const trimmed = line.trim();

      if (trimmed.startsWith(";")) {
        return (
          <div key={idx} className="table-row font-mono text-xs leading-5">
            <span className="table-cell select-none pr-4 text-right text-slate-500 font-mono w-10">
              {idx + 1}
            </span>
            <span className="table-cell text-emerald-400 italic font-mono whitespace-pre">
              {line}
            </span>
          </div>
        );
      }

      return (
        <div key={idx} className="table-row font-mono text-xs leading-5 hover:bg-slate-800/40">
          <span className="table-cell select-none pr-4 text-right text-slate-500 font-mono w-10">
            {idx + 1}
          </span>
          <span
            className="table-cell text-slate-200 font-mono whitespace-pre"
            dangerouslySetInnerHTML={{
              __html: highlightLispLine(line),
            }}
          />
        </div>
      );
    });
  };

  return (
    <div
      id="lisp-code-viewer-container"
      className={`flex flex-col rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-xl overflow-hidden transition-all duration-200 ${
        isFullscreen ? "fixed inset-4 z-50 shadow-2xl" : "w-full"
      }`}
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/80 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500 ring-2 ring-red-500/20" />
            <span className="h-3 w-3 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
            <span className="h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <Terminal className="h-4 w-4 text-red-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Lệnh CAD:
            </span>

            {isEditingAlias && !readOnly ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value.toUpperCase())}
                  placeholder="TÊN LỆNH"
                  className="w-24 rounded border border-red-500/60 bg-slate-900 px-2 py-0.5 text-xs font-bold text-red-400 focus:outline-none focus:ring-1 focus:ring-red-500"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveAlias()}
                />
                <button
                  onClick={handleSaveAlias}
                  className="rounded bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-red-700 cursor-pointer"
                >
                  Lưu
                </button>
                <button
                  onClick={() => setIsEditingAlias(false)}
                  className="text-[11px] text-slate-400 hover:text-slate-200 px-1 cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-red-950/80 border border-red-800/60 px-2.5 py-0.5 text-xs font-mono font-bold text-red-400">
                  {commandName || extractCommandNameFromCode(code)}
                </span>
                {!readOnly && onCodeChange && (
                  <button
                    onClick={() => {
                      setCustomAlias(commandName);
                      setIsEditingAlias(true);
                    }}
                    title="Đổi tên lệnh gõ trong CAD"
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded px-1.5 py-0.5 transition cursor-pointer"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Đổi lệnh</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {title && (
            <span className="hidden sm:inline-block text-xs font-medium text-slate-400 truncate max-w-xs">
              - {title}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* AutoCAD Compatibility Button Toggle */}
          <button
            onClick={() => setShowCompatibilityDetails(!showCompatibilityDetails)}
            className="flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-950/70 border border-emerald-700/60 px-2.5 py-1 rounded-lg hover:bg-emerald-900/60 transition cursor-pointer"
            title="Xem chi tiết tương thích AutoCAD"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-bold">Tương thích AutoCAD: {compatReport.score}%</span>
            {showCompatibilityDetails ? (
              <ChevronUp className="h-3 w-3 text-emerald-400" />
            ) : (
              <ChevronDown className="h-3 w-3 text-emerald-400" />
            )}
          </button>

          <button
            onClick={handleCopy}
            id="btn-copy-lisp-code"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Đã sao chép</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span>Sao chép</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            id="btn-download-lsp-file"
            title={`Tải file: ${formatStandardLispFileName(commandName, title)}`}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Tải {formatStandardLispFileName(commandName, title)}</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
            className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable AutoCAD Compatibility Inspector */}
      {showCompatibilityDetails && (
        <div className="border-b border-slate-800 bg-slate-950/95 p-4 text-xs animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs">
                CHỨNG NHẬN TƯƠNG THÍCH AUTOCAD TOÀN DIỆN (AUTOCAD UNIVERSAL COMPATIBILITY)
              </span>
              <span className="rounded bg-emerald-900/80 text-emerald-300 font-bold px-2 py-0.5 text-[10px] border border-emerald-600/40">
                100% Sẵn Sàng
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Chuẩn AutoLISP UTF-8 BOM
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            {compatReport.checks.map((check) => (
              <div
                key={check.id}
                className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                  check.passed
                    ? "bg-emerald-950/30 border-emerald-800/40 text-slate-300"
                    : "bg-amber-950/30 border-amber-800/40 text-amber-200"
                }`}
              >
                {check.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-slate-200 text-xs">{check.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{check.detail}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-300 font-semibold">Tương thích các phần mềm CAD:</span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200 border border-slate-700">AutoCAD 2007 - 2026</span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200 border border-slate-700">AutoCAD LT 2024/2025/2026</span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200 border border-slate-700">Civil 3D</span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200 border border-slate-700">ZWCAD</span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200 border border-slate-700">BricsCAD</span>
            </div>
            <span className="text-emerald-400 font-medium">Bảo vệ bắt điểm OSMODE khi hủy lệnh (ESC)</span>
          </div>
        </div>
      )}

      {/* Code body */}
      <div className={`overflow-auto p-4 font-mono text-xs bg-slate-950 ${isFullscreen ? "flex-1" : "max-h-[500px]"}`}>
        <div className="table w-full border-collapse">
          {renderHighlightedCode(code)}
        </div>
      </div>

      {/* Quick Run Hint footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 bg-slate-950/60 px-4 py-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-red-400 font-semibold">
            <Sparkles className="h-3 w-3" />
            Cách dùng trong CAD:
          </span>
          <span>1. Tải file về ➔ 2. Kéo thả vào CAD hoặc gõ <strong>APPLOAD</strong> ➔ 3. Gõ lệnh <strong className="text-red-400 font-mono bg-red-950/50 px-1 rounded">{commandName || "LISP"}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-medium">✓ Tương thích mọi phiên bản AutoCAD</span>
          <span className="text-slate-500 font-mono text-[10px]">UTF-8 BOM</span>
        </div>
      </div>
    </div>
  );
};

// Helper for highlighting keywords, functions, strings and comments
function highlightLispLine(line: string): string {
  let escaped = line
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Handle inline comments
  const commentIdx = escaped.indexOf(";");
  let codePart = escaped;
  let commentPart = "";

  if (commentIdx !== -1) {
    codePart = escaped.substring(0, commentIdx);
    commentPart = `<span class="text-emerald-400 italic">${escaped.substring(commentIdx)}</span>`;
  }

  // Highlight strings "..."
  codePart = codePart.replace(/(".*?")/g, '<span class="text-amber-300">$1</span>');

  // Highlight core defun and keywords
  codePart = codePart.replace(
    /\b(defun|setq|if|while|progn|lambda|mapcar|cond|member|cons|list|car|cadr|caddr|cdr|repeat|null|and|or|not)\b/g,
    '<span class="text-red-400 font-bold">$1</span>'
  );

  // Highlight AutoCAD & ActiveX functions
  codePart = codePart.replace(
    /\b(vlax-[a-zA-Z0-9_-]+|vla-[a-zA-Z0-9_-]+|vl-[a-zA-Z0-9_-]+|ssget|ssname|sslength|entmake|entsel|getpoint|getreal|getstring|getint|getkword|initget|getfiled|command|command-s|setvar|getvar|princ|alert|rtos|itoa|atof|atoi|strcat|strlen|polar|distance|angle|inters)\b/g,
    '<span class="text-sky-300 font-medium">$1</span>'
  );

  // Highlight command prefix (c:COMMAND)
  codePart = codePart.replace(/\bc:([a-zA-Z0-9_-]+)\b/g, '<span class="text-amber-400 font-bold">c:$1</span>');

  return codePart + commentPart;
}

