import { cidRecords, type CidRecord } from "@/lib/cid-data";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function findCidRecord(search: string): CidRecord | undefined {
  const query = normalize(search.replace(".", ""));

  if (!query) {
    return undefined;
  }

  return cidRecords.find((record) => {
    const code = normalize(record.code.replace(".", ""));
    const abbreviation = normalize(record.abbreviation);
    const description = normalize(record.description);

    return (
      code.startsWith(query) ||
      abbreviation.includes(query) ||
      description.includes(query)
    );
  });
}

export function searchCidRecords(search: string, limit = 8): CidRecord[] {
  const query = normalize(search.replace(".", ""));

  if (query.length < 2) {
    return [];
  }

  return cidRecords
    .filter((record) => {
      const code = normalize(record.code.replace(".", ""));
      const abbreviation = normalize(record.abbreviation);
      const description = normalize(record.description);

      return (
        code.startsWith(query) ||
        abbreviation.includes(query) ||
        description.includes(query)
      );
    })
    .slice(0, limit);
}
