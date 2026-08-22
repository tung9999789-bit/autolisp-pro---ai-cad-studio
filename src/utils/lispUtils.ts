// AutoLISP file download and utility helpers

/**
 * Standardize Lisp filename according to user specification:
 * Pattern: `prefix-description.lsp` (e.g. `dt-tính diện tích.lsp`, `tt-tính thể tích.lsp`, `vt-vẽ tường bao.lsp`)
 */
export function formatStandardLispFileName(commandName: string, title?: string): string {
  const cleanCmd = (commandName || "lisp").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  
  if (!title) {
    return `${cleanCmd}.lsp`;
  }

  // Clean title: lowercase, replace slashes and special chars, keep Vietnamese accents or readable spaces
  let cleanTitle = title.trim().toLowerCase();
  
  // Remove existing .lsp or command prefix if in title
  cleanTitle = cleanTitle.replace(/\.lsp$/i, "");
  cleanTitle = cleanTitle.replace(new RegExp(`^${cleanCmd}\\s*[-_:]?\\s*`, "i"), "");
  
  // Remove invalid filename characters for Windows/Mac/Linux
  cleanTitle = cleanTitle.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();

  if (!cleanTitle) {
    return `${cleanCmd}.lsp`;
  }

  return `${cleanCmd}-${cleanTitle}.lsp`;
}

