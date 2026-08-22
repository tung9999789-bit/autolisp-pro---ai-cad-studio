import React, { useState } from "react";
import {
  Sparkles,
  Terminal,
  Send,
  CheckCircle2,
  Download,
  FolderPlus,
  Loader2,
  AlertCircle,
  HelpCircle,
  PlayCircle,
  Layers,
  FileCode2,
  RefreshCw,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  Tag,
} from "lucide-react";
import { GenerateLispResponse, LispCategory, LispItem } from "../types";
import { LispCodeViewer } from "./LispCodeViewer";
import { downloadLispFile, formatStandardLispFileName } from "../utils/lispUtils";

interface LispGeneratorProps {
  onSaveToLibrary: (item: Omit<LispItem, "id" | "createdAt" | "updatedAt" | "versions">) => void;
  onOpenGuide: () => void;
  userName: string;
}

const PRESET_IDEAS = [
  {
    label: "📐 DT - Tính diện tích",
    prompt: "Viết lisp DT tính diện tích hình kín hoặc pick điểm trong vùng kín, tự động tính m2, chu vi và cho phép chèn Text kết quả hoặc đè vào Text có sẵn.",
    category: "Tiện ích vẽ nhanh" as LispCategory,
    command: "DT",
  },
  {
    label: "📦 TT - Tính thể tích",
    prompt: "Viết lisp TT tính thể tích đào đắp hoặc kết cấu bê tông V = ((S1+S2)/2)*L hoặc V=S*H theo chiều dài khoảng cách cọc.",
    category: "Giao thông - Cầu đường" as LispCategory,
    command: "TT",
  },
  {
    label: "🧱 VT - Vẽ tường bao",
    prompt: "Viết lisp VT vẽ tường bao tự động với bề dày 100/200/220 mm từ tim tường bằng 2 nét song song gán layer TUONG.",
    category: "Kết cấu & Xây dựng" as LispCategory,
    command: "VT",
  },
  {
    label: "🏛️ VC - Vẽ cột",
    prompt: "Viết lisp VC vẽ cột bê tông cốt thép chữ nhật b x h hoặc tròn phi D kèm hatch solid và chèn tại tâm lưới trục.",
    category: "Kết cấu & Xây dựng" as LispCategory,
    command: "VC",
  },
  {
    label: "📜 KT - Khung tên bản vẽ",
    prompt: "Viết lisp KT chèn khung bản vẽ và khung tên chuẩn khổ A4, A3, A2, A1, A0 theo tỷ lệ (1:100, 1:200, 1:500) kèm tên Kỹ sư Phạm Thanh Tùng.",
    category: "Tiện ích vẽ nhanh" as LispCategory,
    command: "KT",
  },
  {
    label: "📏 TL - Tổng chiều dài",
    prompt: "Viết lisp tính tổng chiều dài tất cả các đối tượng Line, Polyline, Arc, Spline được chọn và cho phép click chọn 1 Text có sẵn trên bản vẽ để ghi đè kết quả.",
    category: "Tiện ích vẽ nhanh" as LispCategory,
    command: "TL",
  },
  {
    label: "🛣️ TY - Vẽ Taluy đào đắp",
    prompt: "Viết lisp vẽ vạch ta-luy đào và đắp cho đồ án đường giao thông nối giữa đường đỉnh taluy và mép chân taluy, có vạch ngắn bằng 1/2 vạch dài xen kẽ đều nhau.",
    category: "Giao thông - Cầu đường" as LispCategory,
    command: "TY",
  },
  {
    label: "📍 TD - Xuất Tọa Độ VN2000",
    prompt: "Viết lisp pick các điểm tim cọc trên bản vẽ và tự động xuất danh sách tọa độ VN2000 (STT, Tên cọc, X, Y, Z) ra file CSV mở bằng Excel.",
    category: "Hạ tầng & Trắc địa" as LispCategory,
    command: "TD",
  },
  {
    label: "🔢 ST - Đánh số thứ tự",
    prompt: "Viết lisp click chuột để đánh số thứ tự tăng dần kèm tiền tố tùy chọn (Ví dụ: Cọc 1, Cọc 2, Cọc 3...), hỗ trợ nhập chiều cao chữ và bước nhảy.",
    category: "Tiện ích vẽ nhanh" as LispCategory,
    command: "ST",
  },
  {
    label: "✂️ CD - Cắt chân Dim",
    prompt: "Viết lisp CD quét chọn các đường Dimension và chọn 1 điểm mốc để cắt chân đường dóng Dim đều tăm tắp.",
    category: "Quản lý Layer & Dim" as LispCategory,
    command: "CD",
  },
];

