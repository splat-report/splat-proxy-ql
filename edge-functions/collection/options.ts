import { boolean as looksTrue } from 'npm:boolean';

export function makeDataCollectionOptions(request: Request) {
  const url = new URL(request.url);

  return {
    allow: looksTrue(url.searchParams.get("allow-data-collection")),
    sessionId: url.searchParams.get("data-collection-session") ??
      crypto.randomUUID(),
  };
}
