import React, { useState, useEffect } from "react";
import { Header, ActiveTabType } from "./components/Header";
import { LispGenerator } from "./components/LispGenerator";
import { SmartSuggestions } from "./components/SmartSuggestions";
import { LispLibrary } from "./components/LispLibrary";
import { LispDebugger } from "./components/LispDebugger";
import { VersionControlModal } from "./components/VersionControlModal";
import { ApploadGuideModal } from "./components/ApploadGuideModal";
import { ViewLispModal } from "./components/ViewLispModal";
import { AddLispModal } from "./components/AddLispModal";
import { INITIAL_LISPS } from "./data/initialLisps";
import { INITIAL_USERS } from "./data/initialUsers";
import { LispItem, LispCategory, LispVersion, UserProfile } from "./types";
import { exportLibraryToJson } from "./utils/lispUtils";
import {
  Sparkles,
  Layers,
  HelpCircle,
  ShieldCheck,
  CheckCircle,
  FileCode2,
  ExternalLink,
} from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("autolisp_current_user");
    return saved ? JSON.parse(saved) : INITIAL_USERS[0];
  });

  const [availableUsers] = useState<UserProfile[]>(INITIAL_USERS);

  const [activeTab, setActiveTab] = useState<ActiveTabType>("generator");

  // Load LISPs from localStorage or initial dataset
  const [lisps, setLisps] = useState<LispItem[]>(() => {
    const saved = localStorage.getItem(`autolisp_library_${currentUser.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved lisps", e);
      }
    }
    return INITIAL_LISPS;
  });

  // Modals state
  const [versionControlLisp, setVersionControlLisp] = useState<LispItem | null>(null);
  const [viewingLisp, setViewingLisp] = useState<LispItem | null>(null);
  const [isAddingLisp, setIsAddingLisp] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem("autolisp_current_user", JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`autolisp_library_${currentUser.id}`, JSON.stringify(lisps));
  }, [lisps, currentUser.id]);

  // Handle user switch
  const handleSelectUser = (user: UserProfile) => {
    setCurrentUser(user);
    const userLisps = localStorage.getItem(`autolisp_library_${user.id}`);
    if (userLisps) {
      try {
        setLisps(JSON.parse(userLisps));
      } catch (e) {
        setLisps(INITIAL_LISPS);
      }
    } else {
      setLisps(INITIAL_LISPS);
    }
  };

  // Add/Save Lisp to personal library
  const handleSaveToLibrary = (
    itemData: Omit<LispItem, "id" | "createdAt" | "updatedAt" | "versions">
  ) => {
    const newId = `lisp-${Date.now()}`;
    const initialVersion: LispVersion = {
      versionId: `v1-${Date.now()}`,
      versionNumber: "v1.0.0",
      timestamp: Date.now(),
      changelog: "Khởi tạo mã nguồn từ AI Generator.",
      code: itemData.code,
      commandName: itemData.commandName,
      author: currentUser.name,
    };

    const newItem: LispItem = {
      ...itemData,
      id: newId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isFavorite: false,
      versions: [initialVersion],
    };

    setLisps((prev) => [newItem, ...prev]);
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string) => {
    setLisps((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  // Delete Lisp
  const handleDeleteLisp = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa Lisp này khỏi thư viện cá nhân?")) {
      setLisps((prev) => prev.filter((item) => item.id !== id));
      if (viewingLisp?.id === id) setViewingLisp(null);
      if (versionControlLisp?.id === id) setVersionControlLisp(null);
    }
  };

  // Update existing Lisp
  const handleUpdateLisp = (updated: LispItem) => {
    setLisps((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    setViewingLisp(updated);
  };

  // Create a new version commit
  const handleCreateNewVersion = (
    lispId: string,
    newCode: string,
    changelog: string,
    commandName: string
  ) => {
    setLisps((prev) =>
      prev.map((item) => {
        if (item.id === lispId) {
          const currentCount = item.versions ? item.versions.length : 1;
          const nextVerNum = `v1.${currentCount}.0`;
          const newVersion: LispVersion = {
            versionId: `ver-${Date.now()}`,
            versionNumber: nextVerNum,
            timestamp: Date.now(),
            changelog,
            code: newCode,
            commandName,
            author: currentUser.name,
          };

          const updatedVersions = [...(item.versions || []), newVersion];
          const updatedItem = {
            ...item,
            code: newCode,
            commandName,
            updatedAt: Date.now(),
            versions: updatedVersions,
          };

          if (versionControlLisp?.id === lispId) {
            setVersionControlLisp(updatedItem);
          }
          if (viewingLisp?.id === lispId) {
            setViewingLisp(updatedItem);
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  // Rollback to specific version
  const handleRollback = (lispId: string, version: LispVersion) => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn khôi phục mã nguồn về phiên bản ${version.versionNumber}?`
      )
    ) {
      setLisps((prev) =>
        prev.map((item) => {
          if (item.id === lispId) {
            const rollbackCommit: LispVersion = {
              versionId: `rollback-${Date.now()}`,
              versionNumber: `v1.${(item.versions?.length || 1) + 1}.0-rollback`,
              timestamp: Date.now(),
              changelog: `Rollback về phiên bản ${version.versionNumber} (${version.changelog})`,
              code: version.code,
              commandName: version.commandName,
              author: currentUser.name,
            };

            const updated = {
              ...item,
              code: version.code,
              commandName: version.commandName,
              updatedAt: Date.now(),
              versions: [...(item.versions || []), rollbackCommit],
            };

            if (versionControlLisp?.id === lispId) {
              setVersionControlLisp(updated);
            }
            if (viewingLisp?.id === lispId) {
              setViewingLisp(updated);
            }

            return updated;
          }
          return item;
        })
      );
    }
  };

  // Export and Import backup
  const handleExportBackup = () => {
    exportLibraryToJson({
      user: currentUser,
      exportedAt: new Date().toISOString(),
      lisps,
    });
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.lisps && Array.isArray(parsed.lisps)) {
          setLisps(parsed.lisps);
          alert(`Nhập thành công ${parsed.lisps.length} đoạn mã Lisp vào kho!`);
        } else {
          alert("File JSON không hợp lệ hoặc không đúng định dạng thư viện AutoLISP Pro.");
        }
      } catch (err) {
        console.error("Error importing JSON", err);
        alert("Lỗi khi đọc file sao lưu.");
      }
    };
    reader.readAsText(file);
  };

  // From Suggestions to Generator
  const handleSelectSuggestionPrompt = (
    prompt: string,
    category: LispCategory,
    command: string
  ) => {
    setActiveTab("generator");
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        availableUsers={availableUsers}
        onSelectUser={handleSelectUser}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        savedCount={lisps.length}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "generator" && (
          <LispGenerator
            onSaveToLibrary={handleSaveToLibrary}
            onOpenGuide={() => setIsGuideOpen(true)}
            userName={currentUser.name}
          />
        )}

        {activeTab === "suggestions" && (
          <SmartSuggestions onSelectPrompt={handleSelectSuggestionPrompt} />
        )}

        {activeTab === "library" && (
          <LispLibrary
            lisps={lisps}
            onToggleFavorite={handleToggleFavorite}
            onDeleteLisp={handleDeleteLisp}
            onOpenVersionControl={(lisp) => setVersionControlLisp(lisp)}
            onSelectLispForView={(lisp) => setViewingLisp(lisp)}
            onAddNewCustomLisp={() => setIsAddingLisp(true)}
          />
        )}

        {activeTab === "debugger" && (
          <LispDebugger
            onSaveToLibrary={handleSaveToLibrary}
            userName={currentUser.name}
          />
        )}

        {activeTab === "version-control" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Trung Tâm Quản Lý Phiên Bản Mã Nguồn (VCS & Auditing)
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Chọn một đoạn mã AutoLISP dưới đây để xem toàn bộ lịch sử commit, so sánh khác biệt mã (Line Diff) và khôi phục (Rollback) an toàn.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lisps.map((lisp) => (
                <div
                  key={lisp.id}
                  onClick={() => setVersionControlLisp(lisp)}
                  className="rounded-xl border border-slate-200 bg-white p-4 hover:border-red-400 hover:shadow-md transition cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                      {lisp.commandName}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {lisp.versions?.length || 1} phiên bản
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{lisp.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{lisp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "guide" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Cẩm Nang APPLOAD & Tối Ưu Hóa Quy Trình Thiết Kế CAD
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Hướng dẫn nạp AutoLISP vào AutoCAD, Civil 3D, BricsCAD, ZWCAD và các mẹo tăng tốc bản vẽ.
              </p>
            </div>

            {/* Render direct guide component inside */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <ApploadGuideModal isOpen={true} onClose={() => setActiveTab("generator")} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">AutoLISP Pro Studio</span>
            <span>•</span>
            <span>Chuyên gia tự động hóa CAD Cầu đường & Xây dựng</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="hover:text-red-600 font-medium transition flex items-center gap-1"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Hướng dẫn APPLOAD</span>
            </button>
            <span>•</span>
            <span className="text-emerald-600 flex items-center gap-1 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              Bảo mật mã nguồn cục bộ
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {versionControlLisp && (
        <VersionControlModal
          lisp={versionControlLisp}
          isOpen={true}
          onClose={() => setVersionControlLisp(null)}
          onRollback={handleRollback}
          onCreateNewVersion={handleCreateNewVersion}
        />
      )}

      {viewingLisp && (
        <ViewLispModal
          lisp={viewingLisp}
          isOpen={true}
          onClose={() => setViewingLisp(null)}
          onUpdateLisp={handleUpdateLisp}
          onOpenVersionControl={(lisp) => {
            setViewingLisp(null);
            setVersionControlLisp(lisp);
          }}
        />
      )}

      {isAddingLisp && (
        <AddLispModal
          isOpen={true}
          onClose={() => setIsAddingLisp(false)}
          onAddLisp={handleSaveToLibrary}
          userName={currentUser.name}
        />
      )}

      {isGuideOpen && (
        <ApploadGuideModal
          isOpen={true}
          onClose={() => setIsGuideOpen(false)}
        />
      )}
    </div>
  );
}