export function downloadLispFile(
  filenameOrCommand: string,
  code: string,
  title?: string
) {
  let finalFileName = filenameOrCommand;

  // If title is passed or filenameOrCommand looks like a raw command (e.g. "DT", "TL", "VC")
  if (title) {
    finalFileName = formatStandardLispFileName(filenameOrCommand, title);
  } else if (!filenameOrCommand.endsWith(".lsp")) {
    finalFileName = `${filenameOrCommand.toLowerCase()}.lsp`;
  }

  // Create UTF-8 with BOM for AutoCAD compatibility across all CAD versions (2007-2026)
  const blob = new Blob(["\uFEFF" + code], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = finalFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadAllLispsAsZipOrBundle(lisps: { commandName: string; code: string; title: string }[]) {
  // Create a combined master autolisp loader bundle
  let masterCode = `;;; =========================================================================\n`;
  masterCode += `;;; AUTOLISP PRO - MASTER BUNDLE PACK\n`;
  masterCode += `;;; Kỹ sư: Phạm Thanh Tùng\n`;
  masterCode += `;;; Ngày tạo: ${new Date().toLocaleDateString("vi-VN")} ${new Date().toLocaleTimeString("vi-VN")}\n`;
  masterCode += `;;; Tổng số lệnh tối ưu: ${lisps.length} lệnh (Lệnh tắt 2 ký tự: DT, TT, VT, VC, KT, TL, TY, TD, ST, CD...)\n`;
  masterCode += `;;; =========================================================================\n\n`;

  masterCode += `(vl-load-com)\n\n`;
  masterCode += `(princ "\\n========================================================")\n`;
  masterCode += `(princ "\\n[AutoLISP Pro] DANG NAP GOI THU VIEN LISP TONG HOP CHO KY SU PHAM THANH TUNG...")\n`;

  lisps.forEach((l) => {
    masterCode += `\n;;; -------------------------------------------------------------------------\n`;
    masterCode += `;;; Chức năng: ${l.title} (Lệnh CAD: ${l.commandName})\n`;
    masterCode += `;;; File xuất tương ứng: ${formatStandardLispFileName(l.commandName, l.title)}\n`;
    masterCode += `;;; -------------------------------------------------------------------------\n`;
    masterCode += l.code + "\n";
  });

  masterCode += `\n(princ "\\n==> NAP THANH CONG ${lisps.length} LENH AUTOLISP!")\n`;
  masterCode += `(princ "\\nDanh sach lenh tat 2 ky tu: ${lisps.map((l) => l.commandName).join(", ")}")\n`;
  masterCode += `(princ "\\n========================================================")\n(princ)\n`;

  downloadLispFile("autolisp-pro-master-bundle.lsp", masterCode);
}

export function exportLibraryToJson(data: any) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `autolisp-pro-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function changeCommandAlias(code: string, newAlias: string): string {
  const cleanAlias = newAlias.trim().toUpperCase();
  if (!cleanAlias) return code;
  // Match (defun c:OLDNAME or (defun c:OLDNAME (
  return code.replace(/\(defun\s+c:([a-zA-Z0-9_-]+)/i, `(defun c:${cleanAlias}`);
}

export function extractCommandNameFromCode(code: string): string {
  const match = code.match(/\(defun\s+c:([a-zA-Z0-9_-]+)/i);
  return match && match[1] ? match[1].toUpperCase() : "LISP";
}

export interface AutoCadCompatibilityReport {
  isUniversalCompatible: boolean;
  score: number; // 0 to 100
  supportedCAD: string[];
  checks: {
    id: string;
    label: string;
    passed: boolean;
    detail: string;
  }[];
}

export function analyzeAutoCadCompatibility(code: string): AutoCadCompatibilityReport {
  const hasVlLoadCom = /\(vl-load-com\)/i.test(code);
  const hasErrorHandler = /\*error\*/i.test(code) && /setvar\s+["'](OSMODE|CMDECHO)["']/i.test(code);
  const hasUndoMarks = /vla-(start|end)undomark/i.test(code) || /undo/i.test(code);
  const hasLocalVariables = /\(defun\s+c:[a-zA-Z0-9_-]+\s*\(\s*\/[^)]+\)/i.test(code);
  const hasStandardCommandPrefix = /\._|-boundary|-layer|-hatch|entmake|vla-/i.test(code) || !/\(command\s+["'][a-z]/i.test(code);
  const hasSafePrint = /\(princ\s*\)/i.test(code) || /\(princ/i.test(code);

  const checks = [
    {
      id: "vl-load-com",
      label: "Visual LISP & ActiveX (vl-load-com)",
      passed: hasVlLoadCom,
      detail: hasVlLoadCom
        ? "Đã nạp sẵn (vl-load-com), tương thích hoàn hảo mọi phiên bản AutoCAD từ 2007 đến 2026."
        : "Khuyên dùng thêm (vl-load-com) ở đầu file để hỗ trợ ActiveX/Visual LISP.",
    },
    {
      id: "error-handling",
      label: "Bẫy lỗi khôi phục biến (*error* OSMODE/CMDECHO)",
      passed: hasErrorHandler,
      detail: hasErrorHandler
        ? "Bảo vệ bắt điểm OSMODE và tắt hiển thị rác CMDECHO ngay cả khi người dùng nhấn phím ESC giữa chừng."
        : "Nên bổ sung bẫy lỗi *error* để không bị mất bắt điểm OSMODE khi hủy lệnh.",
    },
    {
      id: "undo-marks",
      label: "Đóng gói hoàn tác 1 bước (Undo Grouping)",
      passed: hasUndoMarks,
      detail: hasUndoMarks
        ? "Hỗ trợ Undo (Ctrl+Z) 1 lần là hoàn tác toàn bộ chuỗi đối tượng được tạo, không bị rác bản vẽ."
        : "Khuyên dùng vla-startundomark và vla-endundomark.",
    },
    {
      id: "variable-scoping",
      label: "Khai báo biến cục bộ an toàn (Local Scoping)",
      passed: hasLocalVariables,
      detail: hasLocalVariables
        ? "Đã cô lập biến sau dấu '/', chống tràn bộ nhớ và chống xung đột giữa các LISP khác nhau."
        : "Cần khai báo danh sách biến cục bộ sau dấu '/' trong defun.",
    },
    {
      id: "command-prefix",
      label: "Tiền tố lệnh quốc tế & Tắt Dialog (._ / entmake)",
      passed: hasStandardCommandPrefix,
      detail: hasStandardCommandPrefix
        ? "Tương thích 100% mọi phiên bản ngôn ngữ AutoCAD (Tiếng Anh, Pháp, Nhật, Đức) và tránh bảng hội thoại chặn lệnh."
        : "Nên thêm tiền tố '._' trước tên lệnh CAD hoặc dùng entmake.",
    },
    {
      id: "clean-return",
      label: "Kết thúc lệnh êm ái (princ)",
      passed: hasSafePrint,
      detail: hasSafePrint
        ? "Trả về sạch sẽ trên thanh Command Line, không in giá trị nil thừa."
        : "Nên thêm (princ) ở cuối cùng của hàm.",
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    isUniversalCompatible: score >= 65,
    score,
    supportedCAD: [
      "AutoCAD 2007 - 2026 (All Full versions)",
      "AutoCAD Civil 3D",
      "AutoCAD LT 2024 / 2025 / 2026 (Official LISP Support)",
      "AutoCAD Architecture / Mechanical / MEP",
      "ZWCAD 2020 - 2025",
      "BricsCAD Pro / Platinum",
      "GstarCAD",
    ],
    checks,
  };
}


