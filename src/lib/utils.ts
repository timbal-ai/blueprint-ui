import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// ============================================
// UI Utilities
// ============================================

/**
 * Combines Tailwind CSS classes with clsx and tailwind-merge
 * Used throughout UI components for conditional styling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// App Configuration
// ============================================

/**
 * Feature flag to enable/disable authentication
 * Set via VITE_APP_ENABLE_AUTH environment variable
 */
export const enableAuth = import.meta.env.VITE_APP_ENABLE_AUTH === "true"
