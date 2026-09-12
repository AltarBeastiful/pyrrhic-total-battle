import { useEffect, useState } from 'react';

import { version as gameData } from '@/data';
import { buildBattleLink, buildProfileLink } from '@/share/codec';
import { exportProfileFile } from '@/share/exportImport';
import type { BattleSetup, Profile } from '@/state/schema';

import { CheckIcon, CopyIcon, ShareIcon } from '../icons';
import { Button, Dialog, HelpNote, Tabs } from '../primitives';
import { QrCode } from '../QrCode';
import { resultCounts, toSavedSummary, type ResultSnapshot } from '../resultStore';
import { canShare, copyText, sendToDevice } from './download';

/** ADR-0005: a battle link must fit a chat message; a profile link only has to fit a browser. */
export const BATTLE_LINK_BUDGET = 1500;
export const PROFILE_LINK_BUDGET = 8000;
/** Above this a QR code stops being readable by a phone camera, so we offer the file instead. */
export const QR_LINK_LIMIT = 2900;

export interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
  setup: BattleSetup | undefined;
  /** The last generated stack; a battle link cannot be built without one. */
  result: ResultSnapshot | null;
}

type LinkState =
  { status: 'building' } | { status: 'ready'; link: string } | { status: 'error'; message: string };

interface Links {
  /** Identity of the data the two links were built from. */
  key: string;
  profile: LinkState;
  battle: LinkState;
}

const count = (value: number): string => value.toLocaleString('en-US');

function LinkPanel({
  state,
  budget,
  title,
  shareText,
  file,
}: {
  state: LinkState;
  budget: number;
  title: string;
  shareText: string;
  file?: ReturnType<typeof exportProfileFile>;
}) {
  const [copied, setCopied] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);

  if (state.status === 'building') return <p className="text-muted text-sm">Building the link…</p>;
  if (state.status === 'error') return <HelpNote tone="warn">{state.message}</HelpNote>;

  const { link } = state;
  const overBudget = link.length > budget;

  return (
    <div className="space-y-3">
      <textarea
        readOnly
        aria-label={`${title} share link`}
        value={link}
        rows={3}
        className="border-line bg-raised text-fg w-full resize-none rounded-lg border p-2 font-mono text-xs"
      />
      <p className={overBudget ? 'text-warn text-xs' : 'text-muted text-xs'}>
        {count(link.length)} characters — budget {count(budget)}.
        {overBudget ? ' Too long to paste in a chat message; send the file instead.' : ' Fits.'}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          icon={copied ? <CheckIcon /> : <CopyIcon />}
          onClick={() => {
            void copyText(link).then((ok) => {
              setCopied(ok);
              setTimeout(() => {
                setCopied(false);
              }, 2000);
            });
          }}
        >
          {copied ? 'Copied' : 'Copy link'}
        </Button>
        {canShare() && (
          <Button
            icon={<ShareIcon />}
            onClick={() => {
              void sendToDevice({
                title,
                text: shareText,
                url: link,
                ...(file === undefined ? {} : { file }),
              }).then((outcome) => {
                setShareNote(outcome === 'unavailable' ? 'Sharing is not available on this device.' : null);
              });
            }}
          >
            Send to another device
          </Button>
        )}
      </div>
      {shareNote !== null && <HelpNote tone="warn">{shareNote}</HelpNote>}
      {link.length <= QR_LINK_LIMIT ? (
        <div className="flex flex-col items-center gap-2">
          <QrCode value={link} label={`QR code for the ${title.toLowerCase()} link`} />
          <p className="text-muted text-xs">Scan it with the other device's camera.</p>
        </div>
      ) : (
        <HelpNote>
          This link is too long for a QR code. Export the profile as a file and open it on the other device
          instead.
        </HelpNote>
      )}
    </div>
  );
}

/** Share dialog: the whole account as a link, or one march and its result. */
export function ShareDialog({ open, onOpenChange, profile, setup, result }: ShareDialogProps) {
  const [tab, setTab] = useState<'profile' | 'battle'>('profile');

  // One key per (profile, march, result) revision: when it changes both links are rebuilt. Keeping it
  // in state means the reset happens during render, not in an effect.
  const key = [
    String(open),
    profile.id,
    String(profile.rev),
    setup?.id ?? '-',
    String(setup?.rev ?? -1),
    String(result?.at ?? 0),
  ].join('|');

  const noResult: LinkState = {
    status: 'error',
    message: 'Generate a stack first: a battle link carries the march and its unit counts.',
  };
  const initial = (): Links => ({
    key,
    profile: { status: 'building' },
    battle: setup === undefined || result === null ? noResult : { status: 'building' },
  });
  const [links, setLinks] = useState<Links>(initial);
  if (links.key !== key) setLinks(initial());

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    const baseUrl = typeof window === 'undefined' ? '' : window.location.href;
    const options = { baseUrl, dataVersion: gameData.dataVersion };
    const settle = (which: 'profile' | 'battle', state: LinkState): void => {
      if (cancelled) return;
      setLinks((previous) => (previous.key === key ? { ...previous, [which]: state } : previous));
    };
    const failed = (error: unknown): LinkState => ({
      status: 'error',
      message: error instanceof Error ? error.message : 'The link could not be built.',
    });

    void buildProfileLink(profile, options).then(
      (link) => {
        settle('profile', { status: 'ready', link });
      },
      (error: unknown) => {
        settle('profile', failed(error));
      },
    );

    if (setup !== undefined && result !== null) {
      void buildBattleLink(setup, resultCounts(result.result), toSavedSummary(result.summary), options).then(
        (link) => {
          settle('battle', { status: 'ready', link });
        },
        (error: unknown) => {
          settle('battle', failed(error));
        },
      );
    }

    return () => {
      cancelled = true;
    };
  }, [key, open, profile, setup, result]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Share"
      description="Links carry everything in the address itself. Nothing is uploaded: the part after # never leaves the browser."
    >
      <Tabs
        label="What to share"
        value={tab}
        onValueChange={(next) => {
          setTab(next === 'battle' ? 'battle' : 'profile');
        }}
        items={[
          {
            value: 'profile',
            label: 'Profile link',
            content: (
              <LinkPanel
                state={links.profile}
                budget={PROFILE_LINK_BUDGET}
                title="Profile"
                shareText={`Pyrrhic profile: ${profile.name}`}
                file={exportProfileFile(profile, gameData.dataVersion)}
              />
            ),
          },
          {
            value: 'battle',
            label: 'Battle link',
            content: (
              <LinkPanel
                state={links.battle}
                budget={BATTLE_LINK_BUDGET}
                title="Battle"
                shareText={`Pyrrhic stack: ${setup?.name ?? profile.name}`}
              />
            ),
          },
        ]}
      />
    </Dialog>
  );
}
