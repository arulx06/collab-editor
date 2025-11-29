'use client';

import { ConvexReactClient, Authenticated, Unauthenticated, AuthLoading } from 'convex/react';
import { ReactNode } from 'react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ClerkProvider, useAuth, SignIn } from '@clerk/nextjs';
import { FullscreenLoader } from './ui/fullscreen-loader';
import { useZohoLogin } from '@/hooks/use-zoho-login'; // <- import the hook

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function ZohoInitializer({ children }: { children: ReactNode }) {
  // This runs inside ClerkProvider so useClerk/useAuth used inside the hook are available
  useZohoLogin();
  return <>{children}</>;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      {/* call the hook from a child component so Clerk context is available */}
      <ZohoInitializer>
        <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
          <Authenticated>{children}</Authenticated>

          <Unauthenticated>
            <div className="flex flex-col items-center justify-center min-h-screen">
              <SignIn routing="hash" />
            </div>
          </Unauthenticated>

          <AuthLoading>
            <FullscreenLoader label="Auth loading..." />
          </AuthLoading>
        </ConvexProviderWithClerk>
      </ZohoInitializer>
    </ClerkProvider>
  );
}
