"use client";

import { useCallback, useEffect, useState } from "react";

export default function useCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const close = useCallback(() => { setOpen(false); setQuery(""); setSelectedIndex(0); }, []);
  const show = useCallback(() => { setOpen(true); setSelectedIndex(0); }, []);

  useEffect(() => {
    function handleKeydown(event) {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [close]);

  return { open, setOpen, query, setQuery, selectedIndex, setSelectedIndex, close, show };
}
