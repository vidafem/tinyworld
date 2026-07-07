"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, Loader2, BookOpen, Bookmark, Sparkles, Book, Info 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { themePalettes } from "@/lib/themes";
import PregnancyDigitalAlbum from "./Pregnancy/PregnancyDigitalAlbum";

const getProxiedUrl = (u: string | null | undefined) => {
  if (!u) return '';
  if (u.includes('pub-4a2749c0c0864d419453a629df18fd63.r2.dev') || u.includes('r2.dev')) {
    return `/api/download?url=${encodeURIComponent(u)}`;
  }
  return u;
};

interface BookHubProps {
  childId: string;
}

interface LifeSection {
  id: string;
  child_id: string;
  title: string;
  created_at: string;
  show_in_books?: boolean;
  baby_photo?: string | null;
}

interface BookItem {
  id: string | null; // null for pregnancy default book
  title: string;
  subtitle: string;
  pageCount: number;
  createdAt: string;
  showInBooks: boolean;
  coverImage?: string | null;
}

export default function BookHub({ childId }: BookHubProps) {
  const router = useRouter();
  const [child, setChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [selectedBook, setSelectedBook] = useState<{ id: string | null; title: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth < 768);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  async function loadData() {
    try {
      const [childRes, stagesRes, pagesRes] = await Promise.all([
        supabase.from("children").select("*").eq("id", childId).single(),
        supabase.from("life_sections").select("*").eq("child_id", childId).order("created_at", { ascending: true }),
        supabase.from("pregnancy_album_pages").select("page_number, section_id").eq("child_id", childId)
      ]);

      if (childRes.data) setChild(childRes.data);

      const stages: LifeSection[] = stagesRes.data || [];
      const pages = pagesRes.data || [];

      // Calculate pages counts
      const getPageCount = (sectionId: string | null) => {
        return pages.filter(p => p.section_id === sectionId).length;
      };

      const bookList: BookItem[] = [];

      // 1. Default pregnancy book
      bookList.push({
        id: null,
        title: "Diario de Embarazo",
        subtitle: "La dulce espera",
        pageCount: getPageCount(null),
        createdAt: childRes.data?.created_at || new Date().toISOString(),
        showInBooks: childRes.data?.preview_config?.show_pregnancy_book !== false,
        coverImage: childRes.data?.cover_image || childRes.data?.photo_url || null
      });

      // 2. Custom stage books
      stages.forEach(stage => {
        bookList.push({
          id: stage.id,
          title: stage.title,
          subtitle: "Etapa de Vida",
          pageCount: getPageCount(stage.id),
          createdAt: stage.created_at,
          showInBooks: stage.show_in_books !== false,
          coverImage: stage.baby_photo || null
        });
      });

      setBooks(bookList);
      setLoading(false);
    } catch (err) {
      console.error("Error loading library data:", err);
      setLoading(false);
    }
  }

  async function handleToggleBookVisibility(book: BookItem) {
    const newValue = !book.showInBooks;
    try {
      // Update local state immediately for instant feedback
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, showInBooks: newValue } : b));
      
      if (book.id === null) {
        // Toggle default pregnancy book
        const updatedConfig = {
          ...(child.preview_config || {}),
          show_pregnancy_book: newValue
        };
        
        const { error } = await supabase
          .from("children")
          .update({ preview_config: updatedConfig })
          .eq("id", childId);
          
        if (error) throw error;
        
        // Update local child state
        setChild((prev: any) => ({ ...prev, preview_config: updatedConfig }));
      } else {
        // Toggle custom stage book
        const { error } = await supabase
          .from("life_sections")
          .update({ show_in_books: newValue })
          .eq("id", book.id);
          
        if (error) throw error;
      }
    } catch (err) {
      console.error("Error toggling book visibility:", err);
      // Revert local state in case of error
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, showInBooks: !newValue } : b));
      alert("Error al actualizar la visibilidad");
    }
  }

  useEffect(() => {
    loadData();
  }, [childId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-texture">
        <Loader2 className="animate-spin text-black/20" size={48} />
      </div>
    );
  }

  if (!child) return null;
  const theme = themePalettes[child.theme_color] || themePalettes.neutral;

  if (selectedBook) {
    return (
      <div className="fixed inset-0 z-[1000] bg-black">
        <PregnancyDigitalAlbum
          childId={childId}
          sectionId={selectedBook.id}
          sectionTitle={selectedBook.title}
          child={child}
          theme={theme}
          isMobile={isMobile}
          onBack={() => {
            setSelectedBook(null);
            loadData(); // refresh books page count on return
          }}
        />
      </div>
    );
  }

  // Divide books into shelves of up to 3 books each
  const shelfSize = isMobile ? 2 : 3;
  const shelves: BookItem[][] = [];
  for (let i = 0; i < books.length; i += shelfSize) {
    shelves.push(books.slice(i, i + shelfSize));
  }

  return (
    <div className={`min-h-screen ${theme.bg} bg-texture transition-colors duration-500 flex flex-col relative pb-20`}>
      
      {/* Premium Header */}
      <header className="px-4 md:px-6 py-4 flex items-center justify-between bg-white/60 backdrop-blur-xl sticky top-0 z-[50] shadow-sm border-b border-white/50">
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => router.push(`/dashboard/child/${childId}`)} 
            className={`p-2.5 bg-white rounded-2xl shadow-sm ${theme.text} hover:scale-110 transition-all border ${theme.borderAccent}`}
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className={`font-outfit font-black text-lg md:text-xl ${theme.text} leading-tight`}>Bóveda de Libros</h1>
            <p className={`text-[10px] ${theme.text} opacity-50 uppercase tracking-wider font-bold`}>Álbumes digitales de {child.nickname || child.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white/80 border border-white px-3 py-1.5 rounded-full shadow-inner text-[10px] font-bold text-gray-500">
          <BookOpen size={12} className={theme.text} />
          <span>{books.length} {books.length === 1 ? "Álbum" : "Álbumes"}</span>
        </div>
      </header>

      {/* Main content shelf structure */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 md:py-16 flex flex-col gap-12 md:gap-16">
        
        {/* Shelves rendering */}
        <div className="flex flex-col gap-16 md:gap-24 select-none">
          {shelves.map((shelfBooks, shelfIdx) => (
            <div key={shelfIdx} className="relative flex flex-col items-center">
              
              {/* Shelf books row */}
              <div className="flex justify-around items-end w-full px-4 md:px-12 relative z-10 gap-4 md:gap-12 min-h-[260px] md:min-h-[340px]">
                {shelfBooks.map((book) => {
                  // Generate an elegant cover gradient using the child's theme color
                  const bookColor = theme.hex || "#9A8F80";
                  
                  return (
                    <div key={book.id || "pregnancy"} className="flex flex-col items-center gap-4">
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: shelfIdx * 0.1 }}
                        whileHover={{ 
                          y: -10, 
                          rotateY: -6,
                          scale: 1.03,
                          transition: { duration: 0.2 }
                        }}
                        onClick={() => setSelectedBook({ id: book.id, title: book.title })}
                        className="relative cursor-pointer w-32 h-44 md:w-44 md:h-60 rounded-r-xl shadow-2xl flex flex-col justify-between overflow-hidden group perspective"
                        style={{
                          background: book.coverImage
                            ? `url('${getProxiedUrl(book.coverImage)}') center/cover no-repeat`
                            : `linear-gradient(135deg, ${bookColor}dd 0%, ${bookColor} 100%)`,
                          boxShadow: "5px 15px 35px rgba(0,0,0,0.25), -2px 0 5px rgba(255,255,255,0.15) inset"
                        }}
                      >
                        {/* Leather texture overlay */}
                        {book.coverImage && (
                          <div className="absolute inset-0 bg-black/35 pointer-events-none z-0" />
                        )}
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-black/0 to-black/30 pointer-events-none mix-blend-multiply" />
                        <div className="absolute inset-0 bg-white/[0.03] opacity-40 mix-blend-overlay pointer-events-none" />
                        
                        {/* Book spine line shadow to make it 3D */}
                        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/30 via-white/10 to-transparent border-r border-black/10" />
                        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-black/20" />

                        {/* Gold foil header/borders */}
                        <div className="pt-5 px-4 text-center z-10">
                          <div className="w-8 h-8 rounded-full border border-yellow-200/40 mx-auto flex items-center justify-center mb-2">
                            <Bookmark size={14} className="text-yellow-200/70" />
                          </div>
                          <h3 className="font-serif font-bold text-xs md:text-sm text-yellow-100 tracking-tight leading-snug drop-shadow-md">
                            {book.title}
                          </h3>
                          <p className="text-[8px] md:text-[9px] text-white/50 font-bold uppercase tracking-wider mt-1 font-outfit">
                            {book.subtitle}
                          </p>
                        </div>

                        {/* Cover embossed footer */}
                        <div className="pb-4 px-4 text-center z-10">
                          <div className="inline-block px-2 py-0.5 rounded bg-black/15 border border-white/10 text-[8px] md:text-[9px] text-yellow-100/90 font-outfit uppercase tracking-widest font-black">
                            {book.pageCount} {book.pageCount === 1 ? "PÁGINA" : "PÁGINAS"}
                          </div>
                          <p className="text-[7px] text-white/30 uppercase tracking-widest mt-2 font-bold font-outfit">
                            {child.name}
                          </p>
                        </div>

                        {/* Page edge simulation on the right edge */}
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/25 rounded-r" />

                        {/* Hover effect glow */}
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />
                      </motion.div>

                      {/* Switch estético y elegante de visibilidad */}
                      <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/80 shadow-sm z-20 hover:scale-105 transition-all">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Visible</span>
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleBookVisibility(book);
                          }} 
                          className="w-8 h-4.5 rounded-full p-0.5 transition-colors duration-300 focus:outline-none flex items-center" 
                          style={{ backgroundColor: book.showInBooks ? theme.hex : '#E5E7EB' }}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform duration-300 shadow-sm ${book.showInBooks ? 'translate-x-3.5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Thick Premium Wooden Shelf */}
              <div 
                className="w-full h-4 md:h-5 rounded-lg shadow-xl relative border-b border-amber-950/40"
                style={{
                  background: "linear-gradient(to right, #78350f, #92400e, #78350f)",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                }}
              >
                {/* Under shelf shadow line */}
                <div className="absolute -bottom-8 left-0 right-0 h-8 bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />
              </div>

            </div>
          ))}
        </div>

      </main>

    </div>
  );
}
