import { useState, useEffect } from "react";

export function useLocalStorageList(key, initialValue) {
  const [data, setData] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(data));
  }, [data, key]);

  return { data, setData };
}
