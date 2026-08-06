import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "KP Farm Ventures — Poultry Farming Help, Training & Farm Visits" },
      {
        name: "description",
        content:
          "KP Farm Ventures helps new poultry farmers in India with online meeting, useful products, farm training, and farm visits.",
      },
      { name: "author", content: "KP Farm Ventures" },
      {
        property: "og:title",
        content: "KP Farm Ventures — Poultry Farming Help, Training & Farm Visits",
      },
      {
        property: "og:description",
        content:
          "KP Farm Ventures helps new poultry farmers in India with online meeting, useful products, farm training, and farm visits.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "KP Farm Ventures — Poultry Farming Help, Training & Farm Visits",
      },
      {
        name: "twitter:description",
        content:
          "KP Farm Ventures helps new poultry farmers in India with online meeting, useful products, farm training, and farm visits.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d2044ea1-131a-46ef-895e-1d7461fe78ee/id-preview-e38215cd--1e7325f9-8230-4fd0-8e99-964f82c09b96.lovable.app-1784561333609.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d2044ea1-131a-46ef-895e-1d7461fe78ee/id-preview-e38215cd--1e7325f9-8230-4fd0-8e99-964f82c09b96.lovable.app-1784561333609.png",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=Inter:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
  pendingComponent: LoadingScreen,
});

function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      <video
        src="https://www.image2url.com/r2/default/videos/1786038730680-c9cd68c1-328d-4f08-8152-4b40d57c7104.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/35 flex flex-col justify-end p-8 md:p-12">
        <div className="flex items-center gap-3">
          <span className="flex size-4 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <span className="text-sm font-bold uppercase tracking-widest text-white drop-shadow">
            Loading KP Farm Ventures...
          </span>
        </div>
      </div>
    </div>
  );
}

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    // Show loader on page transition
    setShowLoading(true);

    const fallbackTimer = setTimeout(() => {
      setShowLoading(false);
    }, 1500); // 1.5s fallback so page is never blocked forever

    const handleLoaded = () => {
      // Small 150ms delay to make it smooth and let transitions settle
      setTimeout(() => setShowLoading(false), 150);
      clearTimeout(fallbackTimer);
    };

    window.addEventListener("page-data-loaded", handleLoaded);
    return () => {
      window.removeEventListener("page-data-loaded", handleLoaded);
      clearTimeout(fallbackTimer);
    };
  }, [pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      {showLoading && <LoadingScreen />}
    </QueryClientProvider>
  );
}
