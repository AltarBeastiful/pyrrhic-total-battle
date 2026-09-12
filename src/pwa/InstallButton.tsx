import { useSyncExternalStore } from 'react';

import { DownloadIcon } from '@/ui/icons';
import { Button } from '@/ui/primitives';

import { isInstallAvailable, promptInstall, subscribeToInstall } from './install';

/**
 * Offers to install Pyrrhic as an app. Only rendered while the browser has told us it would
 * accept an install (`beforeinstallprompt`), which means it is absent on browsers that install
 * through their own menu, and gone for good once the app is installed.
 */
export function InstallButton() {
  const available = useSyncExternalStore(subscribeToInstall, isInstallAvailable, () => false);

  if (!available) return null;

  return (
    <Button
      variant="secondary"
      size="sm"
      icon={<DownloadIcon />}
      className="pointer-events-auto shadow-lg"
      onClick={() => {
        void promptInstall();
      }}
    >
      Install app
    </Button>
  );
}
