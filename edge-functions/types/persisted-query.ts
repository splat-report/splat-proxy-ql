import {
  Queries,
} from "https://raw.githubusercontent.com/spacemeowx2/s3si.ts/main/src/types.ts";


export import PersistedQuery = Queries;

export const PersistedQueriesReverse = Object.fromEntries(Object.entries(PersistedQuery).map((
  [name, value],
) => [value, name]))

export type Query = {
  persistedQuery: PersistedQuery,
  variables: {[name: string]: any},
}
