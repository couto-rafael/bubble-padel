import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import AthleteHeader from "../components/AthleteHeader";
import AthleteBottomNav from "../components/AthleteBottomNav";
import AthletePostCard from "../components/AthletePostCard";
import { FeedService, FeedPost } from "../services/api";

const FeedPage: React.FC = () => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadFeed = useCallback(async (cursor?: string) => {
    try {
      const { posts: newPosts, nextCursor: nc } = await FeedService.get(cursor);
      if (cursor) {
        setPosts((prev) => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      setNextCursor(nc);
    } catch (err) {
      setError("Erro ao carregar feed.");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadFeed().finally(() => setLoading(false));
  }, [loadFeed]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor && !loadingMore) {
          setLoadingMore(true);
          loadFeed(nextCursor).finally(() => setLoadingMore(false));
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore, loadFeed]);

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <AthleteHeader />

      <main className="max-w-xl mx-auto px-4 pb-28 pt-6">
        <h1 className="text-xl font-extrabold text-gray-900 mb-5">Feed</h1>

        {loading && (
          <div className="flex justify-center pt-16">
            <span className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <p className="text-center text-red-500 text-sm mt-8">{error}</p>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-16 gap-4 text-center">
            <span className="text-5xl">🤝</span>
            <p className="text-gray-500 text-sm max-w-xs">
              Conecte com outros atletas para ver atualizações no feed.
            </p>
            <Link
              to="/tournaments"
              className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Encontrar atletas em torneios
            </Link>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <AthletePostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={loaderRef} className="h-4 mt-4" />

        {loadingMore && (
          <div className="flex justify-center py-4">
            <span className="w-6 h-6 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {!nextCursor && posts.length > 0 && (
          <p className="text-center text-xs text-gray-400 mt-4">
            Você está em dia com o feed.
          </p>
        )}
      </main>

      <AthleteBottomNav />
    </div>
  );
};

export default FeedPage;
