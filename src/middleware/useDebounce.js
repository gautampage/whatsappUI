import { useEffect, useState } from "react";

export const useDebounce = (input, delay = 500) => {
  const [debounceValue, setValue] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setValue(input);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [input, delay]);

  return debounceValue;
};
export default useDebounce;
