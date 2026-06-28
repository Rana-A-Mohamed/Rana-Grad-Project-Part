import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiEye,
  FiSearch,
  FiFilter,
} from "react-icons/fi";
import Button from "@/components/common/Button";

// ── Types ─────────────────────────────────────────────────────────────────────

type FileStatus = "pending" | "approved" | "rejected";

interface PendingFile {
  id: number;
  name: string;
  studentName: string;
  college: string;
  major: string;
  course: string;
  uploadedAt: string;
  size: string;
  status: FileStatus;
  description?: string;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
// TODO: replace with → api.supervisor.getPendingFiles({ page, filter, search })
//                    + api.supervisor.approveFile(id)
//                    + api.supervisor.rejectFile(id, reason)

const mockFiles: PendingFile[] = [
  {
    id: 1,
    name: "ملخص علم التشريح - الجهاز الهضمي",
    studentName: "أحمد محمد علي",
    college: "الطب والصحة",
    major: "الطب العام",
    course: "علم التشريح",
    uploadedAt: "١٠ يونيو ٢٠٢٤",
    size: "٣.١ ميجابايت",
    status: "pending",
    description: "ملخص شامل للجهاز الهضمي من محاضرات الفصل الثاني",
  },
  {
    id: 2,
    name: "أسئلة الفيزياء الطبية - نماذج امتحانات",
    studentName: "سارة خالد",
    college: "الطب والصحة",
    major: "الطب العام",
    course: "الفيزياء الطبية",
    uploadedAt: "٩ يونيو ٢٠٢٤",
    size: "١.٨ ميجابايت",
    status: "pending",
    description: "مجموعة نماذج امتحانات سابقة مع الإجابات",
  },
  {
    id: 3,
    name: "مذكرة هياكل البيانات",
    studentName: "عمر يوسف",
    college: "علوم الحاسوب",
    major: "هندسة البرمجيات",
    course: "هياكل البيانات",
    uploadedAt: "٨ يونيو ٢٠٢٤",
    size: "٢.٤ ميجابايت",
    status: "pending",
  },
  {
    id: 4,
    name: "ملخص الكيمياء العضوية",
    studentName: "نور حسن",
    college: "الطب والصحة",
    major: "الصيدلة",
    course: "الكيمياء العضوية",
    uploadedAt: "٧ يونيو ٢٠٢٤",
    size: "٤.٢ ميجابايت",
    status: "approved",
  },
  {
    id: 5,
    name: "بحث في المحاسبة المالية",
    studentName: "محمد أحمد",
    college: "إدارة الأعمال",
    major: "المحاسبة",
    course: "المحاسبة المالية",
    uploadedAt: "٦ يونيو ٢٠٢٤",
    size: "١.١ ميجابايت",
    status: "rejected",
    description: "محتوى منسوخ من مصدر خارجي",
  },
  {
    id: 6,
    name: "ملخص قانون العقوبات",
    studentName: "ليلى سالم",
    college: "الحقوق",
    major: "القانون الخاص",
    course: "قانون العقوبات",
    uploadedAt: "٥ يونيو ٢٠٢٤",
    size: "٢.٨ ميجابايت",
    status: "pending",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const statusConfig: Record<
  FileStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  pending: {
    label: "قيد المراجعة",
    icon: <FiClock size={13} />,
    className: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  },
  approved: {
    label: "معتمد",
    icon: <FiCheckCircle size={13} />,
    className: "bg-green-100 text-green-700 border border-green-200",
  },
  rejected: {
    label: "مرفوض",
    icon: <FiXCircle size={13} />,
    className: "bg-red-100 text-red-700 border border-red-200",
  },
};

// ── Animation Variants ────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, colorClass }) => (
  <motion.div
    variants={fadeUp}
    className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm"
  >
    <div className={`p-3 rounded-xl ${colorClass}`}>{icon}</div>
    <div>
      <p className="text-gray-500 font-semibold text-sm">{label}</p>
      <p className="text-primary font-bold text-3xl">{value}</p>
    </div>
  </motion.div>
);

// ── Preview Modal ─────────────────────────────────────────────────────────────

interface PreviewModalProps {
  file: PendingFile;
  onClose: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  file,
  onClose,
  onApprove,
  onReject,
}) => (
  <div
    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8 w-full max-w-lg"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-accent">
            <FiFileText size={22} />
          </div>
          <div>
            <h2 className="font-bold text-lg text-primary">{file.name}</h2>
            <p className="text-gray-400 text-sm">{file.size}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: "الطالب", value: file.studentName },
          { label: "الكلية", value: file.college },
          { label: "التخصص", value: file.major },
          { label: "المادة", value: file.course },
          { label: "تاريخ الرفع", value: file.uploadedAt },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-gray-400 text-xs font-semibold mb-0.5">
              {item.label}
            </p>
            <p className="text-primary font-bold text-sm">{item.value}</p>
          </div>
        ))}
      </div>

      {file.description && (
        <div className="bg-bgSection rounded-xl p-4 mb-6">
          <p className="text-gray-500 text-xs font-semibold mb-1">
            وصف الملف
          </p>
          <p className="text-primary font-semibold text-sm">
            {file.description}
          </p>
        </div>
      )}

      {/* PDF preview placeholder */}
      <div className="bg-gray-100 rounded-xl h-48 flex flex-col items-center justify-center mb-6 text-gray-400">
        <FiFileText size={36} className="mb-2" />
        <p className="text-sm font-semibold">
          {/* TODO: embed PDF viewer → <iframe src={file.url} /> */}
          معاينة الملف ستظهر هنا
        </p>
      </div>

      {/* Actions */}
      {file.status === "pending" && (
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onApprove(file.id);
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-2xl transition-colors"
          >
            <FiCheckCircle size={18} />
            اعتماد
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onReject(file.id);
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-2xl transition-colors"
          >
            <FiXCircle size={18} />
            رفض
          </motion.button>
        </div>
      )}
    </motion.div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

