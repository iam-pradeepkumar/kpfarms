import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell, PageHero } from "@/components/site/page-shell";
import { listBlogPosts, resolveBlogMediaUrl, type BlogPost } from "@/lib/blog";
import { Loader2, X } from "lucide-react";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog & Articles — KP Farm Ventures" },
      {
        name: "description",
        content:
          "Simple poultry farming tips, business ideas, and real stories from KP Farm Ventures — written by real farmers, for real farmers.",
      },
      { property: "og:title", content: "Blog & Articles — KP Farm Ventures" },
      {
        property: "og:description",
        content: "Simple tips and business advice for poultry farmers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Blog,
});

function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<BlogPost | null>(null);

  useEffect(() => {
    listBlogPosts().then((p) => {
      setPosts(p);
      setLoading(false);
    });
  }, []);

  return (
    <PageShell>
      <PageHero
        eyebrow="Blog & Articles"
        title="Simple tips for"
        accent="real poultry farmers"
        desc="Real, tested tips on farm work, business, marketing and feed. We add new posts often."
      />

      <section className="px-6 pb-24 md:px-10">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-kp-green" />
          </div>
        ) : posts.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-stone-300 bg-white p-14 text-center text-sm text-stone-500">
            New posts are coming soon. Please check back later.
          </div>
        ) : (
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} onOpen={() => setOpen(p)} />
            ))}
          </div>
        )}
      </section>

      {open && <PostModal post={open} onClose={() => setOpen(null)} />}
    </PageShell>
  );
}

function useMediaUrl(value: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    resolveBlogMediaUrl(value).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [value]);
  return url;
}

function PostCard({ post, onOpen }: { post: BlogPost; onOpen: () => void }) {
  const cover = useMediaUrl(post.cover_url);
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white transition hover:-translate-y-1 hover:shadow-xl">
      <div className="aspect-video overflow-hidden bg-gradient-to-br from-kp-green/20 via-kp-gold/15 to-kp-red/10">
        {cover && (
          <img src={cover} alt={post.title} loading="lazy" className="size-full object-cover" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-kp-gold">
          <span>{post.category || "Farm Tips"}</span> ·{" "}
          <span className="text-stone-400">{new Date(post.published_at).toLocaleDateString()}</span>
        </div>
        <h2 className="mb-3 font-display text-lg font-bold">{post.title}</h2>
        <p className="mb-6 text-sm text-stone-600">{post.excerpt}</p>
        <button
          onClick={onOpen}
          className="mt-auto inline-flex items-center gap-1 self-start text-xs font-bold uppercase tracking-widest text-kp-green transition group-hover:gap-3"
        >
          Read Post <span aria-hidden>→</span>
        </button>
      </div>
    </article>
  );
}

function PostModal({ post, onClose }: { post: BlogPost; onClose: () => void }) {
  const cover = useMediaUrl(post.cover_url);
  const video = useMediaUrl(post.video_url);
  const isEmbed = !!post.video_url && /youtube|youtu\.be|vimeo/i.test(post.video_url);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-stone-900/60 p-4 backdrop-blur-sm">
      <div className="my-10 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl md:p-8">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-kp-gold">
              {post.category || "Farm Tips"} · {new Date(post.published_at).toLocaleDateString()}
            </div>
            <h2 className="font-display text-2xl font-extrabold">{post.title}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-stone-400 hover:bg-stone-100">
            <X size={18} />
          </button>
        </div>

        {cover && (
          <img src={cover} alt={post.title} className="mb-5 w-full rounded-2xl object-cover" />
        )}

        {post.video_url &&
          (isEmbed ? (
            <a
              href={post.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-5 inline-block rounded-xl border border-stone-200 px-4 py-2 text-xs font-bold uppercase tracking-widest text-kp-green"
            >
              Watch video
            </a>
          ) : (
            video && <video src={video} controls className="mb-5 w-full rounded-2xl" />
          ))}

        <div className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
          {post.content || post.excerpt}
        </div>
      </div>
    </div>
  );
}
