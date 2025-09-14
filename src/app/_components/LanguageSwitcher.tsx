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
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              selectedLanguage === lang.code
                ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <span className="text-base">{lang.flag}</span>
            <span>{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}