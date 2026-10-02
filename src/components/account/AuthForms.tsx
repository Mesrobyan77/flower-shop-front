'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { isLocale, localePath, type Dictionary, type Locale } from '@/lib/i18n';
import { ApiClientError } from '@/lib/api/client';
import { getLocalizedApiError, getLocalizedFieldError } from '@/lib/api/errors';
import { useLogin, useRegister, useSession } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Checkbox, Input } from '@/components/ui/Input';
import { GuestOrderLookup } from '@/components/cart/GuestOrderLookup';

/* --------------------------------- login --------------------------------- */

// Accepts locale-prefixed targets (AccountShell) and bare ones (AdminShell); everything
// else — including external URLs — is forced through localePath into a same-origin path.
// Admin routes live outside the [locale] segment, so they must never be locale-prefixed.
const NON_LOCALIZED_ROOTS = new Set(['admin']);

function resolveRedirectTarget(locale: Locale, target: string): string {
  const firstSegment = target.startsWith('/') ? target.slice(1).split(/[/?#]/)[0] : '';
  if (isLocale(firstSegment) || NON_LOCALIZED_ROOTS.has(firstSegment)) return target;
  return localePath(locale, target);
}

function loginSchema(dict: Dictionary) {
  return z.object({
    email: z.string().email(dict.validation.email),
    password: z.string().min(1, dict.validation.required),
    remember: z.boolean().optional(),
  });
}

export function LoginForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();
  const params = useSearchParams();
  const login = useLogin();
  const { isAuthenticated, hydrated } = useSession();
  const [tab, setTab] = useState<'member' | 'guest'>('member');

  const redirectTo = resolveRedirectTarget(locale, params.get('redirect') ?? '/account');

  const form = useForm<z.infer<ReturnType<typeof loginSchema>>>({
    resolver: zodResolver(loginSchema(dict)),
    defaultValues: { email: '', password: '', remember: true },
  });

  useEffect(() => {
    if (hydrated && isAuthenticated) router.replace(redirectTo);
  }, [hydrated, isAuthenticated, redirectTo, router]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      // replace() must stay last: a trailing refresh() supersedes the pending transition.
      router.replace(redirectTo);
    } catch (error) {
      if (error instanceof ApiClientError) {
        form.setError('password', { message: getLocalizedApiError(error, locale) });
      }
    }
  });

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6 flex rounded-card border border-line p-1">
        {(['member', 'guest'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'flex-1 rounded-[3px] py-2.5 text-[13px] transition-colors duration-fast',
              tab === key ? 'bg-ink-strong font-medium text-white' : 'text-ink-muted hover:text-ink',
            )}
          >
            {key === 'member' ? dict.auth.memberTab : dict.auth.guestTab}
          </button>
        ))}
      </div>

      {tab === 'member' ? (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            label={dict.auth.email}
            error={form.formState.errors.email?.message}
            {...form.register('email')}
          />
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            label={dict.auth.password}
            error={form.formState.errors.password?.message}
            {...form.register('password')}
          />

          <div className="flex items-center justify-between">
            <Checkbox label={dict.auth.rememberMe} {...form.register('remember')} />
            <Link
              href={localePath(locale, '/support/faq')}
              className="text-[12px] text-ink-soft underline underline-offset-2 hover:text-brand"
            >
              {dict.auth.forgotPassword}
            </Link>
          </div>

          <Button type="submit" size="xl" fullWidth loading={login.isPending}>
            {dict.auth.login}
          </Button>

          <p className="text-center text-[12.5px] text-ink-soft">
            {dict.auth.noAccount}{' '}
            <Link href={localePath(locale, '/register')} className="font-medium text-brand hover:underline">
              {dict.auth.register}
            </Link>
          </p>
        </form>
      ) : (
        <GuestOrderLookup locale={locale} dict={dict} />
      )}
    </div>
  );
}

