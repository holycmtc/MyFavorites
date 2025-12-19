export interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon?: string; // Optional custom icon URL, otherwise we use favicon
}

export interface Group {
  id: string;
  title: string;
  items: LinkItem[];
  pageIndex: number; // 0-9 representing which Tab/Page this group belongs to
}

export interface ModalState {
  isOpen: boolean;
  groupId: string | null;
}