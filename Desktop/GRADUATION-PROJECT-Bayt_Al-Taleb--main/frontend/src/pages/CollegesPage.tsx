import React, { useState, useMemo, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { Link } from "react-router-dom";
import {
  MdPayments,
  MdGavel,
  MdMedicalServices,
  MdComputer,
  MdEngineering,
  MdPalette,
  MdRecordVoiceOver,
  MdTrendingUp,
} from "react-icons/md";
import { GiMicroscope } from "react-icons/gi";
import { GrLinkPrevious } from "react-icons/gr";
import SearchBar from "@/components/common/SearchBar";
import { getColleges } from "@/api/colleges";
import LoadingSpinner from "@/components/common/LoadingSpinner";
// ── Types ────────────────────────────────────────────────────────────

interface College {
  id: string;
  name: string;
  category: string;
}

// ── Icon Mapping (Maps API category string to React Icon) ────────────
const getIconByCategory = (category: string) => {
  const icons: Record<string, React.ReactNode> = {
    أعمال: <MdPayments size={32} />,
    اقتصاد: <MdTrendingUp size={32} />,
    قانون: <MdGavel size={32} />,
    تربية: <MdRecordVoiceOver size={32} />,
    طب: <MdMedicalServices size={32} />,
    تقنية: <MdComputer size={32} />,
    فنون: <MdPalette size={32} />,
    هندسة: <MdEngineering size={32} />,
    علوم: <GiMicroscope size={32} />,
  };
  return icons[category] || <MdComputer size={32} />; // Fallback icon
};

// ── Animation variants ────────────────────────────────────────────────

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } },
};

const cardPop: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      type: "spring",
      bounce: 0.4,
    },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ── College Card ──────────────────────────────────────────────────────

const CollegeCard: React.FC<{ college: College }> = ({ college }) => (
  <motion.div
    variants={cardPop}
    whileHover={{ y: -6 }}
    transition={{ duration: 0.2 }}
  >
    <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-primary shadow-sm transition-colors h-full flex flex-col gap-4">
      {/* Icon */}
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-accent">
        {getIconByCategory(college.category)}
      </div>

      {/* Text */}
      <div className="flex flex-col gap-1 flex-1">
        <h3 className="font-bold text-xl text-primary">{college.name}</h3>
        <p className="text-gray-500 font-medium">استكشف تخصصات هذاالمجال</p>
      </div>

      {/* Link */}
      <Link
        to={`/colleges/${college.id}`}
        className="flex items-center gap-2 text-primary font-bold no-underline hover:text-accent transition-colors w-fit group"
      >
        عرض التفاصيل
        <GrLinkPrevious className="group-hover:-translate-x-1 transition-transform" />
      </Link>
    </div>
  </motion.div>
);

// ── Main Page Component ──────────────────────────────────────────────

const CollegesPage: React.FC = () => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("الكل");

  // Fetch Data from API
  useEffect(() => {
    getColleges()
      .then((res) => {
        // Adjust "res.data" if your API returns the array directly (e.g., just "res")
        setColleges(res.data.items || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Dynamically generate filter tabs based on fetched categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(colleges.map((c) => c.category)),
    );
    return ["الكل", ...uniqueCategories];
  }, [colleges]);

  // Filter logic
  const filteredColleges = useMemo(() => {
    return colleges.filter((college) => {
      const matchesSearch = college.name.includes(searchQuery);
      const matchesFilter =
        activeFilter === "الكل" || college.category === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [colleges, searchQuery, activeFilter]);

  return (
    <div className="container min-h-screen bg-bgSection">
      {/* Header */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="py-12 px-6 text-center md:text-start "
      >
        <h1 className="font-bold text-4xl text-primary mb-3">
          جميع الاختصاصات الأكاديمية
        </h1>
        <p className="text-gray-500 text-lg max-w-xl ">
          اكتشف مستقبلك الدراسي من خلال استعراض الكليات المتاحة واختيار التخصص
          الذي يناسب طموحاتك
        </p>
      </motion.div>

      <div className="container py-10">
        {/* Search + Filter */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-4 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Dynamic Select Dropdown from API Data */}
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors bg-white text-primary"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "الكل" ? "جميع الكليات" : cat}
                </option>
              ))}
            </select>

            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="ابحث عن كلية..."
              />
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-center py-20"
          >
            <LoadingSpinner size="lg" text="جاري تحميل الكليات..." />
          </motion.div>
        ) : filteredColleges.length > 0 ? (
          /* Colleges Grid */
          <motion.div
            key={activeFilter}
            variants={container}
            initial="hidden"
            animate="visible"
            viewport={{ once: false, amount: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredColleges.map((college) => (
              <CollegeCard key={college.id} college={college} />
            ))}
          </motion.div>
        ) : (
          /* Empty State */
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="font-bold text-xl text-primary mb-2">
              لا توجد نتائج
            </h3>
            <p className="text-gray-500">
              حاول البحث بكلمة مختلفة أو اختر فلتر آخر
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CollegesPage;
