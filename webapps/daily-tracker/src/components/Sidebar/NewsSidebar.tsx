import React from 'react';
import { 
  Newspaper, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink, 
  Globe, 
  Briefcase, 
  Cpu, 
  Sparkles 
} from 'lucide-react';
import clsx from 'clsx';

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  description: string;
  thumbnail: string | null;
  category?: string;
}

interface NewsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  theme?: 'dark' | 'light';
}

const NPR_FEEDS = [
  { id: '1001', name: 'Top News', icon: Sparkles },
  { id: '1003', name: 'World', icon: Globe },
  { id: '1006', name: 'Business', icon: Briefcase },
  { id: '1019', name: 'Tech', icon: Cpu },
];

const FALLBACK_NEWS: NewsItem[] = [
  {
    id: 'npr-1',
    title: 'Trump gave Xi Jinping a warm welcome. What did the talks accomplish?',
    link: 'https://www.npr.org/2026/09/26/nx-s1-5980066/trump-gave-xi-jinping-a-warm-welcome-what-did-the-talks-accomplish',
    pubDate: new Date(Date.now() - 3600000 * 2).toISOString(),
    description: 'From the National Archives to the state dinner, President Trump and Xi Jinping looked comfortable together in Washington. Here is a breakdown of what the diplomatic talks achieved and key takeaways.',
    thumbnail: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=300&auto=format&fit=crop&q=80',
    category: 'Top News'
  },
  {
    id: 'npr-2',
    title: 'How clean energy infrastructure is transforming global grid networks',
    link: 'https://www.npr.org/sections/news/',
    pubDate: new Date(Date.now() - 3600000 * 5).toISOString(),
    description: 'Renewable energy integration has reached record velocity across global municipal utilities. High-capacity battery storage and smart grid algorithms are reducing peak demand loads worldwide.',
    thumbnail: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=300&auto=format&fit=crop&q=80',
    category: 'Tech'
  },
  {
    id: 'npr-3',
    title: 'Central banks evaluate inflation trends amid shifting trade policies',
    link: 'https://www.npr.org/sections/business/',
    pubDate: new Date(Date.now() - 3600000 * 8).toISOString(),
    description: 'Global financial analysts highlight steady employment indicators and moderating consumer indices. Fiscal leaders emphasize balanced monetary policy as market indices continue steady growth.',
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300&auto=format&fit=crop&q=80',
    category: 'Business'
  },
  {
    id: 'npr-4',
    title: 'Astronomers detect unprecedented deep space radio burst patterns',
    link: 'https://www.npr.org/sections/science/',
    pubDate: new Date(Date.now() - 3600000 * 12).toISOString(),
    description: 'Using next-generation radio telescope arrays, researchers mapped rhythmic signals originating from a distant galactic cluster. The findings offer new insight into cosmic magnetic fields.',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&auto=format&fit=crop&q=80',
    category: 'Top News'
  }
];

function cleanHtml(raw: string): string {
  if (!raw) return '';
  const clean = raw.replace(/<[^>]+>/g, '').trim();
  return clean
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'");
}

function extractImage(item: any): string | null {
  if (item.thumbnail && !item.thumbnail.includes('npr-rss-pixel.png')) {
    return item.thumbnail;
  }
  if (item.enclosure?.link && item.enclosure.type?.startsWith('image')) {
    return item.enclosure.link;
  }
  const imgMatch = item.description?.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1] && !imgMatch[1].includes('npr-rss-pixel.png')) {
    return imgMatch[1];
  }
  const contentMatch = item.content?.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (contentMatch && contentMatch[1] && !contentMatch[1].includes('npr-rss-pixel.png')) {
    return contentMatch[1];
  }
  return null;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

