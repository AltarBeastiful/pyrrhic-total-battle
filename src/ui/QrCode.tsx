import { useMemo } from 'react';

import { encodeQr, qrPath, type QrEcc } from './qr';

export interface QrCodeProps {
  value: string;
  /** Error-correction level; L keeps the code small, M survives a worse camera. */
  ecc?: QrEcc;
  /** Quiet zone in modules (the standard asks for 4). */
  margin?: number;
  /** Rendered width/height in CSS pixels. */
  size?: number;
  label?: string;
  className?: string;
}

/**
 * The share link as a scannable code. Always black on white whatever the theme: a scanner needs the
 * contrast, and inverted codes are unreliable.
 */
export function QrCode({ value, ecc = 'M', margin = 4, size = 220, label, className }: QrCodeProps) {
  const code = useMemo(() => {
    try {
      return encodeQr(value, { ecc });
    } catch {
      return null;
    }
  }, [value, ecc]);

  if (!code) return null;
  const extent = code.size + margin * 2;

  return (
    <svg
      viewBox={`0 0 ${String(extent)} ${String(extent)}`}
      width={size}
      height={size}
      role="img"
      aria-label={label ?? 'QR code for the share link'}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width={extent} height={extent} fill="#ffffff" />
      <g transform={`translate(${String(margin)} ${String(margin)})`}>
        <path d={qrPath(code)} fill="#000000" />
      </g>
    </svg>
  );
}
