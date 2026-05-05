import type { Appearance } from "@clerk/nextjs/server";

const shared = {
  elements: {
    // Strip Clerk's own card shadow/border so our wrapper controls the container
    cardBox: "shadow-none w-full",
    card: "shadow-none border-0 rounded-none bg-transparent p-0 w-full gap-6",
    // Header
    headerTitle: "text-xl font-semibold tracking-tight",
    headerSubtitle: "text-sm",
    headerBackLink: "text-sm",
    headerBackIcon: "size-4",
    // Social buttons
    socialButtonsBlockButton:
      "h-9 rounded-md border text-sm font-medium shadow-none transition-colors",
    socialButtonsBlockButtonText: "text-sm font-medium",
    socialButtonsProviderIcon: "size-4",
    // Divider
    dividerLine: "h-px",
    dividerText: "text-xs px-2",
    // Form fields
    formField: "gap-1.5",
    formFieldLabel: "text-xs font-medium",
    formFieldInput:
      "h-9 rounded-md border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
    formFieldErrorText: "text-xs text-destructive",
    formFieldHintText: "text-xs",
    // Buttons
    formButtonPrimary:
      "h-9 rounded-md px-4 text-sm font-medium shadow-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    formButtonReset: "h-9 rounded-md px-4 text-sm font-medium shadow-none",
    // OTP
    otpCodeFieldInput: "h-12 w-10 rounded-md border text-center text-base font-mono",
    // Footer
    footerAction: "pt-4",
    footerActionText: "text-sm text-muted-foreground",
    footerActionLink: "text-sm font-medium underline-offset-4 hover:underline",
    // Alerts
    alertText: "text-sm",
    alert: "rounded-md border px-4 py-3 text-sm",
    // Identity preview
    identityPreviewText: "text-sm",
    identityPreviewEditButtonIcon: "size-4",
    // Internal badge/tag
    badge: "rounded px-1.5 py-0.5 text-xs font-medium",
    // Back button
    backLink: "text-sm font-medium",
    // Loading spinner
    spinner: "text-primary",
    // Phone input
    phoneInputBox: "h-9 rounded-md border",
  },
} satisfies Partial<Appearance>;

export const clerkAppearanceLight: Appearance = {
  ...shared,
  variables: {
    colorBackground: "#ffffff",
    colorText: "#171717",
    colorPrimary: "#171717",
    colorTextOnPrimaryBackground: "#fafafa",
    colorTextSecondary: "#737373",
    colorInputBackground: "#ffffff",
    colorInputText: "#171717",
    colorNeutral: "#a3a3a3",
    colorDanger: "#dc2626",
    colorSuccess: "#16a34a",
    borderRadius: "0.375rem",
    fontFamily: "inherit",
    fontSize: "0.875rem",
    spacingUnit: "0.875rem",
  },
};

export const clerkAppearanceDark: Appearance = {
  ...shared,
  variables: {
    colorBackground: "#262626",
    colorText: "#fafafa",
    colorPrimary: "#e5e5e5",
    colorTextOnPrimaryBackground: "#1a1a1a",
    colorTextSecondary: "#a3a3a3",
    colorInputBackground: "#1a1a1a",
    colorInputText: "#fafafa",
    colorNeutral: "#737373",
    colorDanger: "#ef4444",
    colorSuccess: "#22c55e",
    borderRadius: "0.375rem",
    fontFamily: "inherit",
    fontSize: "0.875rem",
    spacingUnit: "0.875rem",
  },
};
