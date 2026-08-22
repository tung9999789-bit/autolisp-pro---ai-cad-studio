import React from "react";
import {
  BookOpen,
  X,
  PlayCircle,
  Briefcase,
  Layers,
  FileCode2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Terminal,
  Download,
} from "lucide-react";

interface ApploadGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApploadGuideModal: React.FC<ApploadGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-700 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Cẩm Nang Nạp & Sử Dụng AutoLISP Trong AutoCAD / Civil 3D
              </h2>
              <p className="text-xs text-slate-500">
                Hướng dẫn kỹ thuật chi tiết từ cơ bản đến tự động nạp vĩnh viễn (Startup Suite).
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

        {/* Guide Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Method 1: APPLOAD + Startup Suite (Recommended) */}
          <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-red-600 text-white text-xs font-bold px-2.5 py-0.5">
                Cách 1 (Khuyên dùng)
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Nạp Vĩnh Viễn Qua Lệnh APPLOAD & Startup Suite (Chiếc cặp)
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Đây là phương pháp chuẩn nhất giúp LISP tự động khởi chạy mỗi khi mở bất kỳ bản vẽ AutoCAD nào mà không cần load lại từng lần:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white rounded-xl p-3 border border-red-100 shadow-2xs space-y-1">
                <span className="font-mono font-bold text-red-600 text-[11px]">BƯỚC 1</span>
                <p className="font-bold text-slate-800">Tải File .LSP</p>
                <p className="text-slate-500 text-[11px]">Lưu file vào một thư mục cố định trên máy tính (VD: <code className="font-mono text-red-600">D:\CAD_LISPS\</code>).</p>
              </div>

              <div className="bg-white rounded-xl p-3 border border-red-100 shadow-2xs space-y-1">
                <span className="font-mono font-bold text-red-600 text-[11px]">BƯỚC 2</span>
                <p className="font-bold text-slate-800">Gõ Lệnh APPLOAD</p>
                <p className="text-slate-500 text-[11px]">Trên thanh Command AutoCAD, gõ <code className="font-mono text-red-600 font-bold">APPLOAD</code> (hoặc lệnh tắt <code className="font-mono text-red-600">AP</code>) và nhấn Enter.</p>
              </div>

              <div className="bg-white rounded-xl p-3 border border-red-100 shadow-2xs space-y-1">
                <span className="font-mono font-bold text-red-600 text-[11px]">BƯỚC 3</span>
                <p className="font-bold text-slate-800">Chọn Startup Suite</p>
                <p className="text-slate-500 text-[11px]">Nhấn nút <strong>Contents...</strong> ở mục <em>Startup Suite</em> (Biểu tượng chiếc cặp màu vàng) ➔ Nhấn <strong>Add...</strong> và chọn file <code className="font-mono text-red-600">.lsp</code>.</p>
              </div>

              <div className="bg-white rounded-xl p-3 border border-red-100 shadow-2xs space-y-1">
                <span className="font-mono font-bold text-red-600 text-[11px]">BƯỚC 4</span>
                <p className="font-bold text-slate-800">Gõ Lệnh & Vẽ</p>
                <p className="text-slate-500 text-[11px]">Nhấn <strong>Close</strong>. Từ nay mỗi khi mở CAD, chỉ cần gõ đúng tên lệnh (VD: <code className="font-mono text-red-600 font-bold">TL</code>, <code className="font-mono text-red-600 font-bold">TALUY</code>).</p>
              </div>
            </div>
          </div>

          {/* Method 2: Drag & Drop */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-800 text-white text-xs font-bold px-2.5 py-0.5">
                Cách 2 (Nhanh tức thì)
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Kéo Thả Trực Tiếp Vào Vùng Vẽ AutoCAD (Drag & Drop)
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mở thư mục chứa file <code className="font-mono text-red-600 font-bold">.lsp</code>, giữ chuột trái và kéo thả file thẳng vào màn hình đen của bản vẽ AutoCAD. Dòng Command hiển thị dòng chữ thông báo nạp thành công là bạn có thể gõ lệnh vẽ ngay. (Lưu ý: Cách này chỉ có tác dụng trong phiên vẽ hiện tại).
            </p>
          </div>

          {/* Method 3: Master Bundle */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-800 text-white text-xs font-bold px-2.5 py-0.5">
                Cách 3 (Gói tổng hợp)
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Nạp Toàn Bộ Kho Lisp Trong 1 File Duy Nhất (Master Bundle .LSP)
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Trong mục <strong>Thư Viện Cá Nhân</strong>, nhấn nút <strong>"Xuất Master Bundle .LSP"</strong>. Hệ thống sẽ đóng gói tất cả các Lisp bạn đã tạo/lưu thành 1 file duy nhất. Bạn chỉ cần add 1 file này vào Startup Suite là có đầy đủ toàn bộ bộ công cụ vẽ siêu tốc.
            </p>
          </div>

          {/* AutoCAD Multi-Version Compatibility Guide */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5">
                Tương Thích Mọi Phiên Bản
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Hướng Dẫn Tương Thích AutoCAD 2007-2026, AutoCAD LT, Civil 3D, ZWCAD
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-white rounded-xl p-3 border border-blue-100 space-y-1.5">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                  AutoCAD Full (2007 đến 2026) & Civil 3D
                </p>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Hỗ trợ 100% Visual LISP (ActiveX) và AutoLISP thuần. Tự động nạp qua <code className="font-mono text-red-600 font-bold">APPLOAD</code> hoặc kéo thả. Đã tích hợp sẵn tiền tố quốc tế <code className="font-mono text-blue-600">._</code> chống lỗi ngôn ngữ.
                </p>
              </div>

              <div className="bg-white rounded-xl p-3 border border-blue-100 space-y-1.5">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  AutoCAD LT (Từ phiên bản 2024, 2025, 2026)
                </p>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Từ AutoCAD LT 2024, Autodesk đã chính thức mở khóa hỗ trợ AutoLISP! Bạn có thể dùng lệnh <code className="font-mono text-red-600 font-bold">APPLOAD</code> y hệt như bản AutoCAD Full tiêu chuẩn.
                </p>
              </div>

              <div className="bg-white rounded-xl p-3 border border-blue-100 space-y-1.5">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-600" />
                  ZWCAD & BricsCAD & GstarCAD
                </p>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Mã LISP tương thích hoàn toàn với API của ZWCAD (ZRX/Lisp) và BricsCAD LISP engine mà không cần biên dịch lại.
                </p>
              </div>

              <div className="bg-white rounded-xl p-3 border border-blue-100 space-y-1.5">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-600" />
                  Cấu hình bảo mật AutoCAD (SECURELOAD & TRUSTEDPATHS)
                </p>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Nếu CAD hiện thông báo bảo mật, gõ lệnh <code className="font-mono text-red-600 font-bold">SECURELOAD</code> và nhập <code className="font-mono text-red-600 font-bold">0</code> để cho phép nạp Lisp trơn tru không bị hỏi xác nhận.
                </p>
              </div>
            </div>
          </div>

          {/* Troubleshooting FAQs */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span>Xử lý sự cố thường gặp:</span>
            </h3>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="rounded-lg bg-white p-3 border border-slate-200">
                <p className="font-bold text-slate-900">1. AutoCAD cảnh báo "Security - Unsigned Executable File"?</p>
                <p className="mt-0.5 text-slate-500">
                  Chọn <strong>"Always Load"</strong> (Luôn luôn nạp). Bạn cũng có thể vào lệnh <code>OPTIONS</code> ➔ Thẻ <em>Files</em> ➔ <em>Trusted Locations</em> và thêm thư mục chứa Lisp vào danh sách tin cậy.
                </p>
              </div>

              <div className="rounded-lg bg-white p-3 border border-slate-200">
                <p className="font-bold text-slate-900">2. Làm sao để đổi lệnh tắt theo ý thích?</p>
                <p className="mt-0.5 text-slate-500">
                  Tại giao diện AutoLISP Pro, click nút <strong>"Đổi lệnh"</strong> ngay cạnh tên lệnh và nhập ký tự tắt bạn quen dùng (VD đổi <code>TALUY</code> thành <code>TY</code>), sau đó tải lại file.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-3">
          <button
            onClick={onClose}
            className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-700 transition"
          >
            Đã hiểu & Bắt đầu làm việc
          </button>
        </div>
      </div>
    </div>
  );
};
