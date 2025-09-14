"use client";

import { Globe } from "lucide-react";
import type { SupportedLanguage } from "~/types/transcript";

interface LanguageSwitcherProps {
  selectedLanguage: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => void;
}

export function LanguageSwitcher({ selectedLanguage, onLanguageChange }: LanguageSwitcherProps) {
  const languages = [
    { code: "en" as const, name: "English", flag: "🇺🇸" },
    { code: "pl" as const, name: "Polski", flag: "🇵🇱" },
  ];

  return (
    <div className="flex items-center gap-3">
      <Globe className="h-5 w-5 text-slate-500 dark:text-slate-400" />
      <div className="relative flex bg-slate-100/70 dark:bg-slate-700/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-600/60 rounded-xl p-1 shadow-sm">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              selectedLanguage === lang.code
                ? "bg-white/90 dark:bg-slate-600/90 text-blue-600 dark:text-blue-400 shadow-md shadow-blue-600/10 dark:shadow-blue-400/20 scale-[1.02] border border-blue-200/30 dark:border-blue-500/30"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50/50 dark:hover:bg-slate-600/50 hover:scale-[1.01] active:scale-[0.99]"
            }`}
          >
            <span className="text-base transition-transform duration-200 group-hover:scale-110">{lang.flag}</span>
            <span className="font-medium">{lang.name}</span>
            {selectedLanguage === lang.code && (
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-50/20 to-indigo-50/20 dark:from-blue-950/20 dark:to-indigo-950/20 pointer-events-none" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}