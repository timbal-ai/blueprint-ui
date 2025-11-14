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
 * Detects if the application is running inside an iframe
 * Returns true when embedded in another application
 */
export const isEmbedded = typeof window !== 'undefined' && window.self !== window.top