/* -------------------------------- register -------------------------------- */

function registerSchema(dict: Dictionary) {
  return z
    .object({
      name: z.string().min(2, dict.validation.minLength),
      email: z.string().email(dict.validation.email),
      phone: z.string().min(6, dict.validation.phone),
      password: z
        .string()
        .min(8, dict.validation.passwordRules)
        .regex(/[a-zA-Z]/, dict.validation.passwordRules)
        .regex(/[0-9]/, dict.validation.passwordRules),
      confirmPassword: z.string(),
      marketingOptIn: z.boolean().optional(),
      agreeTerms: z.boolean().refine((value) => value, dict.validation.required),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: dict.validation.passwordMatch,
      path: ['confirmPassword'],
    });
}

export function RegisterForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();
  const register = useRegister();

  const form = useForm<z.infer<ReturnType<typeof registerSchema>>>({
    resolver: zodResolver(registerSchema(dict)),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      marketingOptIn: false,
      agreeTerms: false,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await register.mutateAsync({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        marketingOptIn: values.marketingOptIn,
        agreeTerms: true,
      });
      router.replace(localePath(locale, '/account'));
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) {
        const fields = ['name', 'email', 'phone', 'password', 'confirmPassword', 'agreeTerms'] as const;
        const field = fields.find((key) => error.fieldError(key));
        const fieldMessage = field ? error.fieldError(field) : undefined;
        if (field && fieldMessage) form.setError(field, { message: getLocalizedFieldError(fieldMessage, locale) });
        else form.setError('password', { message: getLocalizedApiError(error, locale) });
      }
    }
  });

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-md flex-col gap-4" noValidate>
      <div className="rounded-card border border-brand/30 bg-brand-50/50 px-4 py-3 text-[12.5px] text-brand-700">
        {dict.auth.registerBonus}
      </div>

      <Input
        id="register-name"
        label={dict.auth.name}
        autoComplete="name"
        error={form.formState.errors.name?.message}
        {...form.register('name')}
      />
      <Input
        id="register-email"
        type="email"
        label={dict.auth.email}
        autoComplete="email"
        error={form.formState.errors.email?.message}
        {...form.register('email')}
      />
      <Input
        id="register-phone"
        label={dict.auth.phone}
        autoComplete="tel"
        placeholder="+374 __ ______"
        error={form.formState.errors.phone?.message}
        {...form.register('phone')}
      />
      <Input
        id="register-password"
        type="password"
        label={dict.auth.password}
        autoComplete="new-password"
        hint={dict.validation.passwordRules}
        error={form.formState.errors.password?.message}
        {...form.register('password')}
      />
      <Input
        id="register-confirm"
        type="password"
        label={dict.auth.confirmPassword}
        autoComplete="new-password"
        error={form.formState.errors.confirmPassword?.message}
        {...form.register('confirmPassword')}
      />

      <Checkbox label={dict.auth.marketingOptIn} {...form.register('marketingOptIn')} />
      <div>
        <Controller
          name="agreeTerms"
          control={form.control}
          render={({ field }) => (
            <Checkbox
              label={dict.auth.agreeTerms}
              name={field.name}
              ref={field.ref}
              checked={field.value}
              onBlur={field.onBlur}
              onChange={(event) => field.onChange(event.target.checked)}
            />
          )}
        />
        {form.formState.errors.agreeTerms && (
          <p className="mt-1 text-[11px] text-danger-soft">{form.formState.errors.agreeTerms.message}</p>
        )}
      </div>

      <Button type="submit" size="xl" fullWidth loading={register.isPending}>
        {dict.auth.register}
      </Button>

      <p className="text-center text-[12.5px] text-ink-soft">
        {dict.auth.haveAccount}{' '}
        <Link href={localePath(locale, '/login')} className="font-medium text-brand hover:underline">
          {dict.auth.login}
        </Link>
      </p>
    </form>
  );
}
