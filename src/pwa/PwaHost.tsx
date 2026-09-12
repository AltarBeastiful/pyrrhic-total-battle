import { InstallButton } from './InstallButton';
import { UpdateToast } from './UpdateToast';

/**
 * The single mount point for everything offline-related (`src/App.tsx`): an install offer and an
 * update toast, both usually rendering nothing. They float over the page rather than sitting in
 * the header, so the app shell stays exactly as the layout stories describe it.
 */
export function PwaHost() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-3">
      <InstallButton />
      <UpdateToast />
    </div>
  );
}
