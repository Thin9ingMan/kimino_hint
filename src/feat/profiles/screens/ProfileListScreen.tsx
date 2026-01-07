import ListProfile from '@/components/screens/profiles/ListProfile';
import { LegacySandbox } from '@/shared/ui/LegacySandbox';

/**
 * compat.md strict alignment: alias wrapper mounting legacy screen.
 */
export function ProfileListScreen() {
  return (
    <LegacySandbox>
      <ListProfile />
    </LegacySandbox>
  );
}
