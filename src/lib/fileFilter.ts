import { create } from "zustand";

export type FlatItem = {
  type: "file" | "folder";
  path: string;
  name: string;
};

// Явные типы для дерева
export type TreeNode = string | [string, TreeNode[] | string];

export function flattenAndFilterTree(
  tree: TreeNode[],
  filter: string,
  parentPath = ""
): FlatItem[] {
  let result: FlatItem[] = [];
  for (const item of tree) {
    if (typeof item === "string") {
      if (!filter || item.toLowerCase().includes(filter.toLowerCase())) {
        result.push({
          type: item.includes(".") ? "file" : "folder",
          path: parentPath ? `${parentPath}/${item}` : item,
          name: item,
        });
      }
    } else if (Array.isArray(item)) {
      const [name, children] = item;
      const currentPath = parentPath ? `${parentPath}/${name}` : name;
      if (!filter || name.toLowerCase().includes(filter.toLowerCase())) {
        result.push({ type: "folder", path: currentPath, name });
      }
      if (Array.isArray(children)) {
        result = result.concat(
          flattenAndFilterTree(children, filter, currentPath)
        );
      } else if (typeof children === "string") {
        if (!filter || children.toLowerCase().includes(filter.toLowerCase())) {
          result.push({
            type: children.includes(".") ? "file" : "folder",
            path: `${currentPath}/${children}`,
            name: children,
          });
        }
      }
    }
  }
  return result;
}

interface FileFilterState {
  filter: string;
  setFilter: (value: string) => void;
  filtered: FlatItem[];
  updateFiltered: (tree: TreeNode[], filter: string) => void;
}

export const createFileFilterStore = (tree: TreeNode[]) =>
  create<FileFilterState>((set) => ({
    filter: "",
    filtered: [],
    setFilter: (value) =>
      set(() => {
        if (!value) {
          return { filter: value, filtered: [] };
        }
        const filtered = flattenAndFilterTree(tree, value);
        return { filter: value, filtered };
      }),
    updateFiltered: (treeArg, filter) =>
      set(() => ({
        filtered: filter ? flattenAndFilterTree(treeArg, filter) : [],
      })),
  }));
