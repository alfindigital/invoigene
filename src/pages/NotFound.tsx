import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const CANONICAL = "https://invoigene.lovable.app/404";

const setMeta = (selector: string, attr: string, value: string) => {
  let el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
  if (!el) {
    if (selector.startsWith("link")) {
      el = document.createElement("link");
      (el as HTMLLinkElement).rel = "canonical";
    } else {
      el = document.createElement("meta");
      const match = selector.match(/\[(name|property)="([^"]+)"\]/);
      if (match) (el as HTMLMetaElement).setAttribute(match[1], match[2]);
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);

    const prevTitle = document.title;
    const desc = "Halaman tidak ditemukan di Notaku. Kembali ke beranda untuk membuat nota.";
    document.title = "404 — Halaman Tidak Ditemukan | Notaku";
    setMeta('meta[name="description"]', "content", desc);
    setMeta('meta[property="og:title"]', "content", "404 — Halaman Tidak Ditemukan | Notaku");
    setMeta('meta[property="og:description"]', "content", desc);
    setMeta('meta[property="og:url"]', "content", CANONICAL);
    setMeta('link[rel="canonical"]', "href", CANONICAL);

    return () => {
      document.title = prevTitle;
      setMeta('link[rel="canonical"]', "href", "https://invoigene.lovable.app/");
      setMeta('meta[property="og:url"]', "content", "https://invoigene.lovable.app/");
    };
  }, [location.pathname]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Halaman tidak ditemukan</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Kembali ke Beranda
        </a>
      </div>
    </main>
  );
};

export default NotFound;
