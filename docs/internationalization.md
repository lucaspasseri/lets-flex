# Internationalization Foundation

Let’s Flex supports the application locales `en` and `pt-BR`. English is both the default and
fallback locale. Translation resources use the `locales/<locale>/<namespace>.json` convention;
application-owned interface copy belongs in `common.json` until a future feature needs a separate
namespace. Translation keys describe meaning, such as `navigation.library` and `language.label`.

## Locale resolution

Every request follows one deterministic order:

1. A locale explicitly selected through the language switcher is saved in the Express session.
2. A valid persisted session locale is used on subsequent requests.
3. Otherwise, the browser `Accept-Language` header is detected.
4. Unsupported or absent values fall back to `en`.

Portuguese browser variants, including `pt`, `pt-PT`, and `pt_BR`, normalize to the application
locale `pt-BR`. English variants normalize to `en`. Unsupported languages never create additional
application locale states.

The selected locale is stored in the existing session only. No database preference or migration is
needed for guest or authenticated use. The `POST /locale` route is CSRF-protected and only accepts
the canonical locale identifiers; its local return path is validated before redirecting.

## Views and formatting boundary

The i18next HTTP middleware exposes `t()` and the resolved `language` to EJS locals. Shared layouts
also set the document language. New interface copy should use `t("meaningful.key")` in views or a
presentation boundary rather than using English text as a key. Domain/catalog values and
user-generated content remain untranslated.

Locale-sensitive dates and numbers should be formatted at a view-model or helper boundary with
`Intl.DateTimeFormat` and `Intl.NumberFormat`, using the resolved application locale. Existing
`date-fns` helpers remain responsible for date arithmetic and parsing; when `date-fns/format` is
needed for localized display, provide the matching locale explicitly from the same boundary instead
of embedding formatting rules in EJS. Broad formatting migration is intentionally deferred.
