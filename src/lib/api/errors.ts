import { getDictionary, type Dictionary } from '@/lib/i18n';
import type { Locale } from '@/types';

type ErrorsDict = Dictionary['errors'];
type ErrorKey = keyof ErrorsDict;

interface NormalizedApiError {
  message: string;
  /** -1 means "not a backend/request error" (plain JS Error and friends). */
  status: number;
  code?: string;
}

/**
 * Inspects the shape instead of `instanceof ApiClientError` so this module
 * stays dependency-free (it is also exercised by a plain Node test run).
 */
function normalizeError(error: unknown): NormalizedApiError | null {
  if (!error || typeof error !== 'object') return null;
  const candidate = error as { message?: unknown; status?: unknown; code?: unknown };
  return {
    message: typeof candidate.message === 'string' ? candidate.message : '',
    status: typeof candidate.status === 'number' ? candidate.status : -1,
    code: typeof candidate.code === 'string' ? candidate.code : undefined,
  };
}

function normalizeMessage(message: string): string {
  return message.trim().toLowerCase().replace(/\s+/g, ' ');
}

function fill(template: string, params?: Record<string, string>): string {
  if (!params) return template;
  let out = template;
  for (const [name, value] of Object.entries(params)) out = out.replace(`{${name}}`, value);
  return out;
}

/**
 * Stable codes are the most reliable key. Only codes with a dedicated,
 * unambiguous meaning go here; generic codes (BAD_REQUEST, NOT_FOUND, ...)
 * fall through to the message rules below, which carry the real specifics.
 */
const CODE_KEYS: Record<string, ErrorKey> = {
  INVALID_CREDENTIALS: 'invalidCredentials',
  TOKEN_EXPIRED: 'sessionExpired',
  CART_EMPTY: 'cartEmpty',
  INSUFFICIENT_STOCK: 'insufficientStock',
  PAYMENT_FAILED: 'paymentFailed',
  PROVIDER_UNAVAILABLE: 'providerUnavailable',
  PROVIDER_ERROR: 'providerError',
  TRANSACTIONS_UNAVAILABLE: 'transactionsUnavailable',
  VALIDATION_ERROR: 'validation',
  RATE_LIMITED: 'rateLimited',
};

interface MessageRule {
  pattern: RegExp;
  key: ErrorKey;
  params?: (match: RegExpMatchArray) => Record<string, string>;
}

/** Patterns match against the normalized (lower-case, single-spaced) message. */
const MESSAGE_RULES: MessageRule[] = [
  { pattern: /^your cart is empty$/, key: 'cartEmpty' },
  { pattern: /(^not enough stock|does not have enough stock)/, key: 'insufficientStock' },
  { pattern: /^one of the products is no longer available$/, key: 'productUnavailable' },
  { pattern: /^minimum quantity is (\d+)$/, key: 'quantityMin', params: (m) => ({ min: m[1] }) },
  { pattern: /^maximum quantity is (\d+)$/, key: 'quantityMax', params: (m) => ({ max: m[1] }) },
  { pattern: /^quantity must be at least (\d+)$/, key: 'quantityMin', params: (m) => ({ min: m[1] }) },
  { pattern: /^invalid delivery date$/, key: 'invalidDeliveryDate' },
  {
    pattern: /^the earliest available delivery date is (.+)$/,
    key: 'earliestDeliveryDate',
    params: (m) => ({ date: m[1] }),
  },
  { pattern: /^express delivery is not available in this region$/, key: 'expressRegion' },
  { pattern: /^express delivery does not run on weekends$/, key: 'expressWeekend' },
  { pattern: /^time slots are only available for express delivery$/, key: 'timeSlotExpressOnly' },
  { pattern: /^this delivery method is not available for the product$/, key: 'deliveryMethodUnavailable' },
  { pattern: /^invalid time slot/, key: 'invalidTimeSlot' },
  { pattern: /^you must accept the terms to place an order$/, key: 'termsRequired' },
  { pattern: /^invalid id$/, key: 'fieldInvalid' },
  { pattern: /^current password is incorrect$/, key: 'currentPasswordIncorrect' },
  { pattern: /^this order can no longer be cancelled/, key: 'orderNotCancellable' },
  { pattern: /^email or password is incorrect$/, key: 'invalidCredentials' },
  { pattern: /^session expired or invalid/, key: 'sessionExpired' },
  { pattern: /^refresh token is invalid/, key: 'sessionExpired' },
  { pattern: /^no refresh token supplied$/, key: 'sessionExpired' },
  { pattern: /^account is no longer available$/, key: 'accountDeactivated' },
  { pattern: /^this account has been deactivated$/, key: 'accountDeactivated' },
  { pattern: /^authentication required$/, key: 'unauthorized' },
  { pattern: /^you do not have access to this resource$/, key: 'forbidden' },
  { pattern: /^this email is already registered$/, key: 'emailTaken' },
  { pattern: /^this .+ is already in use$/, key: 'fieldInUse' },
  { pattern: /^your bonus balance changed/, key: 'bonusChanged' },
  { pattern: /^this payment was refunded/, key: 'paymentRefunded' },
  { pattern: /^this order was cancelled and can no longer be paid$/, key: 'orderNotPayable' },
  { pattern: /^this order changed while the request was being handled/, key: 'orderChanged' },
  { pattern: /^this basket has already been checked out/, key: 'basketCheckedOut' },
  { pattern: /^the payment is being prepared/, key: 'paymentPreparing' },
  { pattern: /^too many requests/, key: 'rateLimited' },
  { pattern: /^validation error$/, key: 'validation' },
  { pattern: /payments are not configured/, key: 'providerUnavailable' },
  { pattern: /^bank card payments are temporarily unavailable$/, key: 'providerError' },
  { pattern: /^no order matches that number and email$/, key: 'orderLookupNotFound' },
  { pattern: /^order not found$/, key: 'orderNotFound' },
  { pattern: /^product not found$/, key: 'productNotFound' },
  { pattern: /^parent category does not exist$/, key: 'notFound' },
  { pattern: /^category does not exist$/, key: 'notFound' },
  { pattern: /^this category still contains products$/, key: 'categoryInUse' },
  { pattern: /^remove or move the sub-categories first$/, key: 'categoryInUse' },
  { pattern: /cannot be its own parent$/, key: 'categoryCycle' },
  { pattern: /cannot be moved under its own descendant$/, key: 'categoryCycle' },
  { pattern: /^you cannot deactivate your own account$/, key: 'adminSelfAction' },
  { pattern: /^you cannot change your own role$/, key: 'adminSelfAction' },
  { pattern: /^unsupported file type/, key: 'unsupportedFileType' },
  { pattern: /^upload rejected/, key: 'uploadFailed' },
  { pattern: /^no file was uploaded$/, key: 'uploadFailed' },
  { pattern: /^the uploaded file does not look like the image type/, key: 'uploadFailed' },
  { pattern: /^payload too large$/, key: 'fileTooLarge' },
  { pattern: /^upload is larger than/, key: 'fileTooLarge' },
  { pattern: /not found$/, key: 'notFound' },
  { pattern: /^route .* does not exist$/, key: 'notFound' },
];

