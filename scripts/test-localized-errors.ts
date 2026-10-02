/**
 * Localized API error contracts. Runs against the real dictionaries and the
 * real mapping helper with Node's native type stripping:
 *
 *   npm run test:errors
 */
import assert from 'node:assert/strict';
import { getLocalizedApiError, getLocalizedFieldError } from '@/lib/api/errors';
import { normalizeLocale } from '@/lib/i18n';
import { hy } from '@/lib/i18n/dictionaries/hy';
import { en } from '@/lib/i18n/dictionaries/en';
import { ru } from '@/lib/i18n/dictionaries/ru';
import { useUiStore } from '@/store/ui';

const locales = { hy, en, ru };
type Loc = keyof typeof locales;
const LOCALES: Loc[] = ['hy', 'en', 'ru'];

let passed = 0;
const failures: string[] = [];

function check(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`ok   ${name}`);
  } catch (error) {
    failures.push(name);
    console.error(`FAIL ${name}\n     ${(error as Error).message}`);
  }
}

/** Mirrors the ApiClientError shape the axios layer throws. */
const apiError = (message: string, status: number, code?: string) => ({ message, status, code });

/* ------------------------- §6 mandated copy, exact ------------------------- */

check('mandated generic / cart-empty / stock copy is exact in hy/en/ru', () => {
  assert.equal(hy.errors.generic, 'Տեղի ունեցավ սխալ։ Խնդրում ենք կրկին փորձել։');
  assert.equal(en.errors.generic, 'Something went wrong. Please try again.');
  assert.equal(ru.errors.generic, 'Произошла ошибка. Попробуйте ещё раз.');

  assert.equal(hy.errors.cartEmpty, 'Ձեր զամբյուղը դատարկ է։');
  assert.equal(en.errors.cartEmpty, 'Your cart is empty.');
  assert.equal(ru.errors.cartEmpty, 'Ваша корзина пуста.');

  assert.equal(hy.errors.insufficientStock, 'Ապրանքի առկա քանակը բավարար չէ։');
  assert.equal(en.errors.insufficientStock, 'Insufficient stock.');
  assert.equal(ru.errors.insufficientStock, 'Недостаточно товара на складе.');
});

/* ----------------------------- §5 code mapping ---------------------------- */

