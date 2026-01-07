import ProfileHistory from '@/components/Profile_history';
import { LegacySandbox } from '@/shared/ui/LegacySandbox';

/**
 * compat.md strict alignment: alias wrapper mounting legacy screen.
 */
export function ReceivedFriendshipsScreen() {
  return (
    <LegacySandbox>
      <ProfileHistory />
    </LegacySandbox>
  );
}