const TWO_CHAR_SHORTCUTS = [
  { cmd: "DT", desc: "Tính diện tích" },
  { cmd: "TT", desc: "Tính thể tích" },
  { cmd: "VT", desc: "Vẽ tường bao" },
  { cmd: "VC", desc: "Vẽ cột" },
  { cmd: "KT", desc: "Khung tên" },
  { cmd: "TL", desc: "Tổng chiều dài" },
  { cmd: "TY", desc: "Vẽ taluy" },
  { cmd: "TD", desc: "Xuất tọa độ" },
  { cmd: "ST", desc: "Số thứ tự" },
  { cmd: "CD", desc: "Cắt Dim" },
  { cmd: "TM", desc: "Thống kê thép" },
  { cmd: "LT", desc: "Lý trình cọc" },
];

export const LispGenerator: React.FC<LispGeneratorProps> = ({
  onSaveToLibrary,
  onOpenGuide,
  userName,
}) => {
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState<LispCategory>("Giao thông - Cầu đường");
  const [preferredCommand, setPreferredCommand] = useState("");
  const [customRequirements, setCustomRequirements] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateLispResponse | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) {
      setError("Vui lòng nhập mô tả yêu cầu tính năng LISP bạn cần tạo.");
      return;
    }

    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/lisp/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          category,
          preferredCommand: preferredCommand.trim() || undefined,
          customRequirements: customRequirements.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Không thể tạo mã LISP.");
      }

      setResult(data.data);
    } catch (err: any) {
      console.error("Error generating LISP:", err);
      setError(err?.message || "Đã xảy ra lỗi khi tạo mã. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset: (typeof PRESET_IDEAS)[0]) => {
    setPrompt(preset.prompt);
    setCategory(preset.category);
    setPreferredCommand(preset.command);
  };

  const handleSaveCurrentLisp = () => {
    if (!result) return;
    onSaveToLibrary({
      title: result.title || "Lisp Tự Động",
      commandName: result.commandName || "LISP",
      category: result.category || category,
      description: result.description || prompt,
      code: result.code,
      steps: result.steps || [
        `1. Gõ lệnh ${result.commandName} và nhấn Enter`,
        "2. Chọn đối tượng theo nhắc lệnh",
        "3. Xem kết quả hoàn thành trên bản vẽ",
      ],
      features: result.features || ["Tối ưu hiệu năng", "Bắt lỗi an toàn"],
      tips: result.tips || "Load qua lệnh APPLOAD trong AutoCAD.",
      compatibleCAD: result.compatibleCAD || "AutoCAD 2007 - 2026",
      tags: [result.commandName, category, "AI Generated"],
      author: userName,
      isCustom: true,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleUpdateCode = (newCode: string, newCommandName: string) => {
    if (!result) return;
    setResult({
      ...result,
      code: newCode,
      commandName: newCommandName,
    });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero / Instruction Banner */}
      <div className="rounded-2xl border border-red-200/80 bg-gradient-to-br from-white via-red-50/40 to-slate-50 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AutoLISP AI Studio cho Kỹ sư Xây dựng & Cầu đường</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Tạo Đoạn Mã AutoLISP Chuẩn Xác Theo Yêu Cầu
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Chỉ cần mô tả thao tác vẽ bằng tiếng Việt tự nhiên, hệ thống AI chuyên sâu sẽ viết mã AutoLISP chuẩn 100%, có bắt lỗi <code className="text-red-600 font-mono font-bold">*error*</code>, lưu và phục hồi bắt điểm OSMODE, xuất trực tiếp thành file <code className="text-red-600 font-mono font-bold">.lsp</code> nạp ngay vào CAD.
            </p>
          </div>

          {/* 4-Step Quick Flow Badge */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-3 rounded-xl border border-red-100 shadow-sm">
            <div className="flex items-center gap-2 px-2 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-bold">
              <span className="h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">1</span>
              <span>Yêu cầu tạo</span>
            </div>
            <ArrowRight className="hidden sm:block h-3.5 w-3.5 text-slate-400" />
            <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 text-slate-700 rounded-lg text-xs font-bold">
              <span className="h-5 w-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px]">2</span>
              <span>Xuất file .LSP</span>
            </div>
            <ArrowRight className="hidden sm:block h-3.5 w-3.5 text-slate-400" />
            <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 text-slate-700 rounded-lg text-xs font-bold">
              <span className="h-5 w-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px]">3</span>
              <span>APPLOAD vào CAD</span>
            </div>
            <ArrowRight className="hidden sm:block h-3.5 w-3.5 text-slate-400" />
            <div className="flex items-center gap-2 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold">
              <span className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">4</span>
              <span>Gõ lệnh & Vẽ</span>
            </div>
          </div>
        </div>

        {/* Quick presets */}
        <div className="mt-5 pt-4 border-t border-red-100">
          <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-red-600" />
            <span>Mẫu yêu cầu kỹ thuật phổ biến (Click chọn nhanh):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_IDEAS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-red-400 hover:bg-red-50 hover:text-red-700 transition shadow-2xs"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generator Form & Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Input */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleGenerate}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCode2 className="h-5 w-5 text-red-600" />
                <span>Mô Tả LISP Cần Viết</span>
              </h2>
              <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                Gemini 3.7 AutoLISP
              </span>
            </div>

            {/* Prompt textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                1. Yêu cầu chi tiết công việc của LISP: <span className="text-red-500">*</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ví dụ: Viết lisp vẽ vạch taluy đắp so le 1 ngắn 1 dài giữa 2 đường mép tim đường và chân mái dốc, có hỏi bước rải mặc định 2.0m..."
                rows={5}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
              <p className="text-[11px] text-slate-500">
                Mẹo: Càng nêu rõ đối tượng đầu vào (Point, Line, Pline, Text) và đầu ra mong muốn, mã sinh ra càng chuẩn xác.
              </p>
            </div>

            {/* Discipline Selector & Command Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  2. Chuyên ngành ứng dụng:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as LispCategory)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-medium text-slate-800 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  <option value="Giao thông - Cầu đường">Giao thông - Cầu đường</option>
                  <option value="Hạ tầng & Trắc địa">Hạ tầng & Trắc địa</option>
                  <option value="Kết cấu & Xây dựng">Kết cấu & Xây dựng</option>
                  <option value="Tiện ích vẽ nhanh">Tiện ích vẽ nhanh</option>
                  <option value="Quản lý Layer & Dim">Quản lý Layer & Dim</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    3. Tên lệnh tắt (Tối ưu 2 ký tự):
                  </label>
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                    Ví dụ: DT, TT, VT, VC...
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">c:</span>
                  <input
                    type="text"
                    maxLength={6}
                    value={preferredCommand}
                    onChange={(e) => setPreferredCommand(e.target.value.toUpperCase())}
                    placeholder="DT, TT, VT, VC, KT, TL..."
                    className="w-full rounded-lg border border-slate-300 pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-red-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 uppercase"
                  />
                </div>
                {/* 2-character quick command pills */}
                <div className="pt-1 flex flex-wrap gap-1">
                  {TWO_CHAR_SHORTCUTS.map((sc) => (
                    <button
                      key={sc.cmd}
                      type="button"
                      onClick={() => setPreferredCommand(sc.cmd)}
                      title={sc.desc}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold transition border ${
                        preferredCommand === sc.cmd
                          ? "bg-red-600 text-white border-red-600"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                      }`}
                    >
                      {sc.cmd}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Export Filename Format Note */}
            <div className="rounded-xl border border-red-100 bg-red-50/40 p-2.5 text-xs text-slate-700 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-medium">
                <Tag className="h-3.5 w-3.5 text-red-600 shrink-0" />
                <span>Mẫu tên file khi xuất chuẩn:</span>
              </div>
              <code className="font-mono font-bold text-red-700 text-[11px] bg-white px-2 py-0.5 rounded border border-red-200 shadow-2xs">
                {preferredCommand ? `${preferredCommand.toLowerCase()}-tên-chức-năng.lsp` : "dt-tính diện tích.lsp"}
              </code>
            </div>

            {/* Custom requirements / edge cases */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                4. Yêu cầu kỹ thuật nâng cao (Tùy chọn):
              </label>
              <input
                type="text"
                value={customRequirements}
                onChange={(e) => setCustomRequirements(e.target.value)}
                placeholder="VD: Tạo riêng layer 'TALUY_LINE' màu đỏ, tự động Undo 1 bước..."
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              id="btn-generate-lisp"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 px-4 text-sm font-bold text-white shadow-md shadow-red-600/30 hover:bg-red-700 hover:shadow-red-600/40 disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang tổng hợp cú pháp AutoLISP chuẩn xác...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Sinh Mã AutoLISP & Xuất File .LSP</span>
                </>
              )}
            </button>

            {/* AutoCAD Compatibility Guarantee */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Cam kết tương thích 100% mọi phiên bản AutoCAD (2007 - 2026) & AutoCAD LT</span>
              </div>
              <span className="text-slate-400">Chuẩn hóa Visual LISP & Unicode BOM</span>
            </div>
          </form>

          {/* Quick CAD Usage Box */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-red-600" />
              <span>Quy trình nạp vào AutoCAD siêu tốc</span>
            </h3>
            <ol className="space-y-2 text-xs text-slate-600 list-decimal list-inside">
              <li>Nhấn <strong>Tải .LSP</strong> để lưu file mã nguồn về máy tính.</li>
              <li>Mở AutoCAD, kéo thả file <code className="font-mono text-red-600 font-bold">.lsp</code> thẳng vào vùng vẽ (hoặc gõ lệnh <code className="font-mono text-red-600 font-bold">APPLOAD</code>).</li>
              <li>Gõ đúng tên lệnh hiển thị ở ô lệnh và bắt đầu vẽ ngay.</li>
            </ol>
            <button
              onClick={onOpenGuide}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 pt-1"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Xem hướng dẫn nạp tự động vĩnh viễn (Startup Suite) ➔</span>
            </button>
          </div>
        </div>

        {/* Right Column: Code Output & CAD Guide */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Top Meta info */}
              <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-red-100 text-red-800 text-[11px] font-bold px-2 py-0.5">
                        {result.category}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {result.compatibleCAD}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mt-1">
                      {result.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {result.description}
                    </p>
                  </div>

                  {/* Actions: Save & Download */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveCurrentLisp}
                      id="btn-save-to-library"
                      disabled={savedSuccess}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition shadow-xs ${
                        savedSuccess
                          ? "bg-emerald-600 text-white"
                          : "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      }`}
                    >
                      {savedSuccess ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Đã lưu vào kho</span>
                        </>
                      ) : (
                        <>
                          <FolderPlus className="h-4 w-4 text-red-600" />
                          <span>Lưu thư viện cá nhân</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() =>
                        downloadLispFile(result.commandName, result.code, result.title)
                      }
                      title={`Tải file: ${formatStandardLispFileName(result.commandName, result.title)}`}
                      className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      <span>Xuất {formatStandardLispFileName(result.commandName, result.title)}</span>
                    </button>
                  </div>
                </div>

                {/* Steps and Tips */}
                {result.steps && result.steps.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
                    <div className="text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5 text-red-600" />
                      <span>Các bước thực hiện trên AutoCAD:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                      {result.steps.map((step, idx) => (
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
              </div>

              {/* Code Viewer */}
              <LispCodeViewer
                code={result.code}
                commandName={result.commandName}
                title={result.title}
                onCodeChange={handleUpdateCode}
              />
            </div>
          ) : (
            /* Empty State Placeholder */
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shadow-inner">
                <Sparkles className="h-8 w-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Sẵn sàng sinh mã AutoLISP chuẩn
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Nhập yêu cầu vào ô bên trái hoặc chọn 1 trong các mẫu gợi ý để hệ thống AI tạo mã AutoLISP chuẩn xác kèm bộ bắt lỗi và trình xuất file <code className="text-red-600 font-mono">.lsp</code>.
                </p>
              </div>

              {/* Features Pill list */}
              <div className="pt-4 flex flex-wrap justify-center gap-2 text-[11px] font-medium text-slate-600">
                <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" /> Tự động reset OSMODE & CMDECHO
                </span>
                <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Hỗ trợ Undo 1 bước an toàn
                </span>
                <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Tương thích AutoCAD 2007 - 2026
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
