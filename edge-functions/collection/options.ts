export function makeDataCollectionOptions(request: Request) {
  const url = new URL(request.url);

  return {
    allow: isAllowingValue(url.searchParams.get("allow-data-collection")),
    sessionId: url.searchParams.get("data-collection-session") ??
      crypto.randomUUID(),
  };
}

function isAllowingValue(v: string | null) {
  return ["true", "1"].includes(v ?? "no");
}
