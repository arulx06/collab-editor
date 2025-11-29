// src/types/clerk.d.ts
interface ClerkTicketOptions {
  ticket: string;
  strategy?: string;
}

interface ClerkWindow {
  authenticateWithTicket?: (options: ClerkTicketOptions) => Promise<void>;
  openSignIn?: (options: ClerkTicketOptions) => Promise<void>;
}

interface Window {
  Clerk?: ClerkWindow;
}
