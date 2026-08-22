import React, { useState } from "react";
import {
  Compass,
  Code2,
  FolderHeart,
  Wrench,
  History,
  BookOpen,
  Sparkles,
  User,
  DownloadCloud,
  UploadCloud,
  ChevronDown,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { UserProfile } from "../types";

export type ActiveTabType =
  | "generator"
  | "suggestions"
  | "library"
  | "debugger"
  | "version-control"
  | "guide";

interface HeaderProps {
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  currentUser: UserProfile;
  availableUsers: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onExportBackup: () => void;
  onImportBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  availableUsers,
  onSelectUser,
  onExportBackup,
  onImportBackup,
  savedCount,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    {
      id: "generator" as ActiveTabType,
      label: "Tạo LISP AI",
      icon: Sparkles,
      badge: "AI 3.7",
    },
    {
      id: "suggestions" as ActiveTabType,
      label: "Gợi Ý Lệnh Theo Việc",
      icon: Compass,
    },
    {
      id: "library" as ActiveTabType,
      label: "Thư Viện Cá Nhân",
      icon: FolderHeart,
      count: savedCount,
    },
    {
      id: "debugger" as ActiveTabType,
      label: "Sửa & Tối Ưu LISP",
      icon: Wrench,
    },
    {
      id: "version-control" as ActiveTabType,
      label: "Quản Lý Phiên Bản",
      icon: History,
    },
    {
      id: "guide" as ActiveTabType,
      label: "Cẩm Nang APPLOAD",
      icon: BookOpen,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-red-100 bg-white/95 backdrop-blur shadow-sm">
      {/* Top Banner */}
      <div className="bg-red-600 text-white px-4 py-1 text-xs flex items-center justify-between font-medium">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>Hệ Thống Tự Động Hóa Thiết Kế AutoCAD & Civil 3D Chuyên Sâu Ngành Xây Dựng Giao Thông</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-red-100 text-[11px]">
          <span>⚡ Tương thích AutoCAD 2007 - 2026</span>
          <span>🛡️ Chuẩn cú pháp & Bắt lỗi *error*</span>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("generator")}>
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white shadow-md shadow-red-500/20 ring-2 ring-red-500/30">
              <Code2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  AUTOLISP <span className="text-red-600">PRO</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                  Civil & Bridge CAD
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                AI Lisp Generator & Repository for Engineers
              </p>
            </div>
          </div>

          {/* User Profile & Backup controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Backup/Restore */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
              <button
                onClick={onExportBackup}
                title="Sao lưu toàn bộ thư viện Lisp sang file JSON"
                className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-red-600 px-2 py-1 rounded hover:bg-white transition"
              >
                <DownloadCloud className="h-3.5 w-3.5" />
                <span>Sao lưu</span>
              </button>
              <label
                title="Phục hồi thư viện Lisp từ file JSON backup"
                className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-red-600 px-2 py-1 rounded hover:bg-white cursor-pointer transition"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Nhập kho</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            {/* Account Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50/50 p-1.5 sm:px-3 sm:py-1.5 text-left hover:bg-red-50 hover:border-red-200 transition"
              >
                <div className="h-8 w-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {currentUser.avatar}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-red-600 font-medium truncate max-w-[130px]">
                    {currentUser.role}
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">Tài khoản Kỹ sư CAD</p>
                    <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded">
                      <Layers className="h-3.5 w-3.5 text-red-500" />
                      <span>{currentUser.department} - {currentUser.company}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Chuyển đổi hồ sơ chuyên ngành:
                    </p>
                    {availableUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSelectUser(u);
                          setShowUserMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left transition ${
                          u.id === currentUser.id
                            ? "bg-red-50 text-red-700 font-bold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                            {u.avatar}
                          </span>
                          <div>
                            <div>{u.name}</div>
                            <div className="text-[10px] text-slate-500 font-normal">{u.role}</div>
                          </div>
                        </div>
                        {u.id === currentUser.id && (
                          <CheckCircle2 className="h-4 w-4 text-red-600" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-1.5 px-3 py-1 text-[11px] text-slate-500">
                    Thư viện được phân tách & bảo mật theo tài khoản
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 pt-1 no-scrollbar border-t border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-red-600 text-white shadow-sm shadow-red-500/30"
                    : "text-slate-600 hover:text-red-600 hover:bg-red-50/60"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400 group-hover:text-red-500"}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      isActive ? "bg-white/20 text-white" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-white text-red-600" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
