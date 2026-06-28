import React, { useState, useMemo, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { Link } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import { MdEmojiEvents } from "react-icons/md";
import { GrLinkPrevious } from "react-icons/gr";
import SearchBar from "../components/common/SearchBar.tsx";
import LoadingSpinner from "../components/common/LoadingSpinner";
import img from "../assets/images/unnamed.png";
import { getScholarships } from "../api/scholarships.js";

interface Scholarship {
  id: string;
  slug?: string;
  name: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

// ── Sort options ──────────────────────────────────────────────────────

type SortOption = "deadline" | "newest" | "alphabetical";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "deadline", label: "قرب الموعد النهائي" },
  { value: "newest", label: "الأحدث مضافاً" },
  { value: "alphabetical", label: "الأبجدية" },
];

// ── Animation variants ────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const rowFade: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

// ── Main Page ─────────────────────────────────────────────────────────

const ScholarshipsPage: React.FC = () => {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("deadline");

  // ── Fetch Data ────────────────────────────────────────────────
  useEffect(() => {
    getScholarships()
      .then((res) => {
        setScholarships(res.data || res);
      })
      .catch(() => {
        // Handle error silently for now
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // ── Filter & Sort Logic ───────────────────────────────────────
  const filteredAndSorted = useMemo(() => {
    let result = scholarships.filter((s) => s.name.includes(searchQuery));

    if (sortBy === "alphabetical") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, "ar"));
    } else if (sortBy === "deadline") {
      result = [...result].sort((a, b) => {
        // Safe date parsing: puts items without dates at the end
        const dateA = a.endDate
          ? new Date(a.endDate.split("/").reverse().join("-")).getTime()
          : Infinity;
        const dateB = b.endDate
          ? new Date(b.endDate.split("/").reverse().join("-")).getTime()
          : Infinity;
        return dateA - dateB;
      });
    }
    // "newest" relies on createdAt which isn't in the UI, so it keeps default array order
    return result;
  }, [scholarships, searchQuery, sortBy]);

  // ── Loading State ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-bgSection flex items-center justify-center">
        <LoadingSpinner size="lg" text="جاري تحميل المنح..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgSection">
      <div className="container py-8">
        {/* Breadcrumb */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex items-center gap-2 text-sm font-semibold mb-6"
        >
          <Link
            to="/"
            className="text-gray-400 hover:text-primary transition-colors"
          >
            الرئيسية
          </Link>
          <IoChevronBack className="text-gray-400" />
          <span className="text-primary">المنح الأكاديمية</span>
        </motion.div>

        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <h1 className="font-bold text-3xl md:text-4xl text-primary mb-2">
            منح أكاديمية
          </h1>
          <p className="text-gray-500">
            استكشف المنح المتاحة وقدّم طلبك قبل انتهاء المواعيد النهائية
          </p>
        </motion.div>

        {/* Search + Sort */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="ابحث عن منحة..."
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors bg-white text-primary font-semibold"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Table */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8"
        >
          <table className="w-full text-right">
            <thead className="bg-primary/5 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-bold text-primary">المنحة</th>
                <th className="px-6 py-4 font-bold text-primary">
                  تاريخ التسجيل
                </th>
                <th className="px-6 py-4 font-bold text-primary">الحالة</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>

            <motion.tbody
              variants={container}
              initial="hidden"
              animate="visible"
            >
              {filteredAndSorted.length > 0 ? (
                filteredAndSorted.map((scholarship, i) => (
                  <motion.tr
                    key={scholarship.id}
                    variants={rowFade}
                    className={`border-b border-gray-100 hover:bg-bgSection transition-colors ${
                      i === filteredAndSorted.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className="font-bold text-primary">
                        {scholarship.name}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-gray-500 font-medium text-sm">
                      {scholarship.startDate || "—"} —{" "}
                      {scholarship.endDate || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          scholarship.isActive
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-400"
                        }`}
                      >
                        {scholarship.isActive ? "نشطة" : "منتهية"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        to={`/scholarships/${scholarship.slug || scholarship.id}`}
                        className="flex items-center gap-1 text-primary font-semibold no-underline hover:text-accent transition-colors text-sm w-fit group"
                      >
                        التفاصيل
                        <GrLinkPrevious className="group-hover:-translate-x-1 transition-transform" />
                      </Link>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-16 text-gray-400 font-semibold"
                  >
                    🔍 لا توجد منح تطابق بحثك
                  </td>
                </tr>
              )}
            </motion.tbody>
          </table>
        </motion.div>

        {/* Active scholarships banner */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
          className="flex flex-col md:flex-row items-stretch gap-6"
        >
          <div className="relative w-full md:w-2/3 rounded-2xl overflow-hidden min-h-[150px] group">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundImage: `url(${img})` }}
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10 p-14 flex flex-col justify-center h-full">
              <h3 className="text-3xl font-bold text-white mb-3">
                مستقبلك يبدأ هنا
              </h3>
              <p className="text-white/90">
                استكشف الفرص التعليمية المتاحة واحصل على الدعم المالي الذي
                تستحقه
              </p>
            </div>
          </div>

          <div className="bg-hero rounded-2xl p-6 flex flex-col gap-4 justify-center items-center text-center min-h-[150px] md:w-1/3">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent">
              <MdEmojiEvents size={35} />
            </div>
            <div>
              {/* This now counts dynamically from the API! */}
              <h3 className="font-bold text-xl text-paragraph">
                {scholarships.filter((s) => s.isActive).length}+ منح نشطة
              </h3>
              <p className="text-paragraph/70 font-semibold text-sm">
                سجل الآن قبل انتهاء المواعيد النهائية
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ScholarshipsPage;
