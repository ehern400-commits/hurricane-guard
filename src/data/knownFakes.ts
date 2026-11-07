export interface KnownFake {
  hash: string;
  title: string;
  year: number;
  factCheckUrl: string;
}

// Add only verified fake-image entries. Generate each 16-character dHash with the team tool in Settings,
// then include the image title, original year, and a reputable fact-check URL.
export const KNOWN_FAKES: KnownFake[] = [];
