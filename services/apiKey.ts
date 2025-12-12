
const getAiStudio = () => {
  if (typeof window === 'undefined') return undefined;
  return (window as any).aistudio;
};

export const MISSING_API_KEY_MESSAGE =
  'GEMINI_API_KEY missing. Set it in .env or select a key in AI Studio.';

/**
 * Attempts to retrieve an API key from the AI Studio window object.
 * Tries multiple possible property/method names.
 */
const getAiStudioApiKey = (): string | null => {
  const aistudio = getAiStudio();
  if (!aistudio) return null;

  // Try various possible method names
  if (typeof aistudio.getSelectedApiKey === 'function') {
    const result = aistudio.getSelectedApiKey();
    if (typeof result === 'string' && result) return result;
    // Handle object with key property
    if (result?.key) return result.key;
    if (result?.apiKey) return result.apiKey;
  }

  if (typeof aistudio.getApiKey === 'function') {
    const result = aistudio.getApiKey();
    if (typeof result === 'string' && result) return result;
    if (result?.key) return result.key;
    if (result?.apiKey) return result.apiKey;
  }

  // Try direct properties
  if (typeof aistudio.selectedApiKey === 'string' && aistudio.selectedApiKey) {
    return aistudio.selectedApiKey;
  }
  if (typeof aistudio.apiKey === 'string' && aistudio.apiKey) {
    return aistudio.apiKey;
  }

  return null;
};

/**
 * Returns the configured Gemini API key or throws with a clear, user-facing message.
 * Checks process.env first, then AI Studio's window object.
 */
export const getGeminiApiKey = (): string => {
  let apiKey = '';
  
  try {
    // Vite replaces process.env.API_KEY with the actual string value during build.
    // In raw browser environments, accessing 'process' throws ReferenceError, which we catch.
    apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  } catch (e) {
    // Ignore ReferenceError if process is not defined
  }

  if (apiKey) return apiKey;

  // Try to get key from AI Studio
  const aiStudioKey = getAiStudioApiKey();
  if (aiStudioKey) return aiStudioKey;

  // Open key picker and throw - user needs to select a key
  const aistudio = getAiStudio();
  if (aistudio?.openSelectKey) {
    aistudio.openSelectKey().catch((err: unknown) => {
      console.warn('AI Studio key picker failed to open', err);
    });
  }

  throw new Error(MISSING_API_KEY_MESSAGE);
};

/**
 * Checks if a Gemini API key is available from any source.
 */
export const hasGeminiApiKey = (): boolean => {
  try {
    if (process.env.API_KEY || process.env.GEMINI_API_KEY) return true;
  } catch (e) {
    // process not defined
  }

  // Also check AI Studio
  return Boolean(getAiStudioApiKey());
};

export const promptForApiKeySelection = () => {
  const aistudio = getAiStudio();
  if (!aistudio?.openSelectKey) return false;
  aistudio.openSelectKey().catch((err: unknown) => {
    console.warn('AI Studio key picker failed to open', err);
  });
  return true;
};
