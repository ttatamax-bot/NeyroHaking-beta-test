import { createContext } from "react";
import type { CompleteTechniqueResult, ServerProfile } from "./api";
import type { AppState, MemoryMode } from "./store";

export interface AppContextType extends AppState {
  isSignedIn: boolean;
  isAuthLoaded: boolean;
  isAccountReady: boolean;
  accountLoadError: string | null;
  retryAccountHydration: () => void;
  updateState: (updates: Partial<AppState> | ((prev: AppState) => Partial<AppState>)) => void;
  completeTechnique: (techniqueId: string, metadata: Record<string, unknown>) => Promise<CompleteTechniqueResult>;
  refreshProfile: () => Promise<void>;
  applyTrustedServerResult: (state: Record<string, unknown> | null | undefined, profile: ServerProfile) => void;
  purchaseMemoryMode: (mode: MemoryMode) => Promise<void>;
}

export const AppContext = createContext<AppContextType | null>(null);