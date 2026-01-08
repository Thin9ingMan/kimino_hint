import ReadQRCode from '@/components/ReadQRCode';
import { LegacySandbox } from '@/shared/ui/LegacySandbox';

/**
 * New Spec route element.
 *
 * compat.md strict alignment: this screen is an alias wrapper that mounts the legacy
 * screen implementation so legacy devs can keep editing `src/components/*`.
 *
 * NOTE: Wrapped in `.legacy` sandbox to allow scoping legacy CSS.
 */
export function QrScanScreen() {
  return (
    <LegacySandbox>
      <ReadQRCode />
    </LegacySandbox>
  );
}
