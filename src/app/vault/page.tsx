"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Lock,
  Sparkles,
  Layers,
  Star,
  ShieldAlert,
  X,
} from "lucide-react";
import { useVault } from "@/features/vault/VaultContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { VaultItemCard } from "@/features/vault/VaultItemCard";
import { VaultItemDetailModal } from "@/features/vault/VaultItemDetailModal";
import { AddEditItemModal } from "@/features/vault/AddEditItemModal";
import { UnlockModal } from "@/features/vault/UnlockModal";
import { PasswordGeneratorModal } from "@/components/ui/PasswordGeneratorModal";
import { DeleteConfirmModal } from "@/features/vault/DeleteConfirmModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { VaultItemType, DecryptedVaultItem } from "@/types";
import { VaultPageSkeleton } from "@/components/ui/Skeleton";
import { Tooltip } from "@/components/ui/Tooltip";

export default function VaultPage() {
  const { user, isUnlocked, items, isLoading, deleteVaultItem } = useVault();

  // Filter and search state
  const [selectedType, setSelectedType] = useState<VaultItemType | "all" | "favorites">("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<DecryptedVaultItem | null>(null);
  const [itemToView, setItemToView] = useState<DecryptedVaultItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<DecryptedVaultItem | null>(null);

  // Client-side local filtering (never sends search queries to server!)
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filter by favorites
      if (selectedType === "favorites" && !item.isFavorite) {
        return false;
      }
      // Filter by type
      if (selectedType !== "all" && selectedType !== "favorites" && item.type !== selectedType) {
        return false;
      }
      // Filter by tag
      if (selectedTag && !item.tags?.includes(selectedTag)) {
        return false;
      }
      // Filter by local search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const d = item.data as any;
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesUsername = d.username?.toLowerCase().includes(query);
        const matchesUrl = d.url?.toLowerCase().includes(query);
        const matchesService = d.service?.toLowerCase().includes(query);
        const matchesCard = d.cardholderName?.toLowerCase().includes(query);
        const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(query));

        return matchesName || matchesUsername || matchesUrl || matchesService || matchesCard || matchesTags;
      }
      return true;
    });
  }, [items, selectedType, selectedTag, searchQuery]);

  if (isLoading) {
    return <VaultPageSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Sign In to Access Vault
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
          Your credentials and encryption keys require authentication before unlocking.
        </p>
        <a href="/login">
          <Button size="md">Go to Login</Button>
        </a>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 w-full h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar for Desktop */}
      <Sidebar
        selectedType={selectedType}
        onSelectType={setSelectedType}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
      />

      {/* Main Vault Panel */}
      <div className="flex-1 flex flex-col min-w-0 p-4 sm:p-6 lg:p-8 max-w-6xl w-full h-full overflow-y-auto overflow-x-hidden pb-24 md:pb-8">
        {/* Top Header / Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>My Vault</span>
              {selectedType !== "all" && (
                <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                  {selectedType.toUpperCase()}
                </span>
              )}
              {selectedTag && (
                <Tooltip content="Clear tag filter" position="top">
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 hover:bg-blue-200 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 transition-colors"
                  >
                    <span>#{selectedTag}</span>
                    <X className="w-3 h-3" />
                  </button>
                </Tooltip>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isUnlocked
                ? `${filteredItems.length} items decrypted in memory`
                : "Vault is locked with AES-256-GCM"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip content="Create strong random passwords" position="bottom">
              <Button
                variant="outline"
                size="sm"
                icon={<Sparkles className="w-3.5 h-3.5 text-blue-500" />}
                onClick={() => setShowGeneratorModal(true)}
              >
                Password Generator
              </Button>
            </Tooltip>
            <Tooltip
              content={
                isUnlocked
                  ? "Store a new encrypted secret"
                  : "Unlock vault to store new items"
              }
              position="bottom"
            >
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                disabled={!isUnlocked}
                onClick={() => {
                  setItemToEdit(null);
                  setShowAddModal(true);
                }}
              >
                Add Item
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* Locked Vault Banner */}
        {!isUnlocked ? (
          <div className="p-8 my-auto rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Vault Is Locked
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6 leading-relaxed">
              Your encryption keys and plaintext entries are scrubbed from memory to protect your
              data against memory inspection and unauthorized access.
            </p>
            <UnlockButton />
          </div>
        ) : (
          <>
            {/* Search and Filter Bar */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Search decrypted vault (name, username, URL, tags)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                  className="rounded-2xl"
                />
              </div>

              {/* Quick filter pills on mobile */}
              <div className="flex md:hidden overflow-x-auto gap-1.5 pb-2">
                <button
                  onClick={() => setSelectedType("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedType === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedType("favorites")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedType === "favorites"
                      ? "bg-amber-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  ★ Favorites
                </button>
                <button
                  onClick={() => setSelectedType("login")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedType === "login"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Logins
                </button>
                <button
                  onClick={() => setSelectedType("card")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedType === "card"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setSelectedType("apiKey")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedType === "apiKey"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  API Keys
                </button>
              </div>
            </div>

            {/* Items List */}
            {filteredItems.length === 0 ? (
              <div className="py-16 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
                  <Layers className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {searchQuery ? "No matching credentials found" : "Your vault is empty"}
                </h4>
                <p className="text-xs text-slate-500 mt-1 mb-4 max-w-xs mx-auto">
                  {searchQuery
                    ? "Try adjusting your search terms or clearing the filter."
                    : "Add your first login, credit card, API key, or secure note to start protecting your digital life."}
                </p>
                {!searchQuery && (
                  <Button
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setItemToEdit(null);
                      setShowAddModal(true);
                    }}
                  >
                    Add Item Now
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {filteredItems.map((item) => (
                  <VaultItemCard
                    key={item.id}
                    item={item}
                    onClick={() => setItemToView(item)}
                    onEdit={(item) => {
                      setItemToEdit(item);
                      setShowAddModal(true);
                    }}
                    onDelete={(item) => setItemToDelete(item)}
                    onTagClick={(tag) => setSelectedTag(tag)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AddEditItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        itemToEdit={itemToEdit}
        defaultType={selectedType !== "all" && selectedType !== "favorites" ? selectedType : "login"}
      />

      <VaultItemDetailModal
        isOpen={!!itemToView}
        item={itemToView}
        onClose={() => setItemToView(null)}
        onEdit={(item) => {
          setItemToView(null);
          setItemToEdit(item);
          setShowAddModal(true);
        }}
        onTagClick={(tag) => {
          setItemToView(null);
          setSelectedTag(tag);
        }}
      />

      <PasswordGeneratorModal
        isOpen={showGeneratorModal}
        onClose={() => setShowGeneratorModal(false)}
      />

      {/* Delete Confirmation Popup */}
      <DeleteConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={async () => {
          if (itemToDelete) {
            await deleteVaultItem(itemToDelete.id);
          }
        }}
        itemName={itemToDelete?.name || ""}
        itemType={itemToDelete?.type}
      />

      {/* Mobile Navigation */}
      <MobileNav
        onAddItem={() => {
          setItemToEdit(null);
          setShowAddModal(true);
        }}
        onOpenGenerator={() => setShowGeneratorModal(true)}
      />
    </div>
  );
}

function UnlockButton() {
  const [showUnlock, setShowUnlock] = useState(false);

  return (
    <>
      <Button
        size="lg"
        icon={<Lock className="w-4 h-4" />}
        onClick={() => setShowUnlock(true)}
      >
        Enter Master Password
      </Button>
      <UnlockModal isOpen={showUnlock} onClose={() => setShowUnlock(false)} />
    </>
  );
}
