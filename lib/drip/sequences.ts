export type DripStep = {
  delaySeconds: number;
  subject: string;
  template: string;
  condition?: string;
};

export type DripSequence = {
  steps: DripStep[];
};

export const SEQUENCES: Record<string, DripSequence> = {
  rep_welcome: {
    steps: [
      { delaySeconds: 0, subject: "Welcome to Pulse — send your first CE in 60 seconds", template: "rep-welcome-0" },
      { delaySeconds: 86400, subject: "Your QR code is ready — print it for tomorrow", template: "rep-welcome-1" },
      { delaySeconds: 259200, subject: "3 ways to use Pulse at your next facility visit", template: "rep-welcome-2" },
      { delaySeconds: 604800, subject: "Need help getting started?", template: "rep-welcome-3", condition: "no_ce_sent" },
    ],
  },

  pro_welcome: {
    steps: [
      { delaySeconds: 0, subject: "Welcome to Pulse — free CEs for your license", template: "pro-welcome-0" },
      { delaySeconds: 172800, subject: "Your first free CE is one request away", template: "pro-welcome-1" },
      { delaySeconds: 432000, subject: "Know a rep? Get your CE faster", template: "pro-welcome-2" },
    ],
  },
};
