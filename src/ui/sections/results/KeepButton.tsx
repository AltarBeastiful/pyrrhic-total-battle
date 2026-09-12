import { PinIcon, UnpinIcon } from '@/ui/icons';
import { Button } from '@/ui/primitives';
import type { ButtonSize } from '@/ui/primitives';

import { keepInMarch, stopKeeping } from './formation';

export interface KeepButtonProps {
  unitId: string;
  /** Full name of the unit type; it makes the button's name unambiguous in a long list. */
  name: string;
  /** Is this type already kept in the march? */
  kept: boolean;
  disabled?: boolean;
  size?: ButtonSize;
  className?: string;
}

/**
 * "Keep in march" / "Stop keeping it" — the one control behind the pin (PLAN §3.4).
 *
 * Keeping a type in is stored on the march, so it survives every later change and the next Generate;
 * both directions re-size the march immediately, because the numbers on screen would otherwise answer a
 * question the player has just changed. The unit name is read out after the label rather than replacing
 * it, so what a screen reader announces still starts with what the button says.
 */
export function KeepButton({
  unitId,
  name,
  kept,
  disabled = false,
  size = 'sm',
  className,
}: KeepButtonProps) {
  return (
    <Button
      size={size}
      disabled={disabled}
      icon={kept ? <UnpinIcon /> : <PinIcon />}
      {...(className === undefined ? {} : { className })}
      onClick={() => {
        if (kept) stopKeeping(unitId);
        else keepInMarch(unitId);
      }}
    >
      {kept ? 'Stop keeping it' : 'Keep in march'}
      <span className="sr-only">{`: ${name}`}</span>
    </Button>
  );
}