const SupervisorReview: React.FC = () => {
  const [files, setFiles] = useState<PendingFile[]>(mockFiles);
  const [filter, setFilter] = useState<FileStatus | "all">("pending");
  const [search, setSearch] = useState("");
  const [previewFile, setPreviewFile] = useState<PendingFile | null>(null);

  const handleApprove = (id: number) => {
    // TODO: await api.supervisor.approveFile(id)
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: "approved" } : f))
    );
  };

  const handleReject = (id: number) => {
    // TODO: await api.supervisor.rejectFile(id, reason)
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: "rejected" } : f))
    );
  };

  const stats = {
    pending: files.filter((f) => f.status === "pending").length,
    approved: files.filter((f) => f.status === "approved").length,
    rejected: files.filter((f) => f.status === "rejected").length,
    total: files.length,
  };

  const filtered = files.filter((f) => {
    const matchesFilter = filter === "all" || f.status === filter;
    const matchesSearch =
      f.name.includes(search) ||
      f.studentName.includes(search) ||
      f.course.includes(search);
    return matchesFilter && matchesSearch;
  });

  const filterTabs: { key: FileStatus | "all"; label: string }[] = [
    { key: "all", label: "الكل" },
    { key: "pending", label: "قيد المراجعة" },
    { key: "approved", label: "معتمد" },
    { key: "rejected", label: "مرفوض" },
  ];

  return (
    <>
      {/* Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <PreviewModal
            file={previewFile}
            onClose={() => setPreviewFile(null)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-bgSection">
        <div className="container py-10">
          {/* Header */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mb-8"
          >
            <h1 className="font-bold text-3xl md:text-4xl text-primary mb-1">
              لوحة المشرف
            </h1>
            <p className="text-gray-500 font-semibold">
              مراجعة الملفات المرفوعة من الطلاب
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10"
          >
            <StatCard
              label="إجمالي الملفات"
              value={stats.total}
              icon={<FiFileText size={22} className="text-primary" />}
              colorClass="bg-primary/10"
            />
            <StatCard
              label="قيد المراجعة"
              value={stats.pending}
              icon={<FiClock size={22} className="text-yellow-600" />}
              colorClass="bg-yellow-100"
            />
            <StatCard
              label="معتمد"
              value={stats.approved}
              icon={<FiCheckCircle size={22} className="text-green-600" />}
              colorClass="bg-green-100"
            />
            <StatCard
              label="مرفوض"
              value={stats.rejected}
              icon={<FiXCircle size={22} className="text-red-500" />}
              colorClass="bg-red-100"
            />
          </motion.div>

          {/* Table */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          >
            {/* Controls */}
            <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <FiSearch
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث عن ملف أو طالب..."
                  className="w-full border border-gray-300 rounded-xl pr-9 pl-4 py-2.5 outline-none focus:border-primary transition-colors text-primary font-semibold text-sm placeholder:font-normal placeholder:text-gray-400"
                />
              </div>

              {/* Filter tabs */}
              <div className="flex gap-2 flex-wrap">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                      filter === tab.key
                        ? "bg-primary text-paragraph border-primary"
                        : "bg-white text-gray-500 border-gray-200 hover:border-primary"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table body */}
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-primary/5 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-bold text-primary text-sm">
                      اسم الملف
                    </th>
                    <th className="px-6 py-3 font-bold text-primary text-sm hidden md:table-cell">
                      الطالب
                    </th>
                    <th className="px-6 py-3 font-bold text-primary text-sm hidden lg:table-cell">
                      المادة
                    </th>
                    <th className="px-6 py-3 font-bold text-primary text-sm hidden sm:table-cell">
                      تاريخ الرفع
                    </th>
                    <th className="px-6 py-3 font-bold text-primary text-sm">
                      الحالة
                    </th>
                    <th className="px-6 py-3 font-bold text-primary text-sm">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-16 text-gray-400"
                        >
                          <div className="text-5xl mb-3">📂</div>
                          <p className="font-semibold">
                            لا توجد ملفات بهذا الفلتر
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((file, i) => {
                        const s = statusConfig[file.status];
                        return (
                          <motion.tr
                            key={file.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.25, delay: i * 0.04 }}
                            className="border-b border-gray-50 hover:bg-bgSection transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-accent shrink-0">
                                  <FiFileText size={16} />
                                </div>
                                <div>
                                  <p className="font-bold text-primary text-sm">
                                    {file.name}
                                  </p>
                                  <p className="text-gray-400 text-xs">
                                    {file.size}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600 text-sm font-semibold hidden md:table-cell">
                              {file.studentName}
                            </td>
                            <td className="px-6 py-4 text-gray-500 text-sm hidden lg:table-cell">
                              {file.course}
                            </td>
                            <td className="px-6 py-4 text-gray-400 text-sm hidden sm:table-cell">
                              {file.uploadedAt}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${s.className}`}
                              >
                                {s.icon}
                                {s.label}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setPreviewFile(file)}
                                  className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-colors"
                                  title="معاينة"
                                >
                                  <FiEye size={16} />
                                </button>
                                {file.status === "pending" && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(file.id)}
                                      className="p-2 rounded-xl hover:bg-green-100 text-green-600 transition-colors"
                                      title="اعتماد"
                                    >
                                      <FiCheckCircle size={16} />
                                    </button>
                                    <button
                                      onClick={() => handleReject(file.id)}
                                      className="p-2 rounded-xl hover:bg-red-100 text-red-500 transition-colors"
                                      title="رفض"
                                    >
                                      <FiXCircle size={16} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default SupervisorReview;
