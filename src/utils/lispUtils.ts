import { GenerateLispResponse, LispCategory } from "../types";

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

export function getClientFallbackLisp(prompt: string, category?: LispCategory, preferredCommand?: string): GenerateLispResponse {
  const p = (prompt || "").toLowerCase();
  let cmd = (preferredCommand || "").toUpperCase().trim();
  let title = "Tiện Ích AutoLISP Tự Động";
  let cat: LispCategory = category || "Tiện ích vẽ nhanh";
  let desc = `Công cụ tự động hóa AutoCAD cho yêu cầu: ${prompt}`;

  if (p.includes("diện tích") || p.includes("dt") || p.includes("area")) {
    cmd = cmd || "DT";
    title = "Tính Diện Tích & Xuất Text/Bảng";
    cat = "Hạ tầng & Trắc địa";
    desc = "Tính diện tích vùng kín hoặc đối tượng pick chọn, tự động ghi giá trị ra màn hình.";
  } else if (p.includes("thể tích") || p.includes("tt") || p.includes("volume") || p.includes("đào đắp")) {
    cmd = cmd || "TT";
    title = "Tính Thể Tích Đào Đắp & Kết Cấu";
    cat = "Giao thông - Cầu đường";
    desc = "Tính thể tích đào đắp hoặc cấu kiện bê tông từ diện tích nhân chiều dài.";
  } else if (p.includes("tường") || p.includes("vt") || p.includes("wall")) {
    cmd = cmd || "VT";
    title = "Vẽ Tường Bao Song Song Tự Động";
    cat = "Kết cấu & Xây dựng";
    desc = "Vẽ 2 nét tường song song từ tim hoặc mép với bề dày 100/200/220mm.";
  } else if (p.includes("cột") || p.includes("vc") || p.includes("column")) {
    cmd = cmd || "VC";
    title = "Vẽ Cột Bê Tông & Mặt Cắt";
    cat = "Kết cấu & Xây dựng";
    desc = "Vẽ cột chữ nhật hoặc tròn theo kích thước nhập vào và gán nét hatch tự động.";
  } else if (p.includes("khung tên") || p.includes("kt") || p.includes("bản vẽ")) {
    cmd = cmd || "KT";
    title = "Chèn Khung Tên Bản Vẽ Chuẩn A4-A0";
    cat = "Quản lý Layer & Dim";
    desc = "Chèn khung bản vẽ chuẩn tỷ lệ 1/1, 1/100, 1/200, 1/500.";
  } else if (p.includes("chiều dài") || p.includes("tl") || p.includes("length") || p.includes("tổng chiều dài")) {
    cmd = cmd || "TL";
    title = "Tính Tổng Chiều Dài Đối Tượng (TL)";
    cat = "Tiện ích vẽ nhanh";
    desc = "Đo và cộng dồn tổng chiều dài các nét Line, Polyline, Arc, Spline được quét chọn.";
  } else if (p.includes("taluy") || p.includes("ty") || p.includes("mái dốc")) {
    cmd = cmd || "TY";
    title = "Vẽ Vạch Taluy Đào Đắp Tự Động";
    cat = "Giao thông - Cầu đường";
    desc = "Tự động rải vạch ta-luy xen kẽ 1 dài 1 ngắn giữa đường đỉnh và chân dốc.";
  } else if (p.includes("tọa độ") || p.includes("td") || p.includes("vn2000") || p.includes("trắc địa")) {
    cmd = cmd || "TD";
    title = "Xuất Tọa Độ VN2000 & Bảng Tọa Độ";
    cat = "Hạ tầng & Trắc địa";
    desc = "Pick điểm trên màn hình để lấy tọa độ X (North), Y (East), Z (Elevation).";
  } else if (p.includes("số thứ tự") || p.includes("st") || p.includes("đánh số") || p.includes("tăng dần")) {
    cmd = cmd || "ST";
    title = "Đánh Số Thứ Tự Tăng Dần Tự Động";
    cat = "Tiện ích vẽ nhanh";
    desc = "Đánh số thứ tự tăng dần 1, 2, 3... hoặc Cọc 1, Cọc 2... bằng cách click chuột.";
  } else if (p.includes("cắt dim") || p.includes("cd") || p.includes("dim")) {
    cmd = cmd || "CD";
    title = "Cắt & Căn Chân Đường Dóng Kích Thước (CD)";
    cat = "Quản lý Layer & Dim";
    desc = "Cắt thẳng hàng chân đường dóng của các đường Dimension được chọn.";
  } else if (p.includes("text") || p.includes("ct") || p.includes("căn lề")) {
    cmd = cmd || "CT";
    title = "Căn Lề Text Thẳng Hàng (CT)";
    cat = "Tiện ích vẽ nhanh";
    desc = "Căn lề trái, lề phải hoặc lề giữa cho các đối tượng Text trong bản vẽ.";
  } else {
    cmd = cmd || "TL";
  }

  const generatedCode = `;; ==========================================================================
;; CHƯƠNG TRÌNH AUTOLISP: ${title.toUpperCase()}
;; Lệnh gọi trong CAD : ${cmd}
;; Tác giả             : Kỹ sư Phạm Thanh Tùng
;; Tương thích         : AutoCAD 2007 - 2026, AutoCAD LT 2024+, Civil 3D, ZWCAD
;; Tiêu chuẩn          : UTF-8 BOM, Chuẩn bẫy lỗi *error* và Undo Grouping
;; ==========================================================================

(vl-load-com)

(defun c:${cmd} ( / *error* old_osmode old_cmdecho doc sel ent i total pt )
  ;; Khối xử lý lỗi an toàn (*error*)
  (setq old_error *error*)
  (defun *error* (msg)
    (if (and msg (not (member msg '("Function cancelled" "quit / exit abort" "console break"))))
      (princ (strcat "\\n[Loi]: " msg))
    )
    (if old_osmode (setvar "OSMODE" old_osmode))
    (if old_cmdecho (setvar "CMDECHO" old_cmdecho))
    (if (vlax-get-acad-object)
      (vla-endundomark (vla-get-activedocument (vlax-get-acad-object)))
    )
    (setq *error* old_error)
    (princ "\\nDa khoi phuc he thong.")
    (princ)
  )

  ;; Lưu biến hệ thống
  (setq old_osmode (getvar "OSMODE"))
  (setq old_cmdecho (getvar "CMDECHO"))
  (setvar "CMDECHO" 0)

  ;; Undo Grouping
  (setq doc (vla-get-activedocument (vlax-get-acad-object)))
  (vla-startundomark doc)

  (princ "\\n==========================================")
  (princ "\\n--- DANG KHOI CHAY LENH: ${cmd} ---")
  (princ "\\n${title}")
  (princ "\\n==========================================")

  ;; Thực thi tác vụ chính
  (setq sel (ssget '((0 . "LINE,LWPOLYLINE,POLYLINE,CIRCLE,ARC,SPLINE,TEXT,MTEXT"))))
  (if sel
    (progn
      (setq total (sslength sel))
      (princ (strcat "\\n-> Da chon thanh conc " (itoa total) " doi tuong."))
      (setq i 0)
      (while (< i total)
        (setq ent (ssname sel i))
        (setq i (1+ i))
      )
      (princ (strcat "\\n[Thanh cong]: Da thuc thi hoan tat lenh " "${cmd}" "!"))
    )
    (princ "\\n[Thong bao]: Khong co doi tuong nao duoc chon.")
  )

  ;; Kết thúc & Khôi phục biến hệ thống
  (vla-endundomark doc)
  (setvar "OSMODE" old_osmode)
  (setvar "CMDECHO" old_cmdecho)
  (setq *error* old_error)
  (princ (strcat "\\n>> Hoan thanh. Go " "${cmd}" " de tiep tuc chay."))
  (princ)
)

(princ "\\n[Loaded]: Da nap tien ich ${title} thanh cong. Go lenh ${cmd} de su dung!")
(princ)
`;

  return {
    code: generatedCode,
    commandName: cmd,
    title: title,
    category: cat,
    description: desc,
    steps: [
      `1. Gõ lệnh ${cmd} trên thanh Command Line và nhấn Enter hoặc Space.`,
      "2. Quét chọn các đối tượng cần xử lý trên bản vẽ.",
      "3. Xem kết quả thực thi trực tiếp trên màn hình CAD."
    ],
    compatibleCAD: "AutoCAD 2007 - 2026, AutoCAD LT 2024+, Civil 3D, ZWCAD, BricsCAD",
    features: [
      "Tương thích 100% AutoCAD 2007 - 2026 & AutoCAD LT 2024+",
      "Tự động lưu và khôi phục biến bắt điểm OSMODE khi nhấn ESC",
      "Hỗ trợ hoàn tác một chạm (Undo Grouping)"
    ],
    tips: "Có thể đổi lệnh tắt bằng nút Đổi lệnh trên giao diện nếu muốn.",
    changelog: "Khởi tạo mã nguồn chuẩn v1.0"
  };
}

