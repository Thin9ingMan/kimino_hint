export type UiProfile = {
  displayName: string;
  furigana: string;
  grade: string;
  faculty: string;
  hobby: string;
  favoriteArtist: string;
};

function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/**
 * Maps backend `profileData` (free-form object) to the fields this app currently renders.
 * Unknown/missing fields become empty strings.
 */
export function mapProfileDataToUiProfile(
  profileData: Record<string, unknown> | null | undefined,
): UiProfile {
  const pd = profileData ?? {};

  return {
    displayName: getString(pd.displayName),
    furigana: getString(pd.furigana),
    grade: getString(pd.grade),
    faculty: getString(pd.faculty),
    hobby: getString(pd.hobby),
    favoriteArtist: getString(pd.favoriteArtist),
  };
}

export function isUiProfileEmpty(p: UiProfile): boolean {
  return (
    !p.displayName &&
    !p.furigana &&
    !p.grade &&
    !p.faculty &&
    !p.hobby &&
    !p.favoriteArtist
  );
}
