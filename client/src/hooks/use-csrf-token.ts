import { useState, useEffect } from "react";

/**
 * Hook for managing CSRF tokens
 * Fetches token from server and provides helper for adding to requests
 */
export function useCsrfToken() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Fetch CSRF token when component mounts
    const fetchToken = async () => {
      try {
        const response = await fetch("/api/auth/csrf-token", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch CSRF token");
        }

        const data = await response.json();
        setCsrfToken(data.csrfToken);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        console.error("Error fetching CSRF token:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, []);

  /**
   * Helper function to add CSRF token to fetch options
   * Usage: fetch(url, addCsrfToken({ method: "POST", body: ... }))
   */
  const addCsrfToken = (options: RequestInit = {}): RequestInit => {
    if (!csrfToken) {
      console.warn("CSRF token not available yet");
      return options;
    }

    return {
      ...options,
      headers: {
        ...options.headers,
        "csrf-token": csrfToken,
      },
    };
  };

  return {
    csrfToken,
    loading,
    error,
    addCsrfToken,
  };
}