const STATUS_FALLBACKS: Record<number, ErrorKey> = {
  0: 'network',
  401: 'sessionExpired',
  403: 'forbidden',
  404: 'notFound',
  409: 'conflict',
  422: 'validation',
  429: 'rateLimited',
};

interface FieldRule {
  pattern: RegExp;
  resolve: (dict: Dictionary) => string;
}

/** English zod messages produced by the backend validators. */
const FIELD_RULES: FieldRule[] = [
  { pattern: /^enter a valid email address$/, resolve: (d) => d.validation.email },
  { pattern: /^email is required$/, resolve: (d) => d.validation.emailRequired },
  { pattern: /^you must accept the terms$/, resolve: (d) => d.errors.termsRequired },
  { pattern: /^use the yyyy-mm-dd format$/, resolve: (d) => d.errors.invalidDeliveryDate },
  { pattern: /^please write at least a few words$/, resolve: (d) => d.validation.minLength },
  { pattern: /^phone number is too short$/, resolve: (d) => d.validation.phone },
  { pattern: /^phone number contains invalid characters$/, resolve: (d) => d.validation.phone },
  { pattern: /^passwords do not match$/, resolve: (d) => d.validation.passwordMatch },
  { pattern: /^password must /, resolve: (d) => d.validation.passwordRules },
  { pattern: /^password is too long$/, resolve: (d) => d.validation.maxLength },
  { pattern: /^name is too short$/, resolve: (d) => d.validation.minLength },
  { pattern: /^must be an absolute url/, resolve: (d) => d.errors.fieldInvalid },
  { pattern: /is required$/, resolve: (d) => d.validation.required },
];

/**
 * Maps any thrown request error to a single localized, user-safe sentence.
 * Fallback order: curated code -> known backend message -> HTTP status -> generic.
 */
export function getLocalizedApiError(error: unknown, locale: Locale): string {
  const dict = getDictionary(locale);
  const normalized = normalizeError(error);
  if (!normalized) return dict.errors.generic;

  const byCode = normalized.code ? CODE_KEYS[normalized.code] : undefined;
  if (byCode) return dict.errors[byCode];

  if (normalized.status < 0) return dict.errors.generic;

  // ApiError.internal() forwards the raw driver/lib message, so 5xx payloads
  // must never reach the message rules: answer with the generic server copy.
  if (normalized.status >= 500) return dict.errors.server;

  if (normalized.status > 0 && normalized.message) {
    const text = normalizeMessage(normalized.message);
    for (const rule of MESSAGE_RULES) {
      const match = text.match(rule.pattern);
      if (match) return fill(dict.errors[rule.key], rule.params?.(match));
    }
  }

  const fallback = STATUS_FALLBACKS[normalized.status];
  return fallback ? dict.errors[fallback] : dict.errors.generic;
}

/** Localizes one backend field-validation message (zod vocabulary). */
export function getLocalizedFieldError(message: string | undefined | null, locale: Locale): string {
  const dict = getDictionary(locale);
  if (!message) return dict.errors.fieldInvalid;
  const text = normalizeMessage(message);
  for (const rule of FIELD_RULES) {
    if (rule.pattern.test(text)) return rule.resolve(dict);
  }
  return dict.errors.fieldInvalid;
}
