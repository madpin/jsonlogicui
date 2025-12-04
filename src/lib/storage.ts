const STORAGE_KEY = 'jsonlogic-ui';

interface StoredState {
  rule: string;
  data: string;
  theme: 'light' | 'dark';
  activeTab: string;
}

const defaultState: StoredState = {
  rule: `{
  "if": [
    { ">=": [{ "var": "age" }, 18] },
    "adult",
    "minor"
  ]
}`,
  data: `{
  "age": 21
}`,
  theme: 'dark',
  activeTab: 'tree',
};

export function loadState(): StoredState {
  if (typeof window === 'undefined') {
    return defaultState;
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultState, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  
  return defaultState;
}

export function saveState(state: Partial<StoredState>): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    const current = loadState();
    const updated = { ...current, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

export function clearState(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear state:', e);
  }
}

/**
 * Generate a shareable URL with the rule encoded
 */
export function generateShareUrl(rule: string, data: string): string {
  const params = new URLSearchParams();
  params.set('rule', btoa(rule));
  params.set('data', btoa(data));
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

/**
 * Parse rule and data from URL parameters
 */
export function parseShareUrl(): { rule?: string; data?: string } | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const params = new URLSearchParams(window.location.search);
    const rule = params.get('rule');
    const data = params.get('data');
    
    if (rule || data) {
      return {
        rule: rule ? atob(rule) : undefined,
        data: data ? atob(data) : undefined,
      };
    }
  } catch (e) {
    console.error('Failed to parse share URL:', e);
  }
  
  return null;
}
