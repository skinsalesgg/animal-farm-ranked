export type TierListItem = {
  id: string;
  name: string;
  label: string;
  imageUrl: string;
  sortOrder: number;
};

export type TierListDefinition = {
  id: string;
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  rankTitle: string;
  rankLead: string;
  communityTitle: string;
  communityLead: string;
  unrankedCopy: (remaining: number, total: number) => string;
  items: TierListItem[];
};
