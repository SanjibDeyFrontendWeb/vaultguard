"use client";

import React, { useState, useEffect } from "react";
import {
  KeyRound,
  FileText,
  CreditCard,
  Code2,
  Wifi,
  UserCheck,
  FolderLock,
  Plus,
  Trash2,
  Sparkles,
  Star,
  Tag,
  X,
  Check,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { PasswordGeneratorModal } from "@/components/ui/PasswordGeneratorModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { Badge } from "@/components/ui/Badge";
import {
  VaultItemType,
  DecryptedVaultItem,
  LoginItemData,
  NoteItemData,
  CardItemData,
  ApiKeyItemData,
  WifiItemData,
  IdentityItemData,
  CustomItemData,
  CustomField,
} from "@/types";
import { useVault } from "./VaultContext";

interface AddEditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: DecryptedVaultItem | null;
  defaultType?: VaultItemType;
}

const DEFAULT_SUGGESTED_TAGS = ["Work", "Personal", "Development", "Finance", "Cloud"];

export function AddEditItemModal({
  isOpen,
  onClose,
  itemToEdit,
  defaultType = "login",
}: AddEditItemModalProps) {
  const { createVaultItem, updateVaultItem, deleteVaultItem, items } = useVault();
  const [type, setType] = useState<VaultItemType>(defaultType);
  const [name, setName] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Tags state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [isAddingNewTag, setIsAddingNewTag] = useState(false);

  // Generator modal trigger
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorTarget, setGeneratorTarget] = useState<"password" | "apiKey" | "custom">("password");
  const [targetCustomFieldId, setTargetCustomFieldId] = useState<string | null>(null);

  // Form states per type
  // Login
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginUrl, setLoginUrl] = useState("");

  // Notes
  const [notesText, setNotesText] = useState("");

  // Cards
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardType, setCardType] = useState("Visa");

  // API Key
  const [apiService, setApiService] = useState("");
  const [apiEnvironment, setApiEnvironment] = useState<"production" | "staging" | "development" | "test">("production");
  const [apiKeyVal, setApiKeyVal] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState("");

  // Wi-Fi
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiSecurity, setWifiSecurity] = useState<"WPA2" | "WPA3" | "WEP" | "Open">("WPA2");

  // Identity
  const [idFullName, setIdFullName] = useState("");
  const [idEmail, setIdEmail] = useState("");
  const [idPhone, setIdPhone] = useState("");
  const [idPassport, setIdPassport] = useState("");
  const [idAddress, setIdAddress] = useState("");

  // Custom Fields
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  // Collect all existing tags across items + localStorage
  const existingTags = React.useMemo(() => {
    let saved: string[] = [];
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("vaultguard_custom_tags");
        if (stored) saved = JSON.parse(stored);
      } catch {}
    }
    const itemTags = items.flatMap((i) => i.tags || []);
    return Array.from(new Set([...DEFAULT_SUGGESTED_TAGS, ...saved, ...itemTags]));
  }, [items]);

  useEffect(() => {
    if (itemToEdit) {
      setType(itemToEdit.type);
      setName(itemToEdit.name);
      setIsFavorite(itemToEdit.isFavorite);
      setSelectedTags(itemToEdit.tags || []);

      const d = itemToEdit.data as any;
      if (itemToEdit.type === "login") {
        setLoginUsername(d.username || "");
        setLoginPassword(d.password || "");
        setLoginUrl(d.url || "");
        setNotesText(d.notes || "");
      } else if (itemToEdit.type === "note") {
        setNotesText(d.notes || "");
      } else if (itemToEdit.type === "card") {
        setCardholderName(d.cardholderName || "");
        setCardNumber(d.cardNumber || "");
        setCardExpiry(d.expiry || "");
        setCardCvv(d.cvvPin || "");
        setCardType(d.cardType || "Visa");
        setNotesText(d.notes || "");
      } else if (itemToEdit.type === "apiKey") {
        setApiService(d.service || "");
        setApiEnvironment(d.environment || "production");
        setApiKeyVal(d.apiKey || "");
        setApiSecret(d.secret || "");
        setApiEndpoint(d.endpoint || "");
        setNotesText(d.notes || "");
      } else if (itemToEdit.type === "wifi") {
        setWifiSsid(d.ssid || "");
        setWifiPassword(d.password || "");
        setWifiSecurity(d.securityType || "WPA2");
        setNotesText(d.notes || "");
      } else if (itemToEdit.type === "identity") {
        setIdFullName(d.fullName || "");
        setIdEmail(d.email || "");
        setIdPhone(d.phone || "");
        setIdPassport(d.passportId || "");
        setIdAddress(d.address || "");
        setNotesText(d.notes || "");
      } else if (itemToEdit.type === "custom") {
        setCustomFields(d.fields || []);
        setNotesText(d.notes || "");
      }
    } else {
      setType(defaultType);
      setName("");
      setIsFavorite(false);
      setSelectedTags([]);
      setCustomTagInput("");
      setLoginUsername("");
      setLoginPassword("");
      setLoginUrl("");
      setNotesText("");
      setCardholderName("");
      setCardNumber("");
      setCardExpiry("");
      setCardCvv("");
      setCardType("Visa");
      setApiService("");
      setApiEnvironment("production");
      setApiKeyVal("");
      setApiSecret("");
      setApiEndpoint("");
      setWifiSsid("");
      setWifiPassword("");
      setWifiSecurity("WPA2");
      setIdFullName("");
      setIdEmail("");
      setIdPhone("");
      setIdPassport("");
      setIdAddress("");
      setCustomFields([]);
    }
  }, [itemToEdit, defaultType, isOpen]);

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleCreateNewTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customTagInput.trim();
    if (!clean) return;

    if (!selectedTags.includes(clean)) {
      setSelectedTags((prev) => [...prev, clean]);
    }

    // Save to custom tags in localStorage
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("vaultguard_custom_tags");
        const parsed = stored ? JSON.parse(stored) : [];
        if (!parsed.includes(clean)) {
          localStorage.setItem("vaultguard_custom_tags", JSON.stringify([...parsed, clean]));
        }
      } catch {}
    }

    setCustomTagInput("");
    setIsAddingNewTag(false);
  };

  const handleAddCustomField = () => {
    setCustomFields((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        label: "",
        value: "",
        isSecret: false,
      },
    ]);
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpdateCustomField = (id: string, updates: Partial<CustomField>) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const handleApplyGeneratedPassword = (pwd: string) => {
    if (generatorTarget === "password") {
      setLoginPassword(pwd);
    } else if (generatorTarget === "apiKey") {
      setApiKeyVal(pwd);
    } else if (generatorTarget === "custom" && targetCustomFieldId) {
      handleUpdateCustomField(targetCustomFieldId, { value: pwd });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    const tags = selectedTags;

    let data: any = {};

    if (type === "login") {
      const loginData: LoginItemData = {
        username: loginUsername,
        password: loginPassword,
        url: loginUrl,
        notes: notesText,
      };
      data = loginData;
    } else if (type === "note") {
      const noteData: NoteItemData = { notes: notesText };
      data = noteData;
    } else if (type === "card") {
      const cardData: CardItemData = {
        cardholderName,
        cardNumber,
        expiry: cardExpiry,
        cvvPin: cardCvv,
        cardType,
        notes: notesText,
      };
      data = cardData;
    } else if (type === "apiKey") {
      const apiData: ApiKeyItemData = {
        service: apiService,
        environment: apiEnvironment,
        apiKey: apiKeyVal,
        secret: apiSecret,
        endpoint: apiEndpoint,
        notes: notesText,
      };
      data = apiData;
    } else if (type === "wifi") {
      const wifiData: WifiItemData = {
        ssid: wifiSsid,
        password: wifiPassword,
        securityType: wifiSecurity,
        notes: notesText,
      };
      data = wifiData;
    } else if (type === "identity") {
      const idData: IdentityItemData = {
        fullName: idFullName,
        email: idEmail,
        phone: idPhone,
        passportId: idPassport,
        address: idAddress,
        notes: notesText,
      };
      data = idData;
    } else if (type === "custom") {
      const customData: CustomItemData = {
        fields: customFields,
        notes: notesText,
      };
      data = customData;
    }

    let success = false;
    if (itemToEdit) {
      success = await updateVaultItem(itemToEdit.id, {
        name,
        type,
        data,
        tags,
        isFavorite,
      });
    } else {
      success = await createVaultItem(type, name, data, tags, isFavorite);
    }

    setIsSubmitting(false);
    if (success) onClose();
  };

  const typeOptions: Array<{ id: VaultItemType; label: string; icon: any }> = [
    { id: "login", label: "Login", icon: KeyRound },
    { id: "note", label: "Secure Note", icon: FileText },
    { id: "card", label: "Credit Card", icon: CreditCard },
    { id: "apiKey", label: "API Key", icon: Code2 },
    { id: "wifi", label: "Wi-Fi", icon: Wifi },
    { id: "identity", label: "Identity", icon: UserCheck },
    { id: "custom", label: "Custom", icon: FolderLock },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={itemToEdit ? `Edit ${itemToEdit.name}` : "Add Vault Item"}
        description="All item data is encrypted client-side using AES-256-GCM before transmission."
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selector (if creating new) */}
          {!itemToEdit && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Item Type
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {typeOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = type === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setType(opt.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/20"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Name & Favorite Header */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                label="Item Name / Title"
                placeholder="e.g. GitHub, AWS Prod, Home Wi-Fi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`mt-5 p-2.5 rounded-xl border transition-colors ${
                isFavorite
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                  : "border-slate-200 dark:border-slate-800 text-slate-400 hover:text-amber-500"
              }`}
              title={isFavorite ? "Favorited" : "Mark as favorite"}
            >
              <Star className={`w-5 h-5 ${isFavorite ? "fill-amber-500" : ""}`} />
            </button>
          </div>

          {/* Dynamic Forms by Type */}
          {type === "login" && (
            <div className="space-y-3.5 pt-1">
              <Input
                label="Username / Email"
                placeholder="sanjib@example.com"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
              />

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratorTarget("password");
                      setShowGenerator(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Strong
                  </button>
                </div>
                <PasswordInput
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter or generate password"
                />
                {loginPassword && <PasswordStrength password={loginPassword} />}
              </div>

              <Input
                label="Website URL"
                placeholder="https://github.com"
                value={loginUrl}
                onChange={(e) => setLoginUrl(e.target.value)}
              />
            </div>
          )}

          {type === "card" && (
            <div className="space-y-3.5 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Cardholder Name"
                  placeholder="John Doe"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                />
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Card Brand
                  </label>
                  <select
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="American Express">American Express</option>
                    <option value="Discover">Discover</option>
                    <option value="RuPay">RuPay</option>
                  </select>
                </div>
              </div>

              <Input
                label="Card Number"
                placeholder="•••• •••• •••• ••••"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Expiry Date"
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                />
                <PasswordInput
                  label="CVV / PIN"
                  placeholder="•••"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                />
              </div>
            </div>
          )}

          {type === "apiKey" && (
            <div className="space-y-3.5 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Service Provider"
                  placeholder="e.g. OpenAI, Stripe, AWS"
                  value={apiService}
                  onChange={(e) => setApiService(e.target.value)}
                />
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Environment
                  </label>
                  <select
                    value={apiEnvironment}
                    onChange={(e) => setApiEnvironment(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                    <option value="test">Test</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    API Key / Token
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratorTarget("apiKey");
                      setShowGenerator(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Secret
                  </button>
                </div>
                <PasswordInput
                  value={apiKeyVal}
                  onChange={(e) => setApiKeyVal(e.target.value)}
                  placeholder="sk_live_••••••••••••"
                />
              </div>

              <PasswordInput
                label="API Secret / Private Key (Optional)"
                placeholder="Secret payload..."
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
              />

              <Input
                label="API Endpoint URL"
                placeholder="https://api.service.com/v1"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
              />
            </div>
          )}

          {type === "wifi" && (
            <div className="space-y-3.5 pt-1">
              <Input
                label="Network SSID"
                placeholder="Office_5GHz"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
              />
              <PasswordInput
                label="Wi-Fi Password / Pre-shared Key"
                placeholder="••••••••"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
              />
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Security Protocol
                </label>
                <select
                  value={wifiSecurity}
                  onChange={(e) => setWifiSecurity(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="WPA2">WPA2-Personal</option>
                  <option value="WPA3">WPA3-Personal</option>
                  <option value="WEP">WEP</option>
                  <option value="Open">Open (No password)</option>
                </select>
              </div>
            </div>
          )}

          {type === "identity" && (
            <div className="space-y-3.5 pt-1">
              <Input
                label="Full Legal Name"
                placeholder="Jane Doe"
                value={idFullName}
                onChange={(e) => setIdFullName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Email"
                  placeholder="jane@example.com"
                  value={idEmail}
                  onChange={(e) => setIdEmail(e.target.value)}
                />
                <Input
                  label="Phone Number"
                  placeholder="+1 (555) 000-0000"
                  value={idPhone}
                  onChange={(e) => setIdPhone(e.target.value)}
                />
              </div>
              <PasswordInput
                label="Passport / SSN / ID Number"
                placeholder="ID Number"
                value={idPassport}
                onChange={(e) => setIdPassport(e.target.value)}
              />
              <Input
                label="Physical Address"
                placeholder="123 Financial Way, Suite 400"
                value={idAddress}
                onChange={(e) => setIdAddress(e.target.value)}
              />
            </div>
          )}

          {type === "custom" && (
            <div className="space-y-3.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Custom Secure Fields
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={handleAddCustomField}
                >
                  Add Field
                </Button>
              </div>

              {customFields.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  No custom fields added yet. Click &quot;Add Field&quot; to store arbitrary secure pairs.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {customFields.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40"
                    >
                      <input
                        type="text"
                        placeholder="Label (e.g. Server PIN)"
                        value={field.label}
                        onChange={(e) =>
                          handleUpdateCustomField(field.id, { label: e.target.value })
                        }
                        className="w-1/3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                      />
                      <input
                        type={field.isSecret ? "password" : "text"}
                        placeholder="Value"
                        value={field.value}
                        onChange={(e) =>
                          handleUpdateCustomField(field.id, { value: e.target.value })
                        }
                        className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                      />
                      <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.isSecret}
                          onChange={(e) =>
                            handleUpdateCustomField(field.id, { isSecret: e.target.checked })
                          }
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        Mask
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomField(field.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Secure Notes Area (for all item types) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Encrypted Notes
            </label>
            <textarea
              rows={type === "note" ? 5 : 2}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Notes encrypted along with credentials..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Interactive Tag Picker & Custom Tag Addition */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-500" />
                <span>Tags</span>
              </label>
              {!isAddingNewTag && (
                <button
                  type="button"
                  onClick={() => setIsAddingNewTag(true)}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create New Tag</span>
                </button>
              )}
            </div>

            {/* Currently selected tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-blue-50/40 dark:bg-blue-950/30 rounded-xl border border-blue-200/50 dark:border-blue-900/40">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider w-full mb-0.5">
                  Assigned Tags:
                </span>
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 text-white shadow-xs"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className="p-0.5 hover:bg-white/20 rounded-full transition-colors"
                      title={`Remove tag ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Inline Add New Tag Form */}
            {isAddingNewTag && (
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 animate-in fade-in">
                <input
                  type="text"
                  placeholder="New tag name (e.g. Gaming, Cloud, Banking)..."
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateNewTag(e);
                    }
                  }}
                  autoFocus
                  className="flex-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={handleCreateNewTag}
                >
                  Add
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingNewTag(false);
                    setCustomTagInput("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Suggested / Available tags chips */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5">
                Click to add / remove tags:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {existingTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        isSelected
                          ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700 font-semibold shadow-xs"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" /> : <Plus className="w-3 h-3 text-slate-400" />}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {itemToEdit ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                {itemToEdit ? "Save Changes" : "Create Item"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Embedded Password Generator */}
      <PasswordGeneratorModal
        isOpen={showGenerator}
        onClose={() => setShowGenerator(false)}
        onSelectPassword={handleApplyGeneratedPassword}
      />

      {/* Delete Confirmation Modal */}
      {itemToEdit && (
        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={async () => {
            await deleteVaultItem(itemToEdit.id);
            setShowDeleteConfirm(false);
            onClose();
          }}
          itemName={itemToEdit.name}
          itemType={itemToEdit.type}
        />
      )}
    </>
  );
}