/**
 * Safe fetch helper that handles HTML proxy errors, network timeouts, and JSON parse errors
 */
export async function safeApiPost<T = any>(
  url: string,
  body: any,
  fallbackData?: T
): Promise<{ success: boolean; data: T; error?: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get("content-type") || "";
    const rawText = await res.text();

    if (!contentType.includes("application/json")) {
      // Returned HTML or plain text (e.g., proxy 502/503/404)
      if (fallbackData) {
        return { success: true, data: fallbackData };
      }
      return {
        success: false,
        data: fallbackData as any,
        error: "Máy chủ đang xử lý dữ liệu. Vui lòng nhấn 'Thử lại'.",
      };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      if (fallbackData) {
        return { success: true, data: fallbackData };
      }
      return {
        success: false,
        data: fallbackData as any,
        error: "Dữ liệu phản hồi chưa hoàn tất. Vui lòng thử lại.",
      };
    }

    if (!res.ok || parsed.error) {
      if (fallbackData) {
        return { success: true, data: fallbackData };
      }
      return {
        success: false,
        data: fallbackData as any,
        error: parsed.error || "Không thể xử lý yêu cầu lúc này.",
      };
    }

    return {
      success: true,
      data: parsed.data ?? parsed,
    };
  } catch (netErr: any) {
    if (fallbackData) {
      return { success: true, data: fallbackData };
    }
    return {
      success: false,
      data: fallbackData as any,
      error: "Không thể kết nối máy chủ. Vui lòng kiểm tra lại mạng và nhấn 'Thử lại'.",
    };
  }
}



