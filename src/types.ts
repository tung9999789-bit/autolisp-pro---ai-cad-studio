export interface LispVersion {
  versionId: string;
  versionNumber: string; // e.g. "v1.0.0", "v1.1.0"
  timestamp: number;
  changelog: string;
  code: string;
  commandName: string;
  author: string;
}

export interface LispItem {
  id: string;
  title: string;
  commandName: string;
  category: LispCategory;
  description: string;
  code: string;
  steps: string[];
  features?: string[];
  tips?: string;
  compatibleCAD: string;
  isFavorite?: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  versions: LispVersion[];
  author: string;
  isCustom?: boolean;
}

export type LispCategory =
  | "Giao thông - Cầu đường"
  | "Hạ tầng & Trắc địa"
  | "Kết cấu & Xây dựng"
  | "Tiện ích vẽ nhanh"
  | "Quản lý Layer & Dim"
  | "Khác";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  company: string;
  avatar: string;
}

export interface SmartSuggestion {
  command: string;
  title: string;
  summary: string;
  benefit: string;
  promptTemplate: string;
  category: LispCategory;
}

export interface GenerateLispResponse {
  code: string;
  commandName: string;
  title: string;
  category: LispCategory;
  description: string;
  steps: string[];
  compatibleCAD: string;
  features?: string[];
  tips?: string;
  changelog?: string;
}

export interface DebugLispResponse {
  code: string;
  commandName: string;
  title: string;
  category: string;
  description: string;
  diagnosis: string[];
  steps: string[];
  compatibleCAD: string;
  changelog: string;
}