const CODE_TO_KEY: Record<string, keyof typeof hy.errors> = {
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

check('every stable code resolves to its dictionary entry in all locales', () => {
  for (const [code, key] of Object.entries(CODE_TO_KEY)) {
    for (const loc of LOCALES) {
      assert.equal(
        getLocalizedApiError(apiError('irrelevant payload text', 400, code), loc),
        locales[loc].errors[key],
        `${code} / ${loc}`,
      );
    }
  }
});

check('code wins over a conflicting backend message', () => {
  assert.equal(getLocalizedApiError(apiError('Your cart is empty', 400, 'INSUFFICIENT_STOCK'), 'en'), en.errors.insufficientStock);
  assert.equal(getLocalizedApiError(apiError('Your cart is empty', 400, 'INSUFFICIENT_STOCK'), 'hy'), hy.errors.insufficientStock);
});

check('code-only errors (no HTTP status) still resolve', () => {
  assert.equal(getLocalizedApiError({ message: '', code: 'TOKEN_EXPIRED' }, 'en'), en.errors.sessionExpired);
  assert.equal(getLocalizedApiError({ message: '', code: 'CART_EMPTY' }, 'ru'), ru.errors.cartEmpty);
});

/* ------------------------- §1 spec example + §10 cart ---------------------- */

check('spec example: "Your cart is empty" payload localizes per locale', () => {
  assert.equal(getLocalizedApiError(apiError('Your cart is empty', 400), 'hy'), 'Ձեր զամբյուղը դատարկ է։');
  assert.equal(getLocalizedApiError(apiError('Your cart is empty', 400), 'en'), 'Your cart is empty.');
  assert.equal(getLocalizedApiError(apiError('Your cart is empty', 400), 'ru'), 'Ваша корзина пуста.');
});

check('insufficient stock (code and message forms) localizes per locale', () => {
  assert.equal(getLocalizedApiError(apiError('Not enough stock for Lavender Bouquet', 400), 'hy'), hy.errors.insufficientStock);
  assert.equal(getLocalizedApiError(apiError('Not enough stock for Lavender Bouquet', 400), 'en'), en.errors.insufficientStock);
  assert.equal(getLocalizedApiError(apiError('Not enough stock for Lavender Bouquet', 400), 'ru'), ru.errors.insufficientStock);
});

/* ---------------------------- message rule table --------------------------- */

const MESSAGE_CASES: Array<[string, number, keyof typeof hy.errors]> = [
  ['Your cart is empty', 400, 'cartEmpty'],
  ['Not enough stock for X', 400, 'insufficientStock'],
  ['One of the products is no longer available', 409, 'productUnavailable'],
  ['Invalid delivery date', 400, 'invalidDeliveryDate'],
  ['This email is already registered', 409, 'emailTaken'],
  ['No order matches that number and email', 404, 'orderLookupNotFound'],
  ['Product not found', 404, 'productNotFound'],
  ['Order not found', 404, 'orderNotFound'],
  ['Too many requests, please slow down', 429, 'rateLimited'],
  ['Validation error', 422, 'validation'],
  ['Authentication required', 401, 'unauthorized'],
  ['You do not have access to this resource', 403, 'forbidden'],
  ['This account has been deactivated', 403, 'accountDeactivated'],
  ['Current password is incorrect', 400, 'currentPasswordIncorrect'],
  ['Session expired or invalid', 401, 'sessionExpired'],
  ['You must accept the terms to place an order', 400, 'termsRequired'],
  ['This basket has already been checked out', 409, 'basketCheckedOut'],
  ['The payment is being prepared', 409, 'paymentPreparing'],
  ['This payment was refunded', 409, 'paymentRefunded'],
  ['Email or password is incorrect', 401, 'invalidCredentials'],
];

check('known English backend messages localize in every locale', () => {
  for (const [message, status, key] of MESSAGE_CASES) {
    for (const loc of LOCALES) {
      assert.equal(getLocalizedApiError(apiError(message, status), loc), locales[loc].errors[key], `${message} / ${loc}`);
    }
  }
});

check('interpolated parameters survive translation', () => {
  assert.equal(getLocalizedApiError(apiError('Minimum quantity is 5', 400), 'hy'), hy.errors.quantityMin.replace('{min}', '5'));
  assert.equal(getLocalizedApiError(apiError('Maximum quantity is 12', 400), 'ru'), ru.errors.quantityMax.replace('{max}', '12'));
  assert.equal(
    getLocalizedApiError(apiError('The earliest available delivery date is 2026-10-05', 400), 'en'),
    en.errors.earliestDeliveryDate.replace('{date}', '2026-10-05'),
  );
});

/* --------------------------- status fallback table ------------------------- */

const STATUS_CASES: Array<[number, keyof typeof hy.errors]> = [
  [401, 'sessionExpired'],
  [403, 'forbidden'],
  [404, 'notFound'],
  [409, 'conflict'],
  [422, 'validation'],
  [429, 'rateLimited'],
  [0, 'network'],
];

check('HTTP status fallback per locale', () => {
  for (const [status, key] of STATUS_CASES) {
    for (const loc of LOCALES) {
      const message = status === 0 ? 'Network Error' : 'backend wording the rules do not know';
      assert.equal(getLocalizedApiError(apiError(message, status), loc), locales[loc].errors[key], `${status} / ${loc}`);
    }
  }
});

check('unknown and non-error inputs fall back to the mandated generic copy', () => {
  for (const loc of LOCALES) {
    assert.equal(getLocalizedApiError(new Error('boom'), loc), locales[loc].errors.generic);
    assert.equal(getLocalizedApiError(null, loc), locales[loc].errors.generic);
    assert.equal(getLocalizedApiError(undefined, loc), locales[loc].errors.generic);
    assert.equal(getLocalizedApiError('raw failure string', loc), locales[loc].errors.generic);
    assert.equal(getLocalizedApiError(42, loc), locales[loc].errors.generic);
    assert.equal(getLocalizedApiError({ message: '', status: -1 }, loc), locales[loc].errors.generic);
  }
});

/* ------------------------- §6 no raw leaks from 4xx/5xx -------------------- */

check('5xx payloads never leak driver details and use the server copy', () => {
  const raw =
    'MongoServerError: E11000 duplicate key error collection: shop.users index: email_1 dup key: { email: "a@b.c" }';
  for (const loc of LOCALES) {
    const out = getLocalizedApiError(apiError(raw, 500), loc);
    assert.equal(out, locales[loc].errors.server);
    for (const token of ['MongoServerError', 'E11000', 'duplicate key', 'index:', 'stack']) {
      assert.ok(!out.includes(token), `${loc} leaked "${token}"`);
    }
  }
});

check('5xx never matches message rules even for known-looking messages', () => {
  assert.equal(getLocalizedApiError(apiError('Not enough stock for X', 500), 'en'), en.errors.server);
  assert.equal(getLocalizedApiError(apiError('Your cart is empty', 503), 'ru'), ru.errors.server);
});

check('unrecognized 4xx technical payloads degrade to the generic copy', () => {
  const raw = 'QueryFailedError: relation "orders" does not exist\n    at QueryRunner.query (/app/src/db.ts:42:11)';
  for (const loc of LOCALES) {
    const out = getLocalizedApiError(apiError(raw, 400), loc);
    assert.equal(out, locales[loc].errors.generic);
    assert.ok(!out.includes('QueryFailedError') && !out.includes('/app/') && !out.includes('at QueryRunner'));
  }
});

/* ------------------------- §8 field validation mapping --------------------- */

check('field validation messages localize (email / phone / password / terms)', () => {
  assert.equal(getLocalizedFieldError('Enter a valid email address', 'hy'), hy.validation.email);
  assert.equal(getLocalizedFieldError('Enter a valid email address', 'ru'), ru.validation.email);
  assert.equal(getLocalizedFieldError('Phone number contains invalid characters', 'hy'), hy.validation.phone);
  assert.equal(getLocalizedFieldError('Phone number is too short', 'en'), en.validation.phone);
  assert.equal(getLocalizedFieldError('Passwords do not match', 'ru'), ru.validation.passwordMatch);
  assert.equal(getLocalizedFieldError('You must accept the terms', 'hy'), hy.errors.termsRequired);
  assert.equal(getLocalizedFieldError('Name is required', 'en'), en.validation.required);
  assert.equal(getLocalizedFieldError('Use the YYYY-MM-DD format', 'en'), en.errors.invalidDeliveryDate);
});

check('unknown or missing field messages fall back to the localized invalid-field copy', () => {
  for (const loc of LOCALES) {
    assert.equal(getLocalizedFieldError('backend field message with no mapping', loc), locales[loc].errors.fieldInvalid);
    assert.equal(getLocalizedFieldError(undefined, loc), locales[loc].errors.fieldInvalid);
    assert.equal(getLocalizedFieldError(null, loc), locales[loc].errors.fieldInvalid);
  }
});

/* ------------------------------ §7 locale state ---------------------------- */

check('unknown locale segments resolve to the app default (hy), not the browser', () => {
  assert.equal(normalizeLocale('de'), 'hy');
  assert.equal(normalizeLocale(undefined), 'hy');
  assert.equal(normalizeLocale('ru'), 'ru');
  assert.equal(normalizeLocale('en'), 'en');
});

/* --------------------------- §13 single toast slot ------------------------- */

check('toast store has a single slot: a second notify replaces the first', () => {
  useUiStore.getState().notify('First error', 'error');
  useUiStore.getState().notify('Second error', 'error');
  const toast = useUiStore.getState().toast;
  assert.equal(toast?.message, 'Second error');
  assert.equal(toast?.tone, 'error');
  useUiStore.getState().dismissToast();
  assert.equal(useUiStore.getState().toast, null);
});

/* ---------------------------- dictionary integrity ------------------------- */

check('errors dictionary is complete and non-empty across all three locales', () => {
  const hyKeys = Object.keys(hy.errors).sort();
  for (const loc of ['en', 'ru'] as const) {
    assert.deepEqual(Object.keys(locales[loc].errors).sort(), hyKeys, `${loc} key set differs from hy`);
    const values = locales[loc].errors as unknown as Record<string, string>;
    for (const key of hyKeys) {
      assert.ok(typeof values[key] === 'string' && values[key].trim().length > 0, `${loc}.errors.${key} is empty`);
    }
  }
});

/* --------------------------------- summary --------------------------------- */

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length > 0) process.exit(1);
