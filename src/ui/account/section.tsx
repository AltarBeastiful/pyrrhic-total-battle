/**
 * The account's rows in the account menu (S-49b, S-49d), in the order a player meets them: who you
 * are, the address that still needs confirming, leave. Saving and loading have no row: a signed-in
 * browser keeps itself in step, and the profile row says where that stands.
 *
 * Two rows, three while an address is unconfirmed — and no more. Changing a password and deleting
 * the account are errands of a different rhythm, so they live behind the row that names the account,
 * which every site with accounts makes the way in. A menu that outgrows the window is a menu whose
 * last rows cannot be pressed (design rule 15, and Mantine's dropdown does not scroll).
 *
 * No new chrome: this is a section of the existing `AppMenu`, like the profile and file sections
 * beside it (design rule 15 — nothing on screen without value). When the build carries no backend
 * origin the section is `null` and the menu is exactly what it was before.
 */
import { LogIn, LogOut, MailCheck, UserRound } from 'lucide-react';

import { useAccountStore } from '@/account/state';

import type { AppMenuEntry, AppMenuSection } from '../kit';

const ICON = 15;

/** The account section, or `null` when this build has no account. */
export function useAccountSection(): AppMenuSection | null {
  const enabled = useAccountStore((state) => state.enabled);
  const user = useAccountStore((state) => state.user);
  const busy = useAccountStore((state) => state.busy);
  const error = useAccountStore((state) => state.error);
  const verificationSent = useAccountStore((state) => state.verificationSent);
  const passwords = useAccountStore((state) => state.methods?.password ?? false);

  if (!enabled) return null;

  const working = busy !== 'none';

  if (user === null) {
    const entries: AppMenuEntry[] = [
      {
        id: 'account-signin',
        label: 'Sign in…',
        description: error === '' ? 'Keep a copy of your profiles on your account' : error,
        icon: <LogIn size={ICON} aria-hidden />,
        disabled: working,
        onSelect: () => {
          useAccountStore.getState().setDialog('signin');
        },
      },
    ];
    return { id: 'account', title: 'Account', entries };
  }

  const entries: AppMenuEntry[] = [
    {
      id: 'account-user',
      label: `Signed in as ${user.email === '' ? 'your account' : user.email}`,
      description: passwords ? 'Change your password, or delete this account' : 'Delete this account',
      icon: <UserRound size={ICON} aria-hidden />,
      disabled: working,
      onSelect: () => {
        useAccountStore.getState().setDialog('account');
      },
    },
    // Only while it matters: the server refuses to save for an address nobody has confirmed, so the
    // row is both the explanation and the way out of it.
    ...(user.verified
      ? []
      : [
          {
            id: 'account-verify',
            label: 'Confirm your email address',
            description: verificationSent
              ? 'A confirmation email is on its way; look in your spam folder too'
              : 'Saving needs a confirmed address. Choose this to send the email again',
            icon: <MailCheck size={ICON} aria-hidden />,
            disabled: working,
            onSelect: () => {
              void useAccountStore.getState().resendVerification();
            },
          } satisfies AppMenuEntry,
        ]),
    {
      id: 'account-signout',
      label: 'Sign out',
      icon: <LogOut size={ICON} aria-hidden />,
      disabled: working,
      onSelect: () => {
        void useAccountStore.getState().signOut();
      },
    },
  ];

  return { id: 'account', title: 'Account', entries };
}
