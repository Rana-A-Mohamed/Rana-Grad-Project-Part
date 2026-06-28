import React, { useState } from "react";
import { motion, Variants } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FiUpload,
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiEye,
  FiDownload,
  FiUser,
} from "react-icons/fi";
import { MdMedicalServices } from "react-icons/md";

// ── Types ─────────────────────────────────────────────────────────────────────

type FileStatus = "pending" | "approved" | "rejected";

interface UploadedFile {
  id: number;
  name: string;
  course: string;
  college: string;
  uploadedAt: string;
  status: FileStatus;
  size: string;
}

interface StudentInfo {
  name: string;
  college: string;
  major: string;
  joinedAt: string;
  avatar: string;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
// TODO: replace with API calls → api.student.getProfile() / api.files.getMyFiles()

const mockStudent: StudentInfo = {
  name: "أحمد محمد علي",
  college: "كلية الطب والصحة",
  major: "الطب العام",
  joinedAt: "يناير 2024",
  avatar: "أ",
};

const mockFiles: UploadedFile[] = [
  {
    id: 1,
    name: "ملخص علم الأحياء - الفصل الأول",
    course: "علم الأحياء العام",
    college: "الطب والصحة",
    uploadedAt: "١٠ يونيو ٢٠٢٤",
    status: "approved",
    size: "٢.٣ ميجابايت",
  },
  {
    id: 2,
    name: "مذكرة الكيمياء العضوية",
    course: "الكيمياء العضوية",
    college: "الطب والصحة",
    uploadedAt: "٥ يونيو ٢٠٢٤",
    status: "pending",
    size: "١.٨ ميجابايت",
  },
  {
    id: 3,
    name: "أسئلة الفيزياء الطبية",
    course: "الفيزياء الطبية",
    college: "الطب والصحة",
    uploadedAt: "١ يونيو ٢٠٢٤",
    status: "rejected",
    size: "٩٨٠ كيلوبايت",
  },
  {
    id: 4,
    name: "ملخص علم التشريح - الجهاز الهضمي",
    course: "علم التشريح",
    college: "الطب والصحة",
    uploadedAt: "٢٥ مايو ٢٠٢٤",
    status: "approved",
    size: "٣.١ ميجابايت",
  },
  {
    id: 5,
    name: "بحث في علم الأدوية",
    course: "علم الصيدلة",
    college: "الطب والصحة",
    uploadedAt: "٢٠ مايو ٢٠٢٤",
    status: "pending",
    size: "٤.٥ ميجابايت",
  },
];

// ── Animation Variants ────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ── Status helpers ────────────────────────────────────────────────────────────

const statusConfig: Record<
  FileStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  approved: {
    label: "معتمد",
    icon: <FiCheckCircle size={14} />,
    className:
      "bg-green-100 text-green-700 border border-green-200",
  },
  pending: {
    label: "قيد المراجعة",
    icon: <FiClock size={14} />,
    className:
      "bg-yellow-100 text-yellow-700 border border-yellow-200",
  },
  rejected: {
    label: "مرفوض",
    icon: <FiXCircle size={14} />,
    className: "bg-red-100 text-red-700 border border-red-200",
  },
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
    className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center gap-4 shadow-sm"
  >
    <div className={`p-3 rounded-xl ${colorClass}`}>{icon}</div>
    <div>
      <p className="text-gray-500 font-semibold text-sm">{label}</p>
      <p className="text-primary font-bold text-3xl">{value}</p>
    </div>
  </motion.div>
);

// ── Main Component ────────────────────────────────────────────────────────────

const StudentDashboard: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FileStatus | "all">("all");

  const stats = {
    total: mockFiles.length,
    approved: mockFiles.filter((f) => f.status === "approved").length,
    pending: mockFiles.filter((f) => f.status === "pending").length,
    rejected: mockFiles.filter((f) => f.status === "rejected").length,
  };

  const filtered =
    activeFilter === "all"
      ? mockFiles
      : mockFiles.filter((f) => f.status === activeFilter);

  const filterTabs: { key: FileStatus | "all"; label: string }[] = [
    { key: "all", label: "الكل" },
    { key: "approved", label: "معتمد" },
    { key: "pending", label: "قيد المراجعة" },
    { key: "rejected", label: "مرفوض" },
  ];

  return (
    <div className="min-h-screen bg-bgSection">
      <div className="container py-10">
        {/* ── Header ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="font-bold text-3xl md:text-4xl text-primary mb-1">
              مرحباً، {mockStudent.name} 👋
            </h1>
            <p className="text-gray-500 font-semibold">
              {mockStudent.college} · {mockStudent.major}
            </p>
          </div>
          <Link to="/upload">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-hero text-paragraph font-bold px-6 py-3 rounded-2xl border border-paragraph/30 transition-all"
            >
              <FiUpload size={18} />
              رفع ملف جديد
            </motion.button>
          </Link>
        </motion.div>

        {/* ── Profile Card + Stats ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
          {/* Profile */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-4xl mb-4">
              {mockStudent.avatar}
            </div>
            <h2 className="font-bold text-xl text-primary mb-1">
              {mockStudent.name}
            </h2>
            <p className="text-gray-500 text-sm font-semibold mb-1">
              {mockStudent.college}
            </p>
            <p className="text-accent font-bold text-sm mb-3">
              {mockStudent.major}
            </p>
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <FiUser size={12} />
              <span>عضو منذ {mockStudent.joinedAt}</span>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            <StatCard
              label="إجمالي الملفات"
              value={stats.total}
              icon={<FiFileText size={22} className="text-primary" />}
              colorClass="bg-primary/10"
            />
            <StatCard
              label="ملفات معتمدة"
              value={stats.approved}
              icon={<FiCheckCircle size={22} className="text-green-600" />}
              colorClass="bg-green-100"
            />
            <StatCard
              label="قيد المراجعة"
              value={stats.pending}
              icon={<FiClock size={22} className="text-yellow-600" />}
              colorClass="bg-yellow-100"
            />
            <StatCard
              label="مرفوض"
              value={stats.rejected}
              icon={<FiXCircle size={22} className="text-red-500" />}
              colorClass="bg-red-100"
            />
          </motion.div>
        </div>

        {/* ── Files Table ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          {/* Table header */}
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="font-bold text-xl text-primary flex items-center gap-2">
              <FiFileText size={20} />
              ملفاتي المرفوعة
            </h2>
            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                    activeFilter === tab.key
                      ? "bg-primary text-paragraph border-primary"
                      : "bg-white text-gray-500 border-gray-200 hover:border-primary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-primary/5 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 font-bold text-primary text-sm">
                    اسم الملف
                  </th>
                  <th className="px-6 py-3 font-bold text-primary text-sm hidden md:table-cell">
                    المساق
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
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-gray-400">
                      <div className="text-5xl mb-3">📂</div>
                      <p className="font-semibold">لا توجد ملفات بهذه الحالة</p>
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
                        transition={{ duration: 0.3, delay: i * 0.05 }}
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
                        <td className="px-6 py-4 text-gray-500 text-sm font-semibold hidden md:table-cell">
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
                            <button className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-colors">
                              <FiEye size={16} />
                            </button>
                            <button className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-colors">
                              <FiDownload size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentDashboard;
