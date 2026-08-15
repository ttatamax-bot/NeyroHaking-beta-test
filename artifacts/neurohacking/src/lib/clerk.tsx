import { useEffect, useRef } from "react";
import {
  ClerkProvider,
  useClerk,
  useUser,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl =
  import.meta.env.VITE_CLERK_PROXY_URL || `${basePath}/api/__clerk`;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

export const clerkAppearance = {
  theme: 'simple' as const,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/favicon.svg`,
  },
  variables: {
    colorPrimary: '#2563EB',
    colorForeground: '#FFFFFF',
    colorMutedForeground: '#8A9DBF',
    colorDanger: '#EF4444',
    colorBackground: '#0F2035',
    colorInput: '#122448',
    colorInputForeground: '#FFFFFF',
    colorNeutral: 'rgba(100,160,230,0.20)',
    fontFamily: "'Inter', sans-serif",
    borderRadius: '16px',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#0F2035] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[rgba(100,160,230,0.2)]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-white text-xl font-bold',
    headerSubtitle: 'text-[#8A9DBF]',
    socialButtonsBlockButtonText: 'text-white',
    formFieldLabel: 'text-white',
    footerActionLink: 'text-blue-light',
    footerActionText: 'text-[#8A9DBF]',
    dividerText: 'text-[#8A9DBF]',
    identityPreviewEditButton: 'text-blue-light',
    formFieldSuccessText: 'text-green-400',
    alertText: 'text-white',
    logoBox: 'flex justify-center',
    logoImage: 'w-10 h-10',
    socialButtonsBlockButton: 'border border-[rgba(100,160,230,0.2)] bg-surface-1',
    formButtonPrimary: 'btn-grad',
    formFieldInput: 'bg-[#122448] border-[rgba(100,160,230,0.2)] text-white placeholder:text-[#4A5C78]',
    footerAction: 'text-[#8A9DBF]',
    dividerLine: 'bg-[rgba(100,160,230,0.2)]',
    alert: 'bg-red-500/10 border border-red-500/30 text-white',
    otpCodeFieldInput: 'bg-[#122448] border-[rgba(100,160,230,0.2)] text-white',
    formFieldRow: 'gap-3',
    main: 'gap-4',
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

export function ClerkProviderWithRoutes({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();

  if (!clerkPubKey) {
    throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
  }

  // Proxying is only available for production Clerk instances; in development
  // the SDK loads Clerk assets directly from Clerk's CDN.
  const proxyUrl = import.meta.env.PROD ? clerkProxyUrl : undefined;

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={proxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Вход в НейроХакинг",
            subtitle: "Войдите, чтобы синхронизировать прогресс",
          },
        },
        signUp: {
          start: {
            title: "Регистрация",
            subtitle: "Создайте аккаунт, чтобы сохранить прогресс",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      {children}
    </ClerkProvider>
  );
}

export function useAuthInfo() {
  const { user, isLoaded, isSignedIn } = useUser();
  return {
    isLoaded,
    isSignedIn: isSignedIn ?? false,
    userId: user?.id ?? null,
    email: user?.primaryEmailAddress?.emailAddress ?? null,
  };
}

export { ClerkQueryClientCacheInvalidator };
