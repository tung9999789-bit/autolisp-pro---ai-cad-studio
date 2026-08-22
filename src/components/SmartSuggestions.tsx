import React, { useState } from "react";
import {
  Compass,
  Sparkles,
  ArrowRight,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  Zap,
  Loader2,
  Lightbulb,
  FileCode2,
} from "lucide-react";
import { SMART_WORKFLOW_SUGGESTIONS } from "../data/initialLisps";
import { LispCategory } from "../types";

interface SmartSuggestionsProps {
  onSelectPrompt: (prompt: string, category: LispCategory, preferredCommand: string) => void;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ onSelectPrompt }) => {
  const [taskQuery, setTaskQuery] = useState("");
  const [field, setField] = useState<LispCategory>("Giao thông - Cầu đường");
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearchAiSuggestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/lisp/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskDescription: taskQuery,
          field,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Không thể lấy gợi ý giải pháp.");
      }

      setAiSuggestions(data.data);
    } catch (err: any) {
      console.error("Error suggesting LISP:", err);
      setError(err?.message || "Đã xảy ra lỗi khi tìm giải pháp. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Search Header Banner */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white via-red-50/50 to-slate-50 p-6 shadow-sm">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
            <Compass className="h-3.5 w-3.5" />
            <span>Hệ Thống Gợi Ý Lệnh Theo Mô Tả Công Việc Cụ Thể</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Tìm Giải Pháp Tự Động Hóa CAD Cho Nhiệm Vụ Của Bạn
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Bạn đang mất nhiều thời gian cho tác vụ nào trong đồ án / hồ sơ thiết kế? Hãy mô tả công việc đang làm (ví dụ: bóc khối lượng taluy, đánh số cọc móng, vẽ trắc ngang cống, căn lề bản vẽ...), hệ thống AI sẽ phân tích và đề xuất các giải pháp LISP tối ưu nhất.
          </p>

          {/* Interactive Search Bar */}
          <form onSubmit={handleSearchAiSuggestions} className="pt-2 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={taskQuery}
                onChange={(e) => setTaskQuery(e.target.value)}
                placeholder="Nhập tác vụ bạn đang cần làm trong CAD (VD: tính diện tích đào đắp trắc ngang)..."
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 shadow-2xs"
              />
            </div>
            <select
              value={field}
              onChange={(e) => setField(e.target.value as LispCategory)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-red-500 focus:outline-none"
            >
              <option value="Giao thông - Cầu đường">Giao thông - Cầu đường</option>
              <option value="Hạ tầng & Trắc địa">Hạ tầng & Trắc địa</option>
              <option value="Kết cấu & Xây dựng">Kết cấu & Xây dựng</option>
              <option value="Tiện ích vẽ nhanh">Tiện ích vẽ nhanh</option>
            </select>
            <button
              type="submit"
              disabled={loading || !taskQuery.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang phân tích...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Tìm LISP Phù Hợp</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-3 flex items-start justify-between gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              <div className="flex items-start gap-2">
                <span className="font-bold">Lỗi:</span>
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={(e) => handleSearchAiSuggestions(e as any)}
                className="shrink-0 px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] transition cursor-pointer"
              >
                Thử lại
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic AI Suggestions Results */}
      {aiSuggestions && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-red-600" />
              <span>Gợi ý giải pháp AutoLISP cho: "{taskQuery}"</span>
            </h2>
            <span className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded">
              {aiSuggestions.length} giải pháp tìm thấy
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiSuggestions.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-red-100 bg-white p-5 shadow-sm hover:border-red-300 hover:shadow-md transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-red-950/90 text-red-300 font-mono font-bold text-xs px-2.5 py-0.5">
                      Lệnh: {item.command}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded">
                      <Zap className="h-3 w-3" /> {item.benefit}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.summary}</p>
                </div>

                <button
                  onClick={() => onSelectPrompt(item.promptTemplate, field, item.command)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-50 hover:bg-red-600 text-red-700 hover:text-white py-2 text-xs font-bold transition group"
                >
                  <span>Sinh Mã LISP Này Ngay</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Curated Workflows By Engineering Discipline */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-red-600" />
              <span>Quy Trình Tự Động Hóa Theo Từng Bộ Môn Kỹ Thuật</span>
            </h2>
            <p className="text-xs text-slate-500">
              Các gói gợi ý chuyên sâu giúp tối ưu hóa công tác thiết kế từ bình đồ đến chi tiết thi công.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {SMART_WORKFLOW_SUGGESTIONS.map((workflow, wIdx) => (
            <div
              key={wIdx}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 hover:border-red-200 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded">
                    {workflow.category}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {workflow.items.length} Lisp chuẩn
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{workflow.title}</h3>
                <p className="text-xs text-slate-500">{workflow.description}</p>
              </div>

              {/* Items List */}
              <div className="space-y-2.5 pt-2">
                {workflow.items.map((item, iIdx) => (
                  <div
                    key={iIdx}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 hover:bg-red-50/40 hover:border-red-200 transition"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-red-600 bg-white border border-red-200 px-1.5 py-0.2 rounded">
                          {item.command}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{item.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{item.benefit}</p>
                    </div>

                    <button
                      onClick={() =>
                        onSelectPrompt(item.promptTemplate, workflow.category, item.command)
                      }
                      title="Sử dụng mẫu này để tạo Lisp"
                      className="shrink-0 flex items-center gap-1 rounded-lg bg-white border border-slate-200 hover:border-red-500 hover:text-red-600 px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition"
                    >
                      <span>Tạo ngay</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
