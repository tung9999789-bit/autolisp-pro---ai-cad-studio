import React, { useState } from "react";
import {
  Plus,
  X,
  FileCode2,
  Terminal,
  Layers,
  Save,
  AlertCircle,
  Tag,
} from "lucide-react";
import { LispCategory, LispItem } from "../types";
import { extractCommandNameFromCode, formatStandardLispFileName } from "../utils/lispUtils";

interface AddLispModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLisp: (item: Omit<LispItem, "id" | "createdAt" | "updatedAt" | "versions">) => void;
  userName: string;
}

const COMMON_SHORTCUTS = ["DT", "TT", "VT", "VC", "KT", "TL", "TY", "TD", "ST", "CD", "TM", "LT"];

export const AddLispModal: React.FC<AddLispModalProps> = ({
  isOpen,
  onClose,
  onAddLisp,
  userName,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState("");
  const [commandName, setCommandName] = useState("");
  const [category, setCategory] = useState<LispCategory>("Giao thông - Cầu đường");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCodeBlur = () => {
    if (!commandName && code) {
      const extracted = extractCommandNameFromCode(code);
      if (extracted && extracted !== "LISP") {
        setCommandName(extracted);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) {
      setError("Vui lòng nhập đầy đủ tên Lisp và nội dung mã nguồn.");
      return;
    }

    const cleanCommand = (commandName.trim() || extractCommandNameFromCode(code) || "LISP").toUpperCase();

    onAddLisp({
      title: title.trim(),
      commandName: cleanCommand,
      category,
      description: description.trim() || "Mã AutoLISP do người dùng tự nhập vào thư viện.",
      code: code.trim(),
      steps: [`1. Gõ lệnh ${cleanCommand} và nhấn Enter`, "2. Thực hiện theo hướng dẫn trên Command"],
      compatibleCAD: "AutoCAD 2007 - 2026",
      tags: [cleanCommand, category, "Custom"],
      author: userName,
      isCustom: true,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="flex h-[88vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-700 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Thêm Đoạn Mã AutoLISP Mới Vào Thư Viện
              </h2>
              <p className="text-xs text-slate-500">
                Nhập hoặc dán đoạn mã Lisp của Kỹ sư để lưu trữ và chuẩn hóa tên file xuất.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Tên chức năng Lisp: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Tính diện tích, Vẽ tường bao, Khung tên..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Lệnh tắt CAD (Ưu tiên 2 ký tự):
                </label>
                <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1 rounded">2 ký tự</span>
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">c:</span>
                <input
                  type="text"
                  maxLength={6}
                  value={commandName}
                  onChange={(e) => setCommandName(e.target.value.toUpperCase())}
                  placeholder="DT, TT, VT, VC, KT, TL..."
                  className="w-full rounded-xl border border-slate-300 pl-7 pr-3 py-2 text-xs font-mono font-bold text-red-600 uppercase focus:border-red-500 focus:outline-none"
                />
              </div>
              <div className="pt-1 flex flex-wrap gap-1">
                {COMMON_SHORTCUTS.map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setCommandName(sc)}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border transition ${
                      commandName === sc ? "bg-red-600 text-white border-red-600" : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-red-50 hover:text-red-700"
                    }`}
                  >
                    {sc}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Chuyên mục:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as LispCategory)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:border-red-500 focus:outline-none"
              >
                <option value="Giao thông - Cầu đường">Giao thông - Cầu đường</option>
                <option value="Hạ tầng & Trắc địa">Hạ tầng & Trắc địa</option>
                <option value="Kết cấu & Xây dựng">Kết cấu & Xây dựng</option>
                <option value="Tiện ích vẽ nhanh">Tiện ích vẽ nhanh</option>
                <option value="Quản lý Layer & Dim">Quản lý Layer & Dim</option>
                <option value="Khác">Khác</option>
              </select>

              {/* Standard export preview */}
              <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 p-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1 font-semibold text-slate-700 mb-0.5">
                  <Tag className="h-3 w-3 text-red-600" />
                  <span>Tên file xuất chuẩn:</span>
                </div>
                <code className="text-red-700 font-mono font-bold text-[11px]">
                  {formatStandardLispFileName(commandName || "lisp", title || "chức năng")}
                </code>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Mô tả tóm tắt:</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Tính diện tích hình kín và chèn kết quả ra bản vẽ..."
              className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Nội dung mã nguồn AutoLISP (.lsp): <span className="text-red-500">*</span>
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onBlur={handleCodeBlur}
              rows={8}
              placeholder="(defun c:DT ( / ... ) ... )"
              className="w-full rounded-xl border border-slate-300 p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-700 transition"
            >
              <Save className="h-4 w-4" />
              <span>Lưu Vào Kho Cá Nhân</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
