import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import { GrLinkPrevious } from "react-icons/gr";
import {
  FaSearch,
  FaFilter,
  FaDownload,
  FaGraduationCap,
  FaFileAlt,
  FaClipboardList,
  FaBookOpen,
} from "react-icons/fa";
import { MdClear, MdTune } from "react-icons/md";
import { buildSearchIndex, MOCK_COLLEGES, MOCK_MAJORS, SearchResult, SearchResultType } from "../data/mockData";

// ── Animations ────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};
const rowSlide: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

// ── Type Config ───────────────────────────────────────────────────
const TYPE_CONFIG: Record<SearchResultType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  major:   { label: "تخصص",          icon: <FaGraduationCap size={14} />, color: "text-blue-700",   bg: "bg-blue-100"   },
  course:  { label: "مساق",           icon: <FaBookOpen size={14} />,      color: "text-green-700",  bg: "bg-green-100"  },
  summary: { label: "ملخص",           icon: <FaFileAlt size={14} />,       color: "text-purple-700", bg: "bg-purple-100" },
  exam:    { label: "امتحان سابق",    icon: <FaClipboardList size={14} />, color: "text-orange-700", bg: "bg-orange-100" },
};

const ALL_TYPES: SearchResultType[] = ["major", "course", "summary", "exam"];

