import ProfileDetail from '@/components/screens/profiles/ProfileDetail';
import { LegacySandbox } from '@/shared/ui/LegacySandbox';

/**
 * compat.md strict alignment: alias wrapper mounting legacy screen.
 */
export function ProfileDetailScreen() {
  return (
    <LegacySandbox>
      <ProfileDetail />
    </LegacySandbox>
  );
}
