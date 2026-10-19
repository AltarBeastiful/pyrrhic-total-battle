/**
 * The top app bar (design plan §5.1 as revised by spike 0009 — frame V1 adopted): M3's small top
 * app bar, 64 px, scrolling away with the page, carrying the brand on the left and, on the right, a Sign in button while signed out, the profile menu
 * (profiles, files, account) and the app menu at the screen's edge.
 *
 * The figures used to live here. They moved to where the action they belong with is — the March
 * pane's header on a desktop, the bottom app bar on a phone — because a bar that repeats the pane
 * eighty pixels above it is what `v4-desktop.jpg` shows and design rule 5 forbids.
 */
import { Box, Button, Title } from '@mantine/core';
import { LogIn } from 'lucide-react';

import { useAccountStore } from '@/account/state';

import { AppBar as BarSurface } from '../kit';
import { MainMenu } from './MainMenu';
import { ProfileMenu } from './ProfileMenu';
import themeClasses from '../theme.module.css';

/**
 * Our own mark: a gilded square, the game's trim turned 45° (design plan §5.5, artboard `.mark`).
 * Decorative — the word beside it is the name, and a logotype is what design rule 25 forbids.
 */
function BrandMark() {
  return <Box className={themeClasses.mark} aria-hidden="true" />;
}

/** Signed out on a build with an account: the way in sits on the bar, beside the menus, not inside one. */
function SignInButton() {
  const enabled = useAccountStore((state) => state.enabled);
  const user = useAccountStore((state) => state.user);
  const working = useAccountStore((state) => state.busy !== 'none');
  if (!enabled || user !== null) return null;
  return (
    <Button
      variant="default"
      radius="xl"
      size="compact-md"
      h={36}
      disabled={working}
      leftSection={<LogIn size={16} aria-hidden />}
      onClick={() => {
        useAccountStore.getState().setDialog('signin');
      }}
    >
      Sign in
    </Button>
  );
}

export function AppBar() {
  return (
    <BarSurface
      brand={
        <>
          <BrandMark />
          <Title order={1} size="1.125rem" fw={600} lh={1.4}>
            Pyrrhic
          </Title>
        </>
      }
      actions={
        <>
          <SignInButton />
          <ProfileMenu />
          <MainMenu />
        </>
      }
    />
  );
}
