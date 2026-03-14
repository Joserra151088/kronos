import { useState } from "react";

const STORAGE_KEY = "sidebar_collapsed";

const useSidebar = () => {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "true"
  );

  const toggle = () =>
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });

  const setOpen = () => {
    localStorage.setItem(STORAGE_KEY, "false");
    setCollapsed(false);
  };

  return { collapsed, toggle, setOpen };
};

export default useSidebar;
