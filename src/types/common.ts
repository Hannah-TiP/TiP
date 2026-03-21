export interface MultiLanguageString {
  en?: string | null;
  kr?: string | null;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Image {
  original: string;
  w128?: string | null;
  w400?: string | null;
  w800?: string | null;
  w1200?: string | null;
  alt?: MultiLanguageString | null;
}
