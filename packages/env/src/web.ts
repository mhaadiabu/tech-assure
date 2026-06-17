import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const optionalUrl = z
  .string()
  .min(1)
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const env = createEnv({
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_CONVEX_URL: z.url().optional(),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: optionalUrl,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: optionalUrl,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: optionalUrl,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: optionalUrl,
  },
  runtimeEnv: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
  },
  emptyStringAsUndefined: true,
});
