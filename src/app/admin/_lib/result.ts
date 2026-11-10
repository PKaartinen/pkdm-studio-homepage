/** What every admin server action returns, so the UI can always give feedback. */
export type ActionResult<T = undefined> =
  | { ok: true; message: string; data?: T }
  | { ok: false; error: string; field?: string };

export const ok = <T = undefined>(message: string, data?: T): ActionResult<T> => ({
  ok: true,
  message,
  data,
});

export const fail = (error: string, field?: string): ActionResult<never> => ({
  ok: false,
  error,
  field,
});
