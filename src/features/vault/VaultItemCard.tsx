"use client";

import React from "react";
import {
  KeyRound,
  FileText,
  CreditCard,
  Code2,
  Wifi,
  UserCheck,
  FolderLock,
  Copy,
  Star,
  Edit2,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { DecryptedVaultItem } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { useVault } from "./VaultContext";

interface VaultItemCardProps {
  item: DecryptedVaultItem;
  onClick: () => void;
  onEdit?: (item: DecryptedVaultItem) => void;
  onDelete?: (item: DecryptedVaultItem) => void;
  onTagClick?: (tag: string) => void;
}

export function VaultItemCard({ item, onClick, onEdit, onDelete, onTagClick }: VaultItemCardProps) {
  const { toggleFavorite, copySecret } = useVault();

  const iconMap = {
    login: KeyRound,
    note: FileText,
    card: CreditCard,
    apiKey: Code2,
    wifi: Wifi,
    identity: UserCheck,
    custom: FolderLock,
  };

  const Icon = iconMap[item.type] || KeyRound;
  const d = item.data as any;

  // Determine primary display subtext
  let subtext = "";
  let primarySecret = "";

  if (item.type === "login") {
    subtext = d.username || d.url || "No username";
    primarySecret = d.password || "";
  } else if (item.type === "note") {
    subtext = d.notes ? d.notes.slice(0, 45) + (d.notes.length > 45 ? "..." : "") : "Secure Note";
    primarySecret = d.notes || "";
  } else if (item.type === "card") {
    subtext = d.cardNumber ? `•••• ${d.cardNumber.slice(-4)}` : d.cardholderName || "Payment Card";
    primarySecret = d.cardNumber || "";
  } else if (item.type === "apiKey") {
    subtext = `${d.service || "Service"} (${d.environment || "prod"})`;
    primarySecret = d.apiKey || "";
  } else if (item.type === "wifi") {
    subtext = d.ssid || "Wi-Fi Network";
    primarySecret = d.password || "";
  } else if (item.type === "identity") {
    subtext = d.fullName || d.email || "Identity Record";
    primarySecret = d.passportId || d.email || "";
  } else if (item.type === "custom") {
    subtext = `${d.fields?.length || 0} secure fields`;
  }

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 hover:border-blue-500/30 transition-all duration-200 shadow-sm cursor-pointer"
    >
      <div className="flex items-center gap-3.5 min-w-0 pr-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-950/60 dark:group-hover:text-blue-400 transition-colors shrink-0">
          <Icon className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {item.name}
            </h4>
            {item.isFavorite && (
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
            {subtext}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Tag pills */}
        <div className="hidden sm:flex items-center gap-1 mr-1">
          {item.tags?.slice(0, 3).map((tag) => (
            <Tooltip key={tag} content={`Filter by tag #${tag}`} position="top">
              <button
                type="button"
                onClick={(e) => {
                  if (onTagClick) {
                    e.stopPropagation();
                    onTagClick(tag);
                  }
                }}
                className="hover:opacity-80 transition-opacity"
              >
                <Badge variant="slate" size="sm">
                  {tag}
                </Badge>
              </button>
            </Tooltip>
          ))}
        </div>

        {/* Quick copy secret button */}
        {primarySecret && (
          <Tooltip
            content={`Copy ${item.type === "login" ? "password" : "credential"}`}
            position="top"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                copySecret(primarySecret, item.type === "login" ? "Password" : "Secret");
              }}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              aria-label="Copy primary credential"
            >
              <Copy className="w-4 h-4" />
            </button>
          </Tooltip>
        )}

        {/* Direct Edit Item button */}
        {onEdit && (
          <Tooltip content="Edit item" position="top">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              aria-label="Edit Item"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </Tooltip>
        )}

        {/* Delete Item button */}
        {onDelete && (
          <Tooltip content="Delete item" position="top">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
              aria-label="Delete Item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Tooltip>
        )}

        {/* Favorite toggle button */}
        <Tooltip
          content={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
          position="top"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
            className={`p-2 rounded-xl transition-colors ${
              item.isFavorite
                ? "text-amber-500"
                : "text-slate-300 dark:text-slate-600 hover:text-amber-500"
            }`}
            aria-label={item.isFavorite ? "Unfavorite" : "Favorite"}
          >
            <Star className={`w-4 h-4 ${item.isFavorite ? "fill-amber-500" : ""}`} />
          </button>
        </Tooltip>

        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
}
