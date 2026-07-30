export interface Post {
  id: string;

  updated: string;

  title: string | null;

  originalTitle: string | null;

  description: string | null;

  languages: string[];

  developer: string | null;

  releasedDate: string | null;

  ageRating: string | null;

  tags: string[];

  resources: string[];
}
