import React, { useState } from "react";
import {
  FolderHeart,
  Search,
  Star,
  Download,
  Terminal,
  History,
  Trash2,
  Edit,
  Plus,
  Filter,
  CheckCircle2,
  ExternalLink,
  PackageCheck,
  FileCode2,
  Layers,
  Sparkles,
  Tag,
} from "lucide-react";
import { LispCategory, LispItem } from "../types";
import { downloadAllLispsAsZipOrBundle, downloadLispFile, formatStandardLispFileName } from "../utils/lispUtils";

interface LispLibraryProps {
  lisps: LispItem[];
  onToggleFavorite: (id: string) => void;
  onDeleteLisp: (id: string) => void;
  onOpenVersionControl: (lisp: LispItem) => void;
  onSelectLispForView: (lisp: LispItem) => void;
  onAddNewCustomLisp: () => void;
}

export const LispLibrary: React.FC<LispLibraryProps> = ({
  lisps,
  onToggleFavorite,
  onDeleteLisp,
  onOpenVersionControl,
  onSelectLispForView,
  onAddNewCustomLisp,
}) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const categories: string[] = [
    "all",
    "Giao thông - Cầu đường",
    "Hạ tầng & Trắc địa",
    "Kết cấu & Xây dựng",
    "Tiện ích vẽ nhanh",
    "Quản lý Layer & Dim",
  ];

  const filteredLisps = lisps.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.commandName.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const matchCategory =
      selectedCategory === "all" || item.category === selectedCategory;

    const matchFavorite = !onlyFavorites || item.isFavorite;

    return matchSearch && matchCategory && matchFavorite;
  });

  const handleDownloadMasterBundle = () => {
    downloadAllLispsAsZipOrBundle(
      lisps.map((l) => ({
        commandName: l.commandName,
        title: l.title,
        code: l.code,
      }))
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Stats */}
      <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-red-600 text-white flex items-center justify-center">
                <FolderHeart className="h-4 w-4" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Thư Viện AutoLISP Cá Nhân
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Quản lý kho mã nguồn AutoLISP cá nhân, lưu trữ theo phiên bản và xuất trọn gói vào AutoCAD.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadMasterBundle}
              id="btn-download-master-bundle"
              title="Tải 1 file .LSP chứa toàn bộ thư viện Lisp của bạn"
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
            >
              <PackageCheck className="h-4 w-4 text-red-400" />
              <span>Xuất Master Bundle .LSP ({lisps.length} lệnh)</span>
            </button>

            <button
              onClick={onAddNewCustomLisp}
              id="btn-add-custom-lisp"
              className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm LISP Mới</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Toolbar */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên lệnh (TL, TALUY...), từ khóa, chức năng..."
              className="w-full rounded-xl border border-slate-300 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-red-500 focus:outline-none"
            >
              <option value="all">Tất cả chuyên mục ({lisps.length})</option>
              <option value="Giao thông - Cầu đường">Giao thông - Cầu đường</option>
              <option value="Hạ tầng & Trắc địa">Hạ tầng & Trắc địa</option>
              <option value="Kết cấu & Xây dựng">Kết cấu & Xây dựng</option>
              <option value="Tiện ích vẽ nhanh">Tiện ích vẽ nhanh</option>
              <option value="Quản lý Layer & Dim">Quản lý Layer & Dim</option>
            </select>

            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                onlyFavorites
                  ? "border-amber-400 bg-amber-50 text-amber-700"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Star
                className={`h-3.5 w-3.5 ${
                  onlyFavorites ? "fill-amber-500 text-amber-500" : "text-slate-400"
                }`}
              />
              <span>Yêu thích ({lisps.filter((l) => l.isFavorite).length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lisp Cards Grid */}
      {filteredLisps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLisps.map((lisp) => {
            const versionCount = lisp.versions ? lisp.versions.length : 1;
            const currentVersion =
              lisp.versions && lisp.versions.length > 0
                ? lisp.versions[lisp.versions.length - 1].versionNumber
                : "v1.0.0";

            return (
              <div
                key={lisp.id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-red-300 hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top bar: Category + Command Alias Badge + Favorite */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-red-950 px-2.5 py-1 text-xs font-mono font-bold text-red-400 shadow-2xs">
                        {lisp.commandName}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 truncate max-w-[130px]">
                        {lisp.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onToggleFavorite(lisp.id)}
                        title={lisp.isFavorite ? "Bỏ yêu thích" : "Đánh dấu yêu thích"}
                        className="p-1 text-slate-400 hover:text-amber-500 transition"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            lisp.isFavorite
                              ? "fill-amber-400 text-amber-500"
                              : "text-slate-300"
                          }`}
                        />
                      </button>

                      {lisp.isCustom && (
                        <button
                          onClick={() => onDeleteLisp(lisp.id)}
                          title="Xóa Lisp này khỏi thư viện"
                          className="p-1 text-slate-300 hover:text-red-600 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3
                      onClick={() => onSelectLispForView(lisp)}
                      className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition cursor-pointer line-clamp-1"
                    >
                      {lisp.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {lisp.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {lisp.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer: Version & Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => onOpenVersionControl(lisp)}
                    title="Xem lịch sử phiên bản và so sánh Diff"
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 px-2 py-1 rounded transition"
                  >
                    <History className="h-3.5 w-3.5 text-red-500" />
                    <span>{currentVersion} ({versionCount} bản)</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectLispForView(lisp)}
                      title="Xem & Chỉnh sửa mã nguồn"
                      className="rounded-lg border border-slate-200 hover:border-red-400 p-1.5 text-slate-600 hover:text-red-600 transition"
                    >
                      <FileCode2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() =>
                        downloadLispFile(
                          lisp.commandName,
                          lisp.code,
                          lisp.title
                        )
                      }
                      title={`Tải file chuẩn: ${formatStandardLispFileName(lisp.commandName, lisp.title)}`}
                      className="flex items-center gap-1 rounded-lg bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 text-xs font-bold shadow-2xs transition cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>.LSP</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <div className="h-12 w-12 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Không tìm thấy LISP nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Không có đoạn mã nào khớp với từ khóa "{search}". Hãy thử tìm với tên lệnh hoặc chuyển đổi bộ lọc.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedCategory("all");
              setOnlyFavorites(false);
            }}
            className="text-xs font-bold text-red-600 hover:underline"
          >
            Xóa bộ lọc tìm kiếm
          </button>
        </div>
      )}
    </div>
  );
};
