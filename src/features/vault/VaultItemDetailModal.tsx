"use client";

import React, { useState } from "react";
import {
  KeyRound,
  FileText,
  CreditCard,
  Code2,
  Wifi,
  UserCheck,
  FolderLock,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Edit2,
  Trash2,
  Star,
  Clock,
  Tag,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { DecryptedVaultItem } from "@/types";
import { useVault } from "./VaultContext";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

interface VaultItemDetailModalProps {
  item: DecryptedVaultItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: DecryptedVaultItem) => void;
  onTagClick?: (tag: string) => void;
}

export function VaultItemDetailModal({
  item,
  isOpen,
  onClose,
  onEdit,
  onTagClick,
}: VaultItemDetailModalProps) {
  const { copySecret, deleteVaultItem, toggleFavorite } = useVault();
  const [revealedFields, setRevealedFields] = useState<Record<string, boolean>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!item) return null;

  const toggleReveal = (fieldKey: string) => {
    setRevealedFields((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteVaultItem(item.id);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    onClose();
  };

  const d = item.data as any;

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.name}
      description={`Encrypted ${item.type.toUpperCase()} record`}
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Header Badges & Actions */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="blue">{item.type.toUpperCase()}</Badge>
                {item.isFavorite && <Badge variant="amber">FAVORITE</Badge>}
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                Updated {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip
              content={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
              position="bottom"
            >
              <button
                onClick={() => toggleFavorite(item.id)}
                className={`p-2 rounded-lg border transition-colors ${
                  item.isFavorite
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                    : "border-slate-200 dark:border-slate-800 text-slate-400 hover:text-amber-500"
                }`}
                aria-label={item.isFavorite ? "Unfavorite" : "Favorite"}
              >
                <Star className={`w-4 h-4 ${item.isFavorite ? "fill-amber-500" : ""}`} />
              </button>
            </Tooltip>
            <Tooltip content="Edit item" position="bottom">
              <button
                onClick={() => {
                  onClose();
                  onEdit(item);
                }}
                className="p-2 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                aria-label="Edit Item"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip content="Delete item" position="bottom">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-600 transition-colors"
                aria-label="Delete Item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Delete Confirmation Alert */}
        {showDeleteConfirm && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2">
            <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">
              Permanently delete this item? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="danger" isLoading={isDeleting} onClick={handleDelete}>
                Yes, Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Sensitive Fields Rendering */}
        <div className="space-y-3">
          {item.type === "login" && (
            <>
              {d.username && (
                <FieldRow
                  label="Username / Email"
                  value={d.username}
                  onCopy={() => copySecret(d.username, "Username")}
                />
              )}
              {d.password && (
                <FieldRow
                  label="Password"
                  value={d.password}
                  isSecret
                  isRevealed={revealedFields["password"]}
                  onToggleReveal={() => toggleReveal("password")}
                  onCopy={() => copySecret(d.password, "Password")}
                />
              )}
              {d.url && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Website URL
                    </span>
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 break-all">
                      {d.url}
                    </span>
                  </div>
                  <a
                    href={d.url.startsWith("http") ? d.url : `https://${d.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </>
          )}

          {item.type === "card" && (
            <>
              {d.cardholderName && (
                <FieldRow
                  label="Cardholder"
                  value={d.cardholderName}
                  onCopy={() => copySecret(d.cardholderName, "Cardholder")}
                />
              )}
              {d.cardNumber && (
                <FieldRow
                  label={`${d.cardType || "Card"} Number`}
                  value={d.cardNumber}
                  isSecret
                  isRevealed={revealedFields["card"]}
                  onToggleReveal={() => toggleReveal("card")}
                  onCopy={() => copySecret(d.cardNumber, "Card Number")}
                />
              )}
              <div className="grid grid-cols-2 gap-3">
                {d.expiry && <FieldRow label="Expires" value={d.expiry} />}
                {d.cvvPin && (
                  <FieldRow
                    label="CVV / PIN"
                    value={d.cvvPin}
                    isSecret
                    isRevealed={revealedFields["cvv"]}
                    onToggleReveal={() => toggleReveal("cvv")}
                    onCopy={() => copySecret(d.cvvPin, "CVV")}
                  />
                )}
              </div>
            </>
          )}

          {item.type === "apiKey" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Service" value={d.service} />
                <FieldRow label="Environment" value={d.environment?.toUpperCase()} />
              </div>
              {d.apiKey && (
                <FieldRow
                  label="API Key"
                  value={d.apiKey}
                  isSecret
                  isRevealed={revealedFields["apiKey"]}
                  onToggleReveal={() => toggleReveal("apiKey")}
                  onCopy={() => copySecret(d.apiKey, "API Key")}
                />
              )}
              {d.secret && (
                <FieldRow
                  label="Secret Token"
                  value={d.secret}
                  isSecret
                  isRevealed={revealedFields["secret"]}
                  onToggleReveal={() => toggleReveal("secret")}
                  onCopy={() => copySecret(d.secret, "Secret Token")}
                />
              )}
              {d.endpoint && <FieldRow label="Endpoint" value={d.endpoint} />}
            </>
          )}

          {item.type === "wifi" && (
            <>
              <FieldRow
                label="SSID"
                value={d.ssid}
                onCopy={() => copySecret(d.ssid, "Wi-Fi SSID")}
              />
              <FieldRow
                label="Password"
                value={d.password}
                isSecret
                isRevealed={revealedFields["wifi"]}
                onToggleReveal={() => toggleReveal("wifi")}
                onCopy={() => copySecret(d.password, "Wi-Fi Password")}
              />
              <FieldRow label="Protocol" value={d.securityType} />
            </>
          )}

          {item.type === "identity" && (
            <>
              <FieldRow label="Full Name" value={d.fullName} />
              {d.email && (
                <FieldRow label="Email" value={d.email} onCopy={() => copySecret(d.email, "Email")} />
              )}
              {d.phone && (
                <FieldRow label="Phone" value={d.phone} onCopy={() => copySecret(d.phone, "Phone")} />
              )}
              {d.passportId && (
                <FieldRow
                  label="ID Number"
                  value={d.passportId}
                  isSecret
                  isRevealed={revealedFields["id"]}
                  onToggleReveal={() => toggleReveal("id")}
                  onCopy={() => copySecret(d.passportId, "ID Number")}
                />
              )}
              {d.address && <FieldRow label="Address" value={d.address} />}
            </>
          )}

          {item.type === "custom" && d.fields && (
            <div className="space-y-2">
              {d.fields.map((field: any) => (
                <FieldRow
                  key={field.id}
                  label={field.label || "Custom Field"}
                  value={field.value}
                  isSecret={field.isSecret}
                  isRevealed={revealedFields[field.id]}
                  onToggleReveal={() => toggleReveal(field.id)}
                  onCopy={() => copySecret(field.value, field.label)}
                />
              ))}
            </div>
          )}

          {/* Secure Notes */}
          {d.notes && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Encrypted Notes
              </span>
              <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-mono">
                {d.notes}
              </p>
            </div>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span>Tags (click to filter)</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (onTagClick) {
                        onTagClick(tag);
                      }
                    }}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <Badge variant="blue">
                      #{tag}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            size="sm"
            variant="ghost"
            icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={<Edit2 className="w-3.5 h-3.5" />}
              onClick={() => {
                onClose();
                onEdit(item);
              }}
            >
              Edit Item
            </Button>
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        itemName={item.name}
        itemType={item.type}
      />
    </Modal>
  );
}

function FieldRow({
  label,
  value,
  isSecret = false,
  isRevealed = false,
  onToggleReveal,
  onCopy,
}: {
  label: string;
  value: string;
  isSecret?: boolean;
  isRevealed?: boolean;
  onToggleReveal?: () => void;
  onCopy?: () => void;
}) {
  return (
    <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-between">
      <div className="overflow-hidden pr-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          {label}
        </span>
        <span className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200 truncate block">
          {isSecret && !isRevealed ? "••••••••••••••••" : value || "—"}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {isSecret && onToggleReveal && (
          <Tooltip content={isRevealed ? "Mask value" : "Reveal value"} position="left">
            <button
              onClick={onToggleReveal}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
              aria-label={isRevealed ? "Mask value" : "Reveal value"}
            >
              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </Tooltip>
        )}
        {onCopy && (
          <Tooltip content={`Copy ${label}`} position="left">
            <button
              onClick={onCopy}
              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
              aria-label={`Copy ${label}`}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
