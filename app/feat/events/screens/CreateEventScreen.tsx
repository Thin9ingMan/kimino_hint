import MakeQuestion from '@/components/MakeQuestion';
import { LegacySandbox } from '@/shared/ui/LegacySandbox';

/**
 * compat.md strict alignment: alias wrapper mounting legacy screen.
 */
export function CreateEventScreen() {
  return (
    <LegacySandbox>
      <MakeQuestion />
    </LegacySandbox>
  );
}
