import {
  Queries,
} from "https://raw.githubusercontent.com/spacemeowx2/s3si.ts/main/src/types.ts";


export import PersistedQuery = Queries;

export const PersistedQueriesHashes = Object.entries(PersistedQuery).map((
  [_, value],
) => value);

export type Query = {
  persistedQuery: PersistedQuery,
  variables: {[name: string]: any},
}
