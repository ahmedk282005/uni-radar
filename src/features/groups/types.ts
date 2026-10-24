// A group as the app sees it (camelCase). The database row uses snake_case;
// groups-api.ts converts between the two.
export type Group = {
  id: number;
  name: string;
  inviteCode: string;
};