// ── Result Card ───────────────────────────────────────────────────
const ResultCard: React.FC<{ result: SearchResult }> = ({ result }) => {
  const cfg = TYPE_CONFIG[result.type];
  return (
    <motion.div
      variants={rowSlide}
      whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(1,5,103,0.1)" }}
      className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col sm:flex-row gap-4 transition-shadow"
    >
      {/* Icon Badge */}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
          </span>
          {result.collegeName && (
            <span className="text-xs text-gray-400 font-medium">{result.collegeName}</span>
          )}
          {result.majorName && result.type !== "major" && (
            <span className="text-xs text-gray-400">· {result.majorName}</span>
          )}
        </div>
        <h3 className="font-bold text-primary text-base leading-snug">{result.title}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{result.subtitle}</p>
        <p className="text-gray-500 text-sm mt-2 leading-relaxed">{result.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {result.tags.filter(Boolean).map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs rounded-full font-medium" style={{ background: "hsl(238 98% 20% / 0.07)", color: "hsl(238 98% 20%)" }}>
              #{tag}
            </span>
          ))}
        </div>

        {/* Downloads + Date */}
        {(result.downloads || result.date) && (
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            {result.downloads && (
              <span className="flex items-center gap-1"><FaDownload size={10} />{result.downloads.toLocaleString()} تحميل</span>
            )}
            {result.date && <span>📅 {result.date}</span>}
          </div>
        )}
      </div>

      {/* Action */}
      <div className="flex items-center sm:items-start">
        <Link
          to={result.link}
          className="flex items-center gap-1 text-primary font-bold no-underline hover:text-accent transition-colors text-sm group whitespace-nowrap"
        >
          عرض التفاصيل
          <GrLinkPrevious className="group-hover:-translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────
const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(urlQuery);
  const [inputValue, setInputValue] = useState(urlQuery);
  const [selectedTypes, setSelectedTypes] = useState<SearchResultType[]>([...ALL_TYPES]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>("الكل");
  const [selectedMajorId, setSelectedMajorId] = useState<string>("الكل");
  const [sortBy, setSortBy] = useState<"relevance" | "downloads" | "date">("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Sync URL → state whenever the route query changes
  useEffect(() => {
    const nextQuery = urlQuery.trim();
    setQuery(nextQuery);
    setInputValue(nextQuery);
    setPage(1);
  }, [urlQuery]);

  const allResults = useMemo(() => buildSearchIndex(), []);

  const majorsForCollege = useMemo(() => {
    if (selectedCollegeId === "الكل") return MOCK_MAJORS;
    return MOCK_MAJORS.filter((m) => m.collegeId === selectedCollegeId);
  }, [selectedCollegeId]);

  const filtered = useMemo(() => {
    let res = allResults.filter((r) => {
      // Type filter
      if (!selectedTypes.includes(r.type)) return false;
      // College filter
      if (selectedCollegeId !== "الكل" && r.collegeName !== MOCK_COLLEGES.find((c) => c.id === selectedCollegeId)?.name) return false;
      // Major filter
      if (selectedMajorId !== "الكل" && r.majorName !== MOCK_MAJORS.find((m) => m.id === selectedMajorId)?.name) return false;
      // Text filter
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.subtitle?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });

    // Sort
    if (sortBy === "downloads") res = [...res].sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    else if (sortBy === "date") res = [...res].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    return res;
  }, [allResults, query, selectedTypes, selectedCollegeId, selectedMajorId, sortBy]);

  const paginated = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);

  const toggleType = (t: SearchResultType) => {
    setPage(1);
    setSelectedTypes((prev) =>
      prev.includes(t) ? (prev.length > 1 ? prev.filter((x) => x !== t) : prev) : [...prev, t]
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const nextQuery = inputValue.trim();
    setQuery(nextQuery);
    setPage(1);
    setSearchParams(nextQuery ? { q: nextQuery } : {});
  };

  const clearFilters = () => {
    setSelectedTypes([...ALL_TYPES]);
    setSelectedCollegeId("الكل");
    setSelectedMajorId("الكل");
    setSortBy("relevance");
    setPage(1);
  };

  const hasFilters = selectedTypes.length < ALL_TYPES.length || selectedCollegeId !== "الكل" || selectedMajorId !== "الكل" || sortBy !== "relevance";

  // Counts per type
  const typeCounts = useMemo(() => {
    const counts: Partial<Record<SearchResultType, number>> = {};
    allResults.forEach((r) => {
      if (
        (selectedCollegeId === "الكل" || r.collegeName === MOCK_COLLEGES.find((c) => c.id === selectedCollegeId)?.name) &&
        (selectedMajorId === "الكل" || r.majorName === MOCK_MAJORS.find((m) => m.id === selectedMajorId)?.name) &&
        (!query.trim() || r.title.toLowerCase().includes(query.toLowerCase()) || r.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())))
      ) {
        counts[r.type] = (counts[r.type] || 0) + 1;
      }
    });
    return counts;
  }, [allResults, query, selectedCollegeId, selectedMajorId]);

  return (
    <div className="min-h-screen bg-bgSection">
      <div className="container py-8">

        {/* Breadcrumb */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex items-center gap-2 text-sm font-semibold mb-6 flex-wrap">
          <Link to="/" className="text-gray-400 hover:text-primary transition-colors">الرئيسية</Link>
          <IoChevronBack className="text-gray-400" />
          <span className="text-primary">نتائج البحث</span>
        </motion.div>

        {/* Search Hero */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-8">
          <h1 className="font-bold text-3xl md:text-4xl text-primary mb-3">🔍 نتائج البحث</h1>
          <p className="text-gray-500 mb-5">ابحث في التخصصات، المساقات، الملخصات، والامتحانات السابقة</p>

          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="ابحث عن تخصص، مساق، ملخص..."
                className="w-full border-2 border-gray-200 focus:border-primary rounded-2xl pr-12 pl-4 py-3.5 text-primary placeholder-gray-300 outline-none transition-colors bg-white font-medium text-base"
              />
              {inputValue && (
                <button type="button" onClick={() => { setInputValue(""); setQuery(""); setPage(1); setSearchParams({}); }} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                  <MdClear size={18} />
                </button>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="bg-primary text-white font-bold rounded-2xl px-8 py-3.5 hover:opacity-90 transition-opacity"
            >
              بحث
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-2 border-2 font-bold rounded-2xl px-5 py-3.5 transition-colors ${showFilters ? "border-primary bg-primary text-white" : "border-gray-200 text-primary bg-white hover:border-primary"}`}
            >
              <MdTune size={18} />
              <span className="hidden sm:inline">فلترة</span>
              {hasFilters && <span className="w-2 h-2 rounded-full bg-accent" />}
            </motion.button>
          </form>
        </motion.div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-primary flex items-center gap-2"><FaFilter size={14} /> فلترة متقدمة</h3>
                  {hasFilters && (
                    <button onClick={clearFilters} className="text-sm text-gray-400 hover:text-primary transition-colors font-semibold flex items-center gap-1">
                      <MdClear size={15} /> مسح الفلاتر
                    </button>
                  )}
                </div>

                {/* Type Filter */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">نوع النتيجة</p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_TYPES.map((t) => {
                      const cfg = TYPE_CONFIG[t];
                      const active = selectedTypes.includes(t);
                      return (
                        <button
                          key={t}
                          onClick={() => toggleType(t)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${active ? `${cfg.bg} ${cfg.color} border-transparent` : "border-gray-200 text-gray-400 hover:border-gray-300"}`}
                        >
                          {cfg.icon} {cfg.label}
                          <span className={`text-xs rounded-full px-1.5 ${active ? "bg-white/60" : "bg-gray-100"}`}>{typeCounts[t] || 0}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* College Filter */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">الكلية</p>
                    <select
                      value={selectedCollegeId}
                      onChange={(e) => { setSelectedCollegeId(e.target.value); setSelectedMajorId("الكل"); setPage(1); }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-primary outline-none focus:border-primary bg-white font-semibold"
                    >
                      <option value="الكل">جميع الكليات</option>
                      {MOCK_COLLEGES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* Major Filter */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">التخصص</p>
                    <select
                      value={selectedMajorId}
                      onChange={(e) => { setSelectedMajorId(e.target.value); setPage(1); }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-primary outline-none focus:border-primary bg-white font-semibold"
                    >
                      <option value="الكل">جميع التخصصات</option>
                      {majorsForCollege.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>

                  {/* Sort */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">ترتيب</p>
                    <select
                      value={sortBy}
                      onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-primary outline-none focus:border-primary bg-white font-semibold"
                    >
                      <option value="relevance">الأكثر صلة</option>
                      <option value="downloads">الأكثر تحميلاً</option>
                      <option value="date">الأحدث</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count + query */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <span className="font-bold text-primary">{filtered.length}</span>
            <span className="text-gray-400 text-sm"> نتيجة</span>
            {query && (
              <span className="text-gray-400 text-sm"> لـ <span className="font-bold text-primary">"{query}"</span></span>
            )}
          </div>
          {/* Type Quick Counts */}
          <div className="flex flex-wrap gap-2">
            {ALL_TYPES.map((t) => {
              const cfg = TYPE_CONFIG[t];
              const count = filtered.filter((r) => r.type === t).length;
              return count > 0 ? (
                <span key={t} className={`text-xs font-bold px-3 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                  {cfg.label}: {count}
                </span>
              ) : null;
            })}
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {paginated.length > 0 ? (
            <motion.div
              key={`${query}-${selectedTypes.join()}-${selectedCollegeId}-${selectedMajorId}`}
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-4"
            >
              {paginated.map((result) => (
                <ResultCard key={result.id} result={result} />
              ))}

              {/* Load More */}
              {paginated.length < filtered.length && (
                <motion.div variants={fadeUp} className="text-center pt-4">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="bg-white border-2 border-primary text-primary font-bold rounded-2xl px-10 py-3 hover:bg-primary hover:text-white transition-colors"
                  >
                    عرض المزيد ({filtered.length - paginated.length} متبقٍ)
                  </button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="no-results"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-center py-24 bg-white rounded-2xl border border-gray-200 shadow-sm"
            >
              <div className="text-7xl mb-4">🔍</div>
              <h3 className="font-bold text-2xl text-primary mb-3">
                لم نجد أي نتائج{query ? ` لـ "${query}"` : ""}
              </h3>
              <p className="text-gray-400 mb-6">جرّب كلمات بحث مختلفة أو قم بتغيير الفلاتر المختارة</p>
              {hasFilters && (
                <button onClick={clearFilters} className="bg-primary text-white font-bold rounded-xl px-8 py-3 hover:opacity-90 transition-opacity">
                  مسح جميع الفلاتر
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Browse Banner */}
        {!query && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-10 bg-hero rounded-2xl p-8 text-center"
          >
            <h2 className="font-bold text-2xl text-paragraph mb-3">تصفح حسب الكلية</h2>
            <p className="text-paragraph/70 mb-6">اختر كليتك للوصول السريع إلى ملخصاتك</p>
            <div className="flex flex-wrap justify-center gap-3">
              {MOCK_COLLEGES.map((col) => (
                <Link
                  key={col.id}
                  to={`/course-summaries?collegeId=${col.id}`}
                  className="bg-white/10 hover:bg-white/20 text-paragraph font-semibold px-5 py-2.5 rounded-xl text-sm no-underline transition-colors border border-white/20"
                >
                  {col.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;