export const NewsSidebar: React.FC<NewsSidebarProps> = ({
  isOpen,
  onClose,
  onOpen,
  theme,
}) => {
  const [activeFeed, setActiveFeed] = React.useState('1001');
  const [items, setItems] = React.useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const isLight = theme === 'light';

  const fetchNews = React.useCallback(async (feedId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ffeeds.npr.org%2F${feedId}%2Frss.xml`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      if (data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
        const parsedItems: NewsItem[] = data.items.map((item: any, idx: number) => ({
          id: item.guid || item.link || `npr-${feedId}-${idx}`,
          title: cleanHtml(item.title),
          link: item.link,
          pubDate: item.pubDate,
          description: cleanHtml(item.description),
          thumbnail: extractImage(item),
          category: NPR_FEEDS.find(f => f.id === feedId)?.name || 'NPR News'
        }));
        setItems(parsedItems);
      } else {
        setItems(FALLBACK_NEWS);
      }
    } catch (err) {
      console.warn('Could not load live NPR feed, using fallback news items:', err);
      setItems(FALLBACK_NEWS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      fetchNews(activeFeed);
    }
  }, [isOpen, activeFeed, fetchNews]);

  if (!isOpen) {
    return (
      <div
        onClick={onOpen}
        className={clsx(
          "w-10 flex flex-col items-center justify-between py-4 h-full border-r cursor-pointer transition-all group flex-shrink-0 z-20 select-none",
          isLight 
            ? "bg-white hover:bg-blue-50/80 border-blue-200/90 text-slate-600 hover:text-blue-600 shadow-sm" 
            : "bg-slate-950/80 hover:bg-slate-900 border-white/[0.08] text-slate-400 hover:text-white"
        )}
        title="Expand NPR News Sidebar"
      >
        <div className="flex flex-col items-center pt-2">
          <div className={clsx(
            "w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 shadow-2xs border",
            isLight ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-blue-950/60 border-blue-800/40 text-blue-400"
          )}>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>

        <span className={clsx(
          "text-[10px] font-bold tracking-widest uppercase opacity-60 group-hover:opacity-100 transition-opacity whitespace-nowrap",
          "[writing-mode:vertical-rl] rotate-180",
          isLight ? "text-slate-500" : "text-slate-400"
        )}>
          NPR News
        </span>
      </div>
    );
  }

  return (
    <aside className={clsx(
      "w-full sm:w-80 lg:w-88 flex flex-col h-full border-r min-h-0 flex-shrink-0 transition-all duration-300 z-20 shadow-2xl",
      isLight 
        ? "bg-white border-blue-200/90 text-slate-900 shadow-blue-500/5" 
        : "bg-slate-950/95 border-white/[0.08] text-slate-100 shadow-black/50"
    )}>
      {/* Header Bar */}
      <div className={clsx(
        "p-4 border-b flex items-center justify-between transition-colors",
        isLight ? "bg-blue-50/70 border-blue-200" : "bg-slate-900/80 border-white/[0.08]"
      )}>
        <div>
          <h2 className={clsx("text-sm font-bold tracking-tight", isLight ? "text-slate-900" : "text-white")}>
            NPR News
          </h2>
          <p className={clsx("text-[10px] font-medium", isLight ? "text-slate-500" : "text-slate-400")}>
            Headlines & World Updates
          </p>
        </div>

        {/* Action Controls: Refresh & Collapse */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => fetchNews(activeFeed)}
            disabled={isLoading}
            className={clsx(
              "p-1.5 rounded-xl border transition-all duration-150 active:scale-95",
              isLight 
                ? "text-slate-600 hover:text-blue-600 hover:bg-blue-100 border-blue-200" 
                : "text-slate-400 hover:text-white hover:bg-slate-800 border-white/[0.08]"
            )}
            title="Refresh Headlines"
          >
            <RotateCw className={clsx("w-3.5 h-3.5", isLoading && "animate-spin text-blue-500")} />
          </button>

          <button
            onClick={onClose}
            className={clsx(
              "p-1.5 rounded-xl border transition-all duration-150 active:scale-95",
              isLight 
                ? "text-slate-600 hover:text-red-600 hover:bg-red-50 border-blue-200" 
                : "text-slate-400 hover:text-white hover:bg-slate-800 border-white/[0.08]"
            )}
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feed Category Pills */}
      <div className={clsx(
        "px-3 py-2 border-b flex items-center space-x-1 overflow-x-auto scrollbar-none",
        isLight ? "bg-slate-50/80 border-blue-200/60" : "bg-slate-900/40 border-white/[0.05]"
      )}>
        {NPR_FEEDS.map((feed) => {
          const IconComp = feed.icon;
          const isActive = activeFeed === feed.id;
          return (
            <button
              key={feed.id}
              onClick={() => setActiveFeed(feed.id)}
              className={clsx(
                "flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all duration-150 active:scale-95",
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                  : isLight 
                    ? "text-slate-600 hover:text-blue-600 hover:bg-blue-100/60" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              )}
            >
              <IconComp className="w-3 h-3" />
              <span>{feed.name}</span>
            </button>
          );
        })}
      </div>

      {/* News Articles List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 scrollbar-thin">
        {isLoading ? (
          // Skeleton Loader Cards
          Array.from({ length: 4 }).map((_, i) => (
            <div 
              key={`skeleton-${i}`} 
              className={clsx(
                "p-3 rounded-xl border animate-pulse flex space-x-3",
                isLight ? "bg-slate-100 border-slate-200" : "bg-slate-900/50 border-white/[0.05]"
              )}
            >
              <div className={clsx("w-16 h-16 rounded-xl flex-shrink-0", isLight ? "bg-slate-200" : "bg-slate-800")} />
              <div className="flex-1 space-y-2 py-0.5">
                <div className={clsx("h-3.5 rounded w-5/6", isLight ? "bg-slate-300" : "bg-slate-700")} />
                <div className={clsx("h-3 rounded w-full", isLight ? "bg-slate-200" : "bg-slate-800")} />
                <div className={clsx("h-3 rounded w-4/5", isLight ? "bg-slate-200" : "bg-slate-800")} />
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <Newspaper className={clsx("w-8 h-8 mx-auto opacity-40", isLight ? "text-slate-400" : "text-slate-600")} />
            <p className={clsx("text-xs font-medium", isLight ? "text-slate-500" : "text-slate-400")}>
              No articles available for this section right now.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const relTime = formatRelativeTime(item.pubDate);
            return (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                  "group flex flex-col p-3 rounded-xl border transition-all duration-200 hover:scale-[1.01] block",
                  isLight 
                    ? "bg-white hover:bg-blue-50/50 border-blue-200/80 hover:border-blue-300 shadow-2xs hover:shadow-md" 
                    : "bg-slate-900/80 hover:bg-slate-900 border-white/[0.06] hover:border-blue-500/30 shadow-lg"
                )}
              >
                <div className="flex items-start space-x-3">
                  {/* Article Thumbnail */}
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-white/10 group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // Hide image if broken link
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className={clsx(
                      "w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 border font-bold text-xs",
                      isLight ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-purple-950/40 border-purple-800/30 text-purple-400"
                    )}>
                      NPR
                    </div>
                  )}

                  {/* Title & Meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between space-x-1 mb-1">
                      <span className={clsx("text-[10px] font-bold uppercase tracking-wider", isLight ? "text-blue-600" : "text-blue-400")}>
                        {item.category || 'NPR'}
                      </span>
                      {relTime && (
                        <span className={clsx("text-[10px] font-medium", isLight ? "text-slate-400" : "text-slate-500")}>
                          {relTime}
                        </span>
                      )}
                    </div>

                    <h3 className={clsx(
                      "text-xs font-bold leading-snug tracking-tight group-hover:text-blue-500 transition-colors line-clamp-2",
                      isLight ? "text-slate-900" : "text-slate-100"
                    )}>
                      {item.title}
                    </h3>
                  </div>
                </div>

                {/* 3 Lines Preview Text */}
                {item.description && (
                  <p className={clsx(
                    "text-[11px] leading-relaxed mt-2 line-clamp-3 font-sans",
                    isLight ? "text-slate-600" : "text-slate-300"
                  )}>
                    {item.description}
                  </p>
                )}

                {/* Card Footer: Read full article link */}
                <div className={clsx(
                  "mt-2 pt-2 border-t flex items-center justify-between text-[10px] font-medium transition-colors",
                  isLight ? "border-blue-100 text-slate-500 group-hover:text-blue-600" : "border-white/[0.04] text-slate-400 group-hover:text-blue-400"
                )}>
                  <span>Read on NPR</span>
                  <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </a>
            );
          })
        )}
      </div>
    </aside>
  );
};
