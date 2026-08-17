export const DIRECTORY_SORTS = [
  "newest",
  "oldest",
  "name-asc",
  "name-desc",
] as const;

export type DirectorySort = (typeof DIRECTORY_SORTS)[number];

export const DIRECTORY_SORT_OPTIONS: Array<{
  id: DirectorySort;
  label: string;
}> = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "name-asc", label: "Name A–Z" },
  { id: "name-desc", label: "Name Z–A" },
];

export function sortDirectoryRows<T>(
  rows: T[],
  sort: DirectorySort,
  getDate: (row: T) => string | Date,
  getName: (row: T) => string
) {
  const copy = [...rows];
  copy.sort((a, b) => {
    if (sort === "name-asc" || sort === "name-desc") {
      const cmp = getName(a).localeCompare(getName(b), undefined, {
        sensitivity: "base",
      });
      return sort === "name-asc" ? cmp : -cmp;
    }
    const left = new Date(getDate(a)).getTime();
    const right = new Date(getDate(b)).getTime();
    return sort === "newest" ? right - left : left - right;
  });
  return copy;
}
