export const DIRECTORY_SORTS = [
  "newest",
  "oldest",
  "name-asc",
  "name-desc",
] as const;

export type DirectorySort = (typeof DIRECTORY_SORTS)[number];

/** Empty string = in-select “Sort by” placeholder (disabled option). */
export type DirectorySortSelection = DirectorySort | "";

export const DIRECTORY_SORT_DEFAULT: DirectorySort = "newest";

export const DIRECTORY_SORT_SELECTION_VALUES = [
  "",
  ...DIRECTORY_SORTS,
] as const;

export const DIRECTORY_SORT_OPTIONS: Array<{
  id: DirectorySort;
  label: string;
}> = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "name-asc", label: "Name A–Z" },
  { id: "name-desc", label: "Name Z–A" },
];

export function resolveDirectorySort(value: string): DirectorySort {
  return (DIRECTORY_SORTS as readonly string[]).includes(value)
    ? (value as DirectorySort)
    : DIRECTORY_SORT_DEFAULT;
}

export function sortDirectoryRows<T>(
  rows: T[],
  sort: DirectorySort | DirectorySortSelection,
  getDate: (row: T) => string | Date,
  getName: (row: T) => string
) {
  const resolved = resolveDirectorySort(sort);
  const copy = [...rows];
  copy.sort((a, b) => {
    if (resolved === "name-asc" || resolved === "name-desc") {
      const cmp = getName(a).localeCompare(getName(b), undefined, {
        sensitivity: "base",
      });
      return resolved === "name-asc" ? cmp : -cmp;
    }
    const left = new Date(getDate(a)).getTime();
    const right = new Date(getDate(b)).getTime();
    return resolved === "newest" ? right - left : left - right;
  });
  return copy;
}
