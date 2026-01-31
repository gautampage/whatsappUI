import { useEffect, useState } from "react";

export const useGetDocumentSize = (url) => {
  const [documentName, setDocName] = useState("");
  const [docSize, setDocSize] = useState(0);

  async function getFileSizeFromIframeUrl(url) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      if (!response.ok) throw new Error("Failed to fetch metadata");
      const size = response.headers.get("content-length");
      console.log("File size (bytes):", size, url);
      setDocName("document1");
      setDocSize(size);
      console.log(size);
      return;
    } catch (error) {
      console.error(error);
      return null;
    }
  }
  useEffect(() => {
    getFileSizeFromIframeUrl(url);
    return () => {};
  }, [url]);

  return { documentName, docSize };
};

export default useGetDocumentSize;
