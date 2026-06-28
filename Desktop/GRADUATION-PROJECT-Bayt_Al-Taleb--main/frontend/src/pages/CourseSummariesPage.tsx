import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import {
  FaDownload,
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
  FaSearch,
  FaFilter,
  FaGraduationCap,
  FaFileAlt,
  FaClipboardList,
} from "react-icons/fa";
import {
  MdOutlineSchool,
  MdMenuBook,
  MdOutlineFileDownload,
} from "react-icons/md";
import {
  MOCK_COLLEGES,
  MOCK_MAJORS,
  MOCK_COURSES,
  MockFile,
  MockCourse,
} from "../data/mockData";

// ── Animations ───────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const cardPop: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, type: "spring", bounce: 0.3 } },
};
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

// ── Star Rating ───────────────────────────────────────────────────
const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars.push(<FaStar key={i} className="text-accent text-xs" />);
    else if (rating >= i - 0.5) stars.push(<FaStarHalfAlt key={i} className="text-accent text-xs" />);
    else stars.push(<FaRegStar key={i} className="text-gray-300 text-xs" />);
  }
  return <span className="flex items-center gap-0.5">{stars}</span>;
};

// ── File Card ─────────────────────────────────────────────────────
const FileCard: React.FC<{ file: MockFile; course: MockCourse }> = ({ file, course }) => (
  <motion.div
    variants={cardPop}
    whileHover={{ y: -4, boxShadow: "0 10px 30px rgba(1,5,103,0.12)" }}
    className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3 shadow-sm transition-shadow"
  >
    {/* Header */}
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold mb-2 ${file.type === "summary" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
          {file.type === "summary" ? "ملخص" : "امتحان سابق"}
        </span>
        <h3 className="font-bold text-primary text-sm leading-snug">{file.title}</h3>
        <p className="text-gray-400 text-xs mt-1">
          {course.nameAr} – {course.code}
        </p>
      </div>
      <div className="text-2xl">{course.icon}</div>
    </div>

    {/* Tags */}
    <div className="flex flex-wrap gap-1">
      {file.tags.map((tag) => (
        <span key={tag} className="px-2 py-0.5 bg-primary/8 text-primary rounded-full text-xs font-medium" style={{ backgroundColor: "hsl(238 98% 20% / 0.08)" }}>
          #{tag}
        </span>
      ))}
    </div>

    {/* Meta */}
    <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
      <div className="flex flex-col gap-1">
        <span>📤 {file.uploadedBy}</span>
        <div className="flex items-center gap-2">
          <StarRating rating={file.rating} />
          <span>{file.rating}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="flex items-center gap-1"><FaDownload className="text-gray-300" />{file.downloads.toLocaleString()}</span>
        <span>{file.fileSize}</span>
      </div>
    </div>

    {/* Download Button */}
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold rounded-xl py-2.5 text-sm hover:opacity-90 transition-opacity"
      onClick={() => alert(`سيتم تحميل الملف: ${file.title}\n(الملف وهمي في النسخة التجريبية)`)}
    >
      <MdOutlineFileDownload size={18} />
      تحميل مجاني
    </motion.button>
  </motion.div>
);

// ── Course Section ────────────────────────────────────────────────
const CourseSection: React.FC<{ course: MockCourse; tab: "summary" | "exam" }> = ({ course, tab }) => {
  const files = tab === "summary" ? course.summaries : course.exams;
  if (files.length === 0) return null;
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{course.icon}</span>
        <div>
          <h3 className="font-bold text-primary">{course.nameAr}</h3>
          <p className="text-gray-400 text-sm">{course.code} · السنة {course.year} · {course.semester} · {course.credits} ساعة معتمدة</p>
        </div>
        <span className="mr-auto bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">{files.length} ملفات</span>
      </div>
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((f) => <FileCard key={f.id} file={f} course={course} />)}
      </motion.div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────
const CourseSummariesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initMajorId = searchParams.get("majorId") || "";
  const initCollegeId = searchParams.get("collegeId") || "";
  const initTab = searchParams.get("tab") === "exam" ? "exam" : "summary";
  const initQuery = searchParams.get("q") || "";
  const initYear = searchParams.get("year") || "الكل";

  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(() => {
    if (initMajorId) {
      const m = MOCK_MAJORS.find((m) => m.id === initMajorId);
      return m?.collegeId || initCollegeId || MOCK_COLLEGES[0]?.id || "";
    }
    return initCollegeId || MOCK_COLLEGES[0]?.id || "";
  });
  const [selectedMajorId, setSelectedMajorId] = useState<string>(initMajorId || "");
  const [activeTab, setActiveTab] = useState<"summary" | "exam">(initTab);
  const [searchQuery, setSearchQuery] = useState(initQuery);
  const [yearFilter, setYearFilter] = useState<string>(initYear);

  const updateUrl = (next: Partial<{ majorId: string; collegeId: string; tab: "summary" | "exam"; q: string; year: string }> = {}) => {
    const params = new URLSearchParams(searchParams.toString());
    const majorId = next.majorId ?? selectedMajorId;
    const collegeId = next.collegeId ?? selectedCollegeId;
    const tab = next.tab ?? activeTab;
    const q = next.q ?? searchQuery;
    const year = next.year ?? yearFilter;

    params.delete("majorId");
    params.delete("collegeId");
    params.delete("tab");
    params.delete("q");
    params.delete("year");

    if (majorId) {
      params.set("majorId", majorId);
    } else if (collegeId && collegeId !== (MOCK_COLLEGES[0]?.id || "")) {
      params.set("collegeId", collegeId);
    }

    if (tab === "exam") {
      params.set("tab", "exam");
    }

    if (q.trim()) {
      params.set("q", q.trim());
    }

    if (year !== "الكل") {
      params.set("year", year);
    }

    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    const nextMajorId = searchParams.get("majorId") || "";
    const nextCollegeId = searchParams.get("collegeId") || "";
    const nextTab = searchParams.get("tab") === "exam" ? "exam" : "summary";
    const nextQuery = searchParams.get("q") || "";
    const nextYear = searchParams.get("year") || "الكل";

    if (nextMajorId) {
      const major = MOCK_MAJORS.find((m) => m.id === nextMajorId);
      if (major) {
        setSelectedCollegeId(major.collegeId);
        setSelectedMajorId(major.id);
      }
    } else if (nextCollegeId) {
      const collegeExists = MOCK_COLLEGES.some((c) => c.id === nextCollegeId);
      if (collegeExists) {
        setSelectedCollegeId(nextCollegeId);
      }
      setSelectedMajorId("");
    } else {
      setSelectedCollegeId(MOCK_COLLEGES[0]?.id || "");
      setSelectedMajorId("");
    }

    setActiveTab(nextTab);
    setSearchQuery(nextQuery);
    setYearFilter(nextYear);
  }, [searchParams]);

  const collegesWithCourses = useMemo(() => {
    const ids = new Set(
      MOCK_COURSES.map((c) => {
        const m = MOCK_MAJORS.find((m) => m.id === c.majorId);
        return m?.collegeId;
      })
    );
    return MOCK_COLLEGES.filter((c) => ids.has(c.id));
  }, []);

  const majorsForCollege = useMemo(
    () => MOCK_MAJORS.filter((m) => m.collegeId === selectedCollegeId),
    [selectedCollegeId]
  );

  const handleCollegeChange = (id: string) => {
    setSelectedCollegeId(id);
    setSelectedMajorId("");
    setYearFilter("الكل");
    updateUrl({ collegeId: id, majorId: "", year: "الكل" });
  };

  const coursesForMajor = useMemo(() => {
    const majorId = selectedMajorId || (majorsForCollege[0]?.id ?? "");
    return MOCK_COURSES.filter((c) => c.majorId === majorId);
  }, [selectedMajorId, majorsForCollege]);

  const activeMajorId = selectedMajorId || (majorsForCollege[0]?.id ?? "");
  const activeMajor = MOCK_MAJORS.find((m) => m.id === activeMajorId);
  const activeCollege = MOCK_COLLEGES.find((c) => c.id === selectedCollegeId);

  const years = useMemo(() => {
    const ys = Array.from(new Set(coursesForMajor.map((c) => c.year))).sort();
    return ["الكل", ...ys.map(String)];
  }, [coursesForMajor]);

  const filteredCourses = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return coursesForMajor.filter((course) => {
      const matchYear = yearFilter === "الكل" || course.year === Number(yearFilter);
      const files = activeTab === "summary" ? course.summaries : course.exams;
      const matchSearch = !normalizedQuery || [
        course.nameAr,
        course.name,
        ...files.flatMap((file) => [file.title, ...file.tags]),
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
      const hasFiles = files.length > 0;
      return matchYear && matchSearch && hasFiles;
    });
  }, [coursesForMajor, yearFilter, searchQuery, activeTab]);

  const totalFiles = filteredCourses.reduce((acc, c) => {
    return acc + (activeTab === "summary" ? c.summaries.length : c.exams.length);
  }, 0);

  return (
    <div className="min-h-screen bg-bgSection">
      <div className="container py-8">

        {/* Breadcrumb */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex items-center gap-2 text-sm font-semibold mb-6 flex-wrap">
          <Link to="/" className="text-gray-400 hover:text-primary transition-colors">الرئيسية</Link>
          <IoChevronBack className="text-gray-400" />
          <Link to="/colleges" className="text-gray-400 hover:text-primary transition-colors">الكليات</Link>
          <IoChevronBack className="text-gray-400" />
          <span className="text-primary">ملخصات المساقات</span>
        </motion.div>

        {/* Header */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-8">
          <h1 className="font-bold text-3xl md:text-4xl text-primary mb-2">
            📄 ملخصات المساقات الجامعية
          </h1>
          <p className="text-gray-500">
            تصفح وحمّل أحدث الملخصات والامتحانات السابقة المعتمدة – جميع الملفات مجانية لجميع الزوار.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

          {/* ── Sidebar: College & Major ─────────────────── */}
          <motion.aside
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="lg:col-span-1 flex flex-col gap-4"
          >
            {/* College Selector */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-primary/5 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                <MdOutlineSchool className="text-primary" size={18} />
                <span className="font-bold text-primary text-sm">اختر الكلية</span>
              </div>
              <ul className="flex flex-col">
                {collegesWithCourses.map((col) => (
                  <li key={col.id}>
                    <button
                      onClick={() => handleCollegeChange(col.id)}
                      className={`w-full text-right px-4 py-3 text-sm font-semibold border-b border-gray-100 transition-colors flex items-center gap-2 ${
                        selectedCollegeId === col.id
                          ? "bg-primary text-white"
                          : "hover:bg-bgSection text-primary"
                      }`}
                    >
                      <FaGraduationCap size={14} className={selectedCollegeId === col.id ? "text-white" : "text-accent"} />
                      {col.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Major Selector */}
            {majorsForCollege.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-primary/5 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                  <MdMenuBook className="text-primary" size={18} />
                  <span className="font-bold text-primary text-sm">اختر التخصص</span>
                </div>
                <ul className="flex flex-col">
                  {majorsForCollege.map((maj) => {
                    const courseCount = MOCK_COURSES.filter((c) => c.majorId === maj.id).length;
                    return (
                      <li key={maj.id}>
                        <button
                          onClick={() => setSelectedMajorId(maj.id)}
                          className={`w-full text-right px-4 py-3 text-sm font-semibold border-b border-gray-100 transition-colors flex items-center justify-between gap-2 ${
                            activeMajorId === maj.id
                              ? "bg-accent/10 text-primary border-r-2 border-r-accent"
                              : "hover:bg-bgSection text-gray-600"
                          }`}
                        >
                          <span>{maj.name}</span>
                          <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{courseCount}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Stats Card */}
            <div className="bg-hero rounded-2xl p-5 text-center">
              <div className="text-4xl mb-2">📚</div>
              <h3 className="font-bold text-paragraph text-lg">{MOCK_COURSES.reduce((a, c) => a + c.summaries.length + c.exams.length, 0)}+</h3>
              <p className="text-paragraph/70 text-sm">ملف متاح للتحميل</p>
            </div>
          </motion.aside>

          {/* ── Main Content ──────────────────────────────── */}
          <div className="lg:col-span-3 flex flex-col gap-5">

            {/* Active Major Header */}
            {activeMajor && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 font-semibold mb-1">{activeCollege?.name}</p>
                  <h2 className="font-bold text-xl text-primary">{activeMajor.name}</h2>
                  <p className="text-gray-400 text-sm">{activeMajor.degree}</p>
                </div>
                <div className="flex gap-3 text-sm">
                  <div className="text-center bg-bgSection rounded-xl px-4 py-2">
                    <div className="font-bold text-primary text-lg">{coursesForMajor.length}</div>
                    <div className="text-gray-400 text-xs">مساق</div>
                  </div>
                  <div className="text-center bg-bgSection rounded-xl px-4 py-2">
                    <div className="font-bold text-primary text-lg">
                      {coursesForMajor.reduce((a, c) => a + c.summaries.length, 0)}
                    </div>
                    <div className="text-gray-400 text-xs">ملخص</div>
                  </div>
                  <div className="text-center bg-bgSection rounded-xl px-4 py-2">
                    <div className="font-bold text-primary text-lg">
                      {coursesForMajor.reduce((a, c) => a + c.exams.length, 0)}
                    </div>
                    <div className="text-gray-400 text-xs">امتحان</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tabs + Filters */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col sm:flex-row gap-4">
              {/* Tabs */}
              <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => {
                    setActiveTab("summary");
                    updateUrl({ tab: "summary" });
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold transition-colors ${activeTab === "summary" ? "bg-primary text-white" : "text-gray-500 hover:bg-bgSection"}`}
                >
                  <FaFileAlt size={13} /> ملخصات
                </button>
                <button
                  onClick={() => {
                    setActiveTab("exam");
                    updateUrl({ tab: "exam" });
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold transition-colors ${activeTab === "exam" ? "bg-primary text-white" : "text-gray-500 hover:bg-bgSection"}`}
                >
                  <FaClipboardList size={13} /> امتحانات سابقة
                </button>
              </div>

              {/* Search */}
              <div className="flex-1 relative">
                <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
                <input
                  type="text"
                  placeholder="ابحث عن مساق أو ملف..."
                  value={searchQuery}
                  onChange={(e) => {
                    const nextQuery = e.target.value;
                    setSearchQuery(nextQuery);
                    updateUrl({ q: nextQuery });
                  }}
                  className="w-full border border-gray-200 rounded-xl pr-10 pl-4 py-2.5 text-sm text-primary placeholder-gray-300 outline-none focus:border-primary transition-colors bg-white"
                />
              </div>

              {/* Year Filter */}
              <div className="flex items-center gap-2">
                <FaFilter className="text-gray-300" size={13} />
                <select
                  value={yearFilter}
                  onChange={(e) => {
                    const nextYear = e.target.value;
                    setYearFilter(nextYear);
                    updateUrl({ year: nextYear });
                  }}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-primary outline-none focus:border-primary bg-white font-semibold"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y === "الكل" ? "كل السنوات" : `السنة ${y}`}</option>
                  ))}
                </select>
              </div>
            </motion.div>

            {/* Results count */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                عرض <span className="font-bold text-primary">{totalFiles}</span> {activeTab === "summary" ? "ملخصاً" : "امتحاناً"} في <span className="font-bold text-primary">{filteredCourses.length}</span> مساق
              </p>
              <span className="text-xs text-gray-300">جميع الملفات مجانية ✅</span>
            </motion.div>

            {/* Course List */}
            <AnimatePresence mode="wait">
              {filteredCourses.length > 0 ? (
                <motion.div key={`${activeMajorId}-${activeTab}-${yearFilter}`} initial="hidden" animate="visible" exit="hidden" variants={stagger}>
                  {filteredCourses.map((course) => (
                    <motion.div key={course.id} variants={fadeUp}>
                      <CourseSection course={course} tab={activeTab} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm"
                >
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="font-bold text-xl text-primary mb-2">لا توجد ملفات</h3>
                  <p className="text-gray-400">
                    {searchQuery
                      ? `لم نجد نتائج لـ "${searchQuery}" – جرّب كلمة بحث أخرى`
                      : "لا توجد ملفات لهذا التخصص في هذه الفئة بعد"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseSummariesPage;
