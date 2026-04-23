import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface ApiKeys {
  gemini?: string;
  openai?: string;
  claude?: string;
  groq?: string;
  deepseek?: string;
}

interface UserPreferences {
  defaultProvider: string;
  defaultModel: string;
  theme: string;
  aiTone: string;
}

interface SettingsContextType {
  keys: ApiKeys;
  prefs: UserPreferences;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children, user }: { children: React.ReactNode, user: any }) {
  const [keys, setKeys] = useState<ApiKeys>({});
  const [prefs, setPrefs] = useState<UserPreferences>({
    defaultProvider: 'gemini',
    defaultModel: 'gemini-3-flash-preview',
    theme: 'dark',
    aiTone: 'technical'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || user.isGuest) {
      setIsLoading(false);
      setKeys({});
      return;
    }

    const decryptKey = (text: string) => {
      if (!text) return '';
      try {
        const decoded = atob(text).replace('_bhart_node', '');
        return decoded.split('').reverse().join('');
      } catch { return text; }
    };

    const unsub = onSnapshot(doc(db, 'users', user.uid, 'config', 'settings'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const rawKeys = data.keys || {};
        const decrypted: ApiKeys = {};
        Object.keys(rawKeys).forEach(k => {
          decrypted[k as keyof ApiKeys] = decryptKey(rawKeys[k]);
        });
        setKeys(decrypted);
        setPrefs(prev => ({ ...prev, ...data.preferences }));
      }
      setIsLoading(false);
    }, (err) => {
      console.error("Settings sync error:", err);
      setIsLoading(false);
    });

    return () => unsub();
  }, [user]);

  return (
    <SettingsContext.Provider value={{ keys, prefs, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
