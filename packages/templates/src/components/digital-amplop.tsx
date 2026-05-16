"use client";

import { Fragment, useState } from "react";

type EwalletProvider = "gopay" | "ovo" | "dana" | "shopeepay" | "other";

interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface EWallet {
  provider: EwalletProvider;
  providerLabel?: string;
  number: string;
  holder: string;
}

interface AmplopData {
  qrisUrl?: string;
  qrisNote?: string;
  bankAccounts?: BankAccount[];
  ewallets?: EWallet[];
}

interface DigitalAmplopProps {
  amplop: AmplopData;
  primaryColor: string;
  /** Background color for cards (default white) */
  cardBg?: string;
  textColor?: string;
  mutedColor?: string;
}

const EWALLET_LABELS: Record<EwalletProvider, string> = {
  gopay: "GoPay",
  ovo: "OVO",
  dana: "DANA",
  shopeepay: "ShopeePay",
  other: "E-Wallet",
};

const EWALLET_COLORS: Record<EwalletProvider, string> = {
  gopay: "#00AED6",
  ovo: "#4C3494",
  dana: "#118EEA",
  shopeepay: "#EE4D2D",
  other: "#6B7280",
};

/** Inline SVG icons for providers (no external deps) */
function ProviderIcon({ provider, size = 20 }: { provider: EwalletProvider; size?: number }) {
  const color = EWALLET_COLORS[provider];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {provider === "gopay" && <circle cx="12" cy="12" r="10" fill={color} />}
      {provider === "ovo" && <rect width="24" height="24" rx="6" fill={color} />}
      {provider === "dana" && <rect width="24" height="24" rx="6" fill={color} />}
      {provider === "shopeepay" && <rect width="24" height="24" rx="6" fill={color} />}
      {provider === "other" && <rect width="24" height="24" rx="6" fill={color} />}
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fill="white"
        fontFamily="system-ui, sans-serif"
      >
        {EWALLET_LABELS[provider].slice(0, 3).toUpperCase()}
      </text>
    </svg>
  );
}

function CopyButton({
  text,
  primaryColor,
}: {
  text: string;
  primaryColor: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Tersalin!" : `Salin ${text}`}
      className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200"
      style={{
        backgroundColor: copied ? "#22c55e" : `${primaryColor}15`,
        color: copied ? "#fff" : primaryColor,
        border: `1px solid ${copied ? "#22c55e" : primaryColor}40`,
      }}
    >
      {copied ? (
        <>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Tersalin!
        </>
      ) : (
        <>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Salin
        </>
      )}
    </button>
  );
}

type Tab = "qris" | "bank" | "ewallet";

export function DigitalAmplop({
  amplop,
  primaryColor,
  cardBg = "#ffffff",
  textColor = "#1a1a1a",
  mutedColor = "#9ca3af",
}: DigitalAmplopProps) {
  const hasQris = !!amplop.qrisUrl;
  const hasBank = (amplop.bankAccounts?.length ?? 0) > 0;
  const hasEwallet = (amplop.ewallets?.length ?? 0) > 0;

  // Default to first available tab
  const firstTab: Tab = hasQris ? "qris" : hasBank ? "bank" : "ewallet";
  const [activeTab, setActiveTab] = useState<Tab>(firstTab);

  const allTabs: Array<{ id: Tab; label: string; show: boolean }> = [
    { id: "qris", label: "QRIS", show: hasQris },
    { id: "bank", label: "Transfer Bank", show: hasBank },
    { id: "ewallet", label: "E-Wallet", show: hasEwallet },
  ];
  const tabs = allTabs.filter((t) => t.show);

  if (tabs.length === 0) return null;

  return (
    <div className="w-full max-w-sm mx-auto" style={{ color: textColor }}>
      {/* Section heading */}
      <div className="text-center mb-5">
        <p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: primaryColor }}>
          Amplop Digital
        </p>
        <h3 className="text-lg font-semibold" style={{ color: textColor }}>
          Hadiah & Tanda Cinta
        </h3>
        <p className="text-xs mt-1" style={{ color: mutedColor }}>
          Kehadiran Anda adalah hadiah terbaik kami
        </p>
      </div>

      {/* Tab bar */}
      {tabs.length > 1 && (
        <div
          className="flex gap-1 mb-4 rounded-xl p-1"
          style={{ backgroundColor: `${primaryColor}12` }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 rounded-lg py-2 text-xs font-medium transition-all duration-200"
              style={{
                backgroundColor: activeTab === tab.id ? primaryColor : "transparent",
                color: activeTab === tab.id ? "#fff" : mutedColor,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* QRIS tab */}
      {activeTab === "qris" && hasQris && (
        <div
          className="rounded-2xl border p-5 text-center space-y-3"
          style={{ backgroundColor: cardBg, borderColor: `${primaryColor}20` }}
        >
          <img
            src={amplop.qrisUrl}
            alt="QRIS untuk transfer"
            className="mx-auto rounded-xl object-contain"
            style={{ width: 200, height: 200 }}
            loading="lazy"
          />
          {amplop.qrisNote && (
            <p className="text-xs leading-relaxed" style={{ color: mutedColor }}>
              {amplop.qrisNote}
            </p>
          )}
          <p className="text-xs" style={{ color: mutedColor }}>
            Scan QRIS dengan aplikasi pembayaran apapun
          </p>
        </div>
      )}

      {/* Bank transfer tab */}
      {activeTab === "bank" && hasBank && (
        <div className="space-y-3">
          {amplop.bankAccounts?.map((acc, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: bank accounts ordered by user
            <Fragment key={idx}>
              <div
                className="rounded-2xl border p-4"
                style={{ backgroundColor: cardBg, borderColor: `${primaryColor}20` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wider mb-0.5"
                      style={{ color: primaryColor }}
                    >
                      {acc.bankName}
                    </p>
                    <p
                      className="font-mono text-base font-bold tracking-wide"
                      style={{ color: textColor }}
                    >
                      {acc.accountNumber}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: mutedColor }}>
                      a/n {acc.accountHolder}
                    </p>
                  </div>
                  <CopyButton text={acc.accountNumber} primaryColor={primaryColor} />
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      )}

      {/* E-wallet tab */}
      {activeTab === "ewallet" && hasEwallet && (
        <div className="space-y-3">
          {amplop.ewallets?.map((ew, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: ewallets ordered by user
            <Fragment key={idx}>
              <div
                className="rounded-2xl border p-4"
                style={{ backgroundColor: cardBg, borderColor: `${primaryColor}20` }}
              >
                <div className="flex items-center gap-3">
                  <ProviderIcon provider={ew.provider} size={36} />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wider mb-0.5"
                      style={{ color: EWALLET_COLORS[ew.provider] }}
                    >
                      {ew.providerLabel ?? EWALLET_LABELS[ew.provider]}
                    </p>
                    <p className="font-mono text-base font-bold" style={{ color: textColor }}>
                      {ew.number}
                    </p>
                    <p className="text-xs" style={{ color: mutedColor }}>
                      a/n {ew.holder}
                    </p>
                  </div>
                  <CopyButton text={ew.number} primaryColor={primaryColor} />
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
