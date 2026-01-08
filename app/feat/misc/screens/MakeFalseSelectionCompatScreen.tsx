import MakeFalseSelection from "@components/MakeFalseSelection";
import { LegacySandbox } from "@/shared/ui/LegacySandbox";

/**
 * Compat route element for legacy `/make_false_selection`.
 *
 * This is intentionally a thin wrapper so legacy engineers keep editing
 * [`MakeFalseSelection`](src/components/MakeFalseSelection.jsx:1).
 */
export function MakeFalseSelectionCompatScreen() {
  return (
    <LegacySandbox>
      <MakeFalseSelection />
    </LegacySandbox>
  );
}
