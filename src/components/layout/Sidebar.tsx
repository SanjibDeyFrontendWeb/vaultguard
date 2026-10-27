"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  KeyRound,
  FileText,
  CreditCard,
  Code2,
  Wifi,
  UserCheck,
  FolderLock,
  Star,
  Tag,
  Shield,
  Settings,
  Layers,
  Plus,
  X,
  Check,
} from "lucide-react";
import { VaultItemType } from "@/types";
import { useVault } from "@/features/vault/VaultContext";
import { Tooltip } from "@/components/ui/Tooltip";

interface SidebarProps {
  selectedType: VaultItemType | "all" | "favorites";
  onSelectType: (type: VaultItemType | "all" | "favorites") => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

const DEFAULT_TAGS = ["Work", "Personal", "Development", "Finance", "Cloud"];

export function Sidebar({
  selectedType,
  onSelectType,
  selectedTag,
  onSelectTag,
}: SidebarProps) {
  const pathname = usePathname();
  const { items, isUnlocked } = useVault();

  // Custom tags management
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  // Load custom tags from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("vaultguard_custom_tags");
        if (saved) {
          setCustomTags(JSON.parse(saved));
        }
      } catch {}
    }
  }, []);

  const saveCustomTags = (tags: string[]) => {
    setCustomTags(tags);
    if (typeof window !== "undefined") {
      localStorage.setItem("vaultguard_custom_tags", JSON.stringify(tags));
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = newTagInput.trim();
    if (!cleanTag) return;

    // Check if tag already exists (case-insensitive)
    const exists = allTags.some((t) => t.toLowerCase() === cleanTag.toLowerCase());
    if (!exists) {
      const updated = [...customTags, cleanTag];
      saveCustomTags(updated);
    }
    setNewTagInput("");
    setIsAddingTag(false);
    onSelectTag(cleanTag);
  };

  const handleDeleteCustomTag = (e: React.MouseEvent, tagToDelete: string) => {
    e.stopPropagation();
    const updated = customTags.filter((t) => t !== tagToDelete);
    saveCustomTags(updated);
    if (selectedTag === tagToDelete) {
      onSelectTag(null);
    }
  };

  // Compute live item counts for categories
  const counts = {
    all: items.length,
    login: items.filter((i) => i.type === "login").length,
    note: items.filter((i) => i.type === "note").length,
    card: items.filter((i) => i.type === "card").length,
    apiKey: items.filter((i) => i.type === "apiKey").length,
    wifi: items.filter((i) => i.type === "wifi").length,
    identity: items.filter((i) => i.type === "identity").length,
    custom: items.filter((i) => i.type === "custom").length,
    favorites: items.filter((i) => i.isFavorite).length,
  };

  const navItems: Array<{
    id: VaultItemType | "all" | "favorites";
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count: number;
  }> = [
    { id: "all", label: "All Items", icon: Layers, count: counts.all },
    { id: "favorites", label: "Favorites", icon: Star, count: counts.favorites },
    { id: "login", label: "Logins", icon: KeyRound, count: counts.login },
    { id: "note", label: "Secure Notes", icon: FileText, count: counts.note },
    { id: "card", label: "Payment Cards", icon: CreditCard, count: counts.card },
    { id: "apiKey", label: "API Keys", icon: Code2, count: counts.apiKey },
    { id: "wifi", label: "Wi-Fi Networks", icon: Wifi, count: counts.wifi },
    { id: "identity", label: "Identities", icon: UserCheck, count: counts.identity },
    { id: "custom", label: "Custom Secure", icon: FolderLock, count: counts.custom },
  ];

  // Merge default tags, custom tags, and any tags on existing items
  const itemTags = Array.from(new Set(items.flatMap((i) => i.tags || [])));
  const allTags = Array.from(new Set([...DEFAULT_TAGS, ...customTags, ...itemTags]));

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 p-4 hidden md:flex md:flex-col justify-between h-[calc(100vh-4rem)] overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-6 pr-1">
        {/* Categories Section */}
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-2">
            Vault Categories
          </h3>
          <nav className="space-y-0.5" aria-label="Vault categories">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = selectedType === item.id && !selectedTag;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTag(null);
                    onSelectType(item.id);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {isUnlocked && (
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-md ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tags Section with Add Tag Option */}
        <div>
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Tags
            </h3>
            <Tooltip content="Add a new custom tag" position="left">
              <button
                onClick={() => setIsAddingTag(!isAddingTag)}
                className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tag</span>
              </button>
            </Tooltip>
          </div>

          {/* Inline Add Tag Form */}
          {isAddingTag && (
            <form onSubmit={handleAddTag} className="mb-2 px-1 flex items-center gap-1">
              <input
                type="text"
                placeholder="Tag name..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                autoFocus
                className="w-full text-xs rounded-lg border border-blue-500 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              <Tooltip content="Save tag" position="top">
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip content="Cancel" position="top">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTag(false);
                    setNewTagInput("");
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </form>
          )}

          <div className="space-y-0.5">
            {allTags.map((tag) => {
              const count = items.filter((i) => i.tags?.includes(tag)).length;
              const isActive = selectedTag === tag;
              const isCustom = customTags.includes(tag) && !DEFAULT_TAGS.includes(tag);

              return (
                <div
                  key={tag}
                  className="group relative flex items-center"
                >
                  <button
                    onClick={() => onSelectTag(isActive ? null : tag)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-slate-900 text-white dark:bg-slate-800"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{tag}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isUnlocked && count > 0 && (
                        <span className="text-[10px] text-slate-400 font-mono">{count}</span>
                      )}
                    </div>
                  </button>

                  {/* Delete button for user's custom tags on hover */}
                  {isCustom && (
                    <Tooltip content={`Remove tag "${tag}"`} position="left">
                      <button
                        onClick={(e) => handleDeleteCustomTag(e, tag)}
                        className="absolute right-1 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity z-10"
                        aria-label={`Remove tag "${tag}"`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Tooltip>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom App Navigation */}
      <div className="shrink-0 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
        <Link
          href="/security"
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
            pathname === "/security"
              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          }`}
        >
          <Shield className="w-4 h-4 text-blue-500" />
          <span>Security Center</span>
        </Link>
        <Link
          href="/settings"
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
            pathname === "/settings"
              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          }`}
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Settings & 2FA</span>
        </Link>
      </div>
    </aside>
  );
}
