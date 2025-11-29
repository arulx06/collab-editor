'use client';

import { ConvexReactClient, Authenticated, Unauthenticated, AuthLoading } from 'convex/react';
import { ReactNode } from 'react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ClerkProvider, useAuth } from '@clerk/nextjs';
import { FullscreenLoader } from './ui/fullscreen-loader';
import { useZohoLogin } from '@/hooks/use-zoho-login'; // <- import the hook

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function ZohoInitializer() {
  // This runs inside ClerkProvider so useClerk/useAuth used inside the hook are available
  useZohoLogin();
  return <></>;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      {/* call the hook from a child component so Clerk context is available */}
      
        <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
          <ZohoInitializer />
          <Authenticated>{children}</Authenticated>
          <Unauthenticated>
            <FullscreenLoader label="Autherizing via zoho account..." />
          </Unauthenticated>

          <AuthLoading>
            <FullscreenLoader label="Autherizing via zoho account..." />
          </AuthLoading>
        </ConvexProviderWithClerk>
      
    </ClerkProvider>
  );
}
