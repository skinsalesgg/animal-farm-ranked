import { useEffect } from "react";

import { SITE_NAME } from "../config";

type PageMetaProps = {
  title: string;
  description?: string;
};

export function PageMeta({ title, description }: PageMetaProps) {
  useEffect(() => {
    document.title = `${title} | ${SITE_NAME}`;
    if (description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute("content", description);
      }
    }
  }, [title, description]);

  return null;
}
