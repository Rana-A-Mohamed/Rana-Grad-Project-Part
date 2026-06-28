import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  FiUsers,
  FiFileText,
  FiBookOpen,
  FiAward,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiUserPlus,
  FiChevronDown,
  FiX,
  FiCheckCircle,
} from "react-icons/fi";
import { MdAdminPanelSettings } from "react-icons/md";

// ── Types ─────────────────────────────────────────────────────────────────────

type RoleName = "STUDENT" | "SUPERVISOR" | "ADMIN" | "SUPER_ADMIN";

interface User {
  id: number;
  name: string;
  email: string;
  role: RoleName;
  college: string;
  joinedAt: string;
  filesCount: number;
  status: "active" | "inactive";
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
// TODO: replace with → api.admin.getUsers({ page, search, role })
//                    + api.admin.updateUserRole(id, role)
//                    + api.admin.deleteUser(id)
//                    + api.admin.getStats()

const mockUsers: User[] = [
  {
    id: 1,
    name: "أحمد محمد علي",
    email: "ahmed@example.com",
    role: "STUDENT",
    college: "الطب والصحة",
    joinedAt: "يناير ٢٠٢٤",
    filesCount: 5,
    status: "active",
  },
  {
    id: 2,
    name: "سارة خالد",
    email: "sara@example.com",
    role: "STUDENT",
    college: "الطب والصحة",
    joinedAt: "فبراير ٢٠٢٤",
    filesCount: 3,
    status: "active",
  },
  {
    id: 3,
    name: "د. محمد الأمين",
    email: "dr.amin@example.com",
    role: "SUPERVISOR",
    college: "الطب والصحة",
    joinedAt: "يناير ٢٠٢٤",
    filesCount: 0,
    status: "active",
  },
  {
    id: 4,
    name: "عمر يوسف",
    email: "omar@example.com",
    role: "STUDENT",
    college: "علوم الحاسوب",
    joinedAt: "مارس ٢٠٢٤",
    filesCount: 8,
    status: "active",
  },
  {
    id: 5,
    name: "نور حسن",
    email: "nour@example.com",
    role: "STUDENT",
    college: "الطب والصحة",
    joinedAt: "مارس ٢٠٢٤",
    filesCount: 2,
    status: "inactive",
  },
  {
    id: 6,
    name: "أ. ليلى سالم",
    email: "layla@example.com",
    role: "SUPERVISOR",
    college: "الحقوق",
    joinedAt: "يناير ٢٠٢٤",
    filesCount: 0,
    status: "active",
  },
  {
    id: 7,
    name: "محمد أحمد",
    email: "m.ahmed@example.com",
    role: "STUDENT",
    college: "إدارة الأعمال",
    joinedAt: "أبريل ٢٠٢٤",
    filesCount: 1,
    status: "active",
  },
  {
    id: 8,
    name: "فاطمة العلي",
    email: "fatima@example.com",
    role: "ADMIN",
    college: "الإدارة",
    joinedAt: "يناير ٢٠٢٤",
    filesCount: 0,
    status: "active",
  },
];

const mockStats = {
  totalUsers: 1240,
  totalFiles: 3870,
  totalColleges: 9,
  totalScholarships: 48,
  approvedFiles: 3100,
  pendingFiles: 520,
  rejectedFiles: 250,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const roleConfig: Record<
  RoleName,
  { label: string; className: string }
> = {
  STUDENT: {
    label: "طالب",
    className: "bg-blue-100 text-blue-700 border border-blue-200",
  },
  SUPERVISOR: {
    label: "مشرف",
    className: "bg-purple-100 text-purple-700 border border-purple-200",
  },
  ADMIN: {
    label: "مسؤول",
    className: "bg-orange-100 text-orange-700 border border-orange-200",
  },
  SUPER_ADMIN: {
    label: "مسؤول عام",
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
  value: number | string;
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
      <p className="text-primary font-bold text-2xl">{value}</p>
    </div>
  </motion.div>
);

// ── Add / Edit User Modal ─────────────────────────────────────────────────────

interface UserModalProps {
  user?: User | null;
  onClose: () => void;
  onSave: (data: Partial<User>) => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: user?.role ?? ("STUDENT" as RoleName),
    college: user?.college ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: user ? api.admin.updateUser(user.id, form) : api.admin.createUser(form)
    onSave(form);
    onClose();
  };

  return (
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
        className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-xl text-primary">
            {user ? "تعديل مستخدم" : "إضافة مستخدم جديد"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { key: "name", label: "الاسم الكامل", type: "text", placeholder: "أدخل الاسم" },
            { key: "email", label: "البريد الإلكتروني", type: "email", placeholder: "example@email.com" },
            { key: "college", label: "الكلية", type: "text", placeholder: "اسم الكلية" },
          ].map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <label className="font-bold text-primary text-sm">
                {field.label}
              </label>
              <input
                type={field.type}
                value={(form as any)[field.key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                placeholder={field.placeholder}
                required
                className="border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-primary font-semibold placeholder:font-normal placeholder:text-gray-400"
              />
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-primary text-sm">الدور</label>
            <div className="relative">
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    role: e.target.value as RoleName,
                  }))
                }
                className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors bg-white text-primary font-semibold"
              >
                <option value="STUDENT">طالب</option>
                <option value="SUPERVISOR">مشرف</option>
                <option value="ADMIN">مسؤول</option>
                <option value="SUPER_ADMIN">مسؤول عام</option>
              </select>
              <FiChevronDown
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 bg-hero text-paragraph font-bold py-3 rounded-2xl border border-paragraph/30 transition-all hover:opacity-90"
            >
              <FiCheckCircle size={18} />
              {user ? "حفظ التعديلات" : "إضافة المستخدم"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-primary font-semibold py-3 rounded-2xl hover:border-primary transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ── Sidebar Nav ───────────────────────────────────────────────────────────────

type ActiveTab = "users" | "stats";

// ── Main Component ────────────────────────────────────────────────────────────

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [activeTab, setActiveTab] = useState<ActiveTab>("users");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleName | "all">("all");
  const [modalUser, setModalUser] = useState<User | null | undefined>(
    undefined
  ); // undefined = closed, null = new user, User = edit

  const handleSaveUser = (data: Partial<User>) => {
    if (modalUser) {
      // TODO: api.admin.updateUser
      setUsers((prev) =>
        prev.map((u) => (u.id === modalUser.id ? { ...u, ...data } : u))
      );
    } else {
      // TODO: api.admin.createUser
      setUsers((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: data.name ?? "",
          email: data.email ?? "",
          role: data.role ?? "STUDENT",
          college: data.college ?? "",
          joinedAt: "الآن",
          filesCount: 0,
          status: "active",
        },
      ]);
    }
  };

  const handleDeleteUser = (id: number) => {
    // TODO: api.admin.deleteUser(id)
    if (window.confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesSearch =
      u.name.includes(search) ||
      u.email.includes(search) ||
      u.college.includes(search);
    return matchesRole && matchesSearch;
  });

  return (
    <>
      <AnimatePresence>
        {modalUser !== undefined && (
          <UserModal
            user={modalUser}
            onClose={() => setModalUser(undefined)}
            onSave={handleSaveUser}
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
            className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-accent">
                <MdAdminPanelSettings size={28} />
              </div>
              <div>
                <h1 className="font-bold text-3xl text-primary">
                  لوحة الإدارة
                </h1>
                <p className="text-gray-500 font-semibold text-sm">
                  إدارة المستخدمين والمحتوى
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-white border border-gray-200 rounded-2xl p-1.5">
              {(
                [
                  { key: "users", label: "المستخدمون" },
                  { key: "stats", label: "الإحصائيات" },
                ] as { key: ActiveTab; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${
                    activeTab === tab.key
                      ? "bg-primary text-paragraph"
                      : "text-gray-500 hover:text-primary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── STATS TAB ── */}
          {activeTab === "stats" && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                  label="إجمالي المستخدمين"
                  value={mockStats.totalUsers.toLocaleString("ar-EG")}
                  icon={<FiUsers size={22} className="text-primary" />}
                  colorClass="bg-primary/10"
                />
                <StatCard
                  label="إجمالي الملفات"
                  value={mockStats.totalFiles.toLocaleString("ar-EG")}
                  icon={<FiFileText size={22} className="text-blue-600" />}
                  colorClass="bg-blue-100"
                />
                <StatCard
                  label="الكليات"
                  value={mockStats.totalColleges}
                  icon={<FiBookOpen size={22} className="text-purple-600" />}
                  colorClass="bg-purple-100"
                />
                <StatCard
                  label="المنح الدراسية"
                  value={mockStats.totalScholarships}
                  icon={<FiAward size={22} className="text-amber-600" />}
                  colorClass="bg-amber-100"
                />
              </div>

              {/* Files breakdown */}
              <motion.div
                variants={fadeUp}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8"
              >
                <h2 className="font-bold text-xl text-primary mb-6">
                  توزيع الملفات
                </h2>
                {[
                  {
                    label: "معتمدة",
                    value: mockStats.approvedFiles,
                    total: mockStats.totalFiles,
                    color: "bg-green-500",
                  },
                  {
                    label: "قيد المراجعة",
                    value: mockStats.pendingFiles,
                    total: mockStats.totalFiles,
                    color: "bg-yellow-400",
                  },
                  {
                    label: "مرفوضة",
                    value: mockStats.rejectedFiles,
                    total: mockStats.totalFiles,
                    color: "bg-red-400",
                  },
                ].map((item) => {
                  const pct = Math.round((item.value / item.total) * 100);
                  return (
                    <div key={item.label} className="mb-5">
                      <div className="flex justify-between text-sm font-semibold text-primary mb-2">
                        <span>{item.label}</span>
                        <span>
                          {item.value.toLocaleString("ar-EG")} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <motion.div
                          className={`${item.color} h-3 rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </motion.div>
          )}

          {/* ── USERS TAB ── */}
          {activeTab === "users" && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Controls */}
                <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex gap-3 flex-wrap items-center">
                    {/* Search */}
                    <div className="relative">
                      <FiSearch
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="بحث..."
                        className="border border-gray-300 rounded-xl pr-9 pl-4 py-2.5 outline-none focus:border-primary transition-colors text-primary font-semibold text-sm placeholder:font-normal placeholder:text-gray-400 w-48"
                      />
                    </div>
                    {/* Role filter */}
                    <div className="relative">
                      <select
                        value={roleFilter}
                        onChange={(e) =>
                          setRoleFilter(e.target.value as RoleName | "all")
                        }
                        className="appearance-none border border-gray-300 rounded-xl pr-4 pl-8 py-2.5 outline-none focus:border-primary transition-colors bg-white text-primary font-semibold text-sm"
                      >
                        <option value="all">كل الأدوار</option>
                        <option value="STUDENT">طالب</option>
                        <option value="SUPERVISOR">مشرف</option>
                        <option value="ADMIN">مسؤول</option>
                        <option value="SUPER_ADMIN">مسؤول عام</option>
                      </select>
                      <FiChevronDown
                        size={14}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                  </div>

                  {/* Add user button */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setModalUser(null)}
                    className="flex items-center gap-2 bg-hero text-paragraph font-bold px-5 py-2.5 rounded-2xl border border-paragraph/30 text-sm shrink-0"
                  >
                    <FiUserPlus size={16} />
                    إضافة مستخدم
                  </motion.button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-primary/5 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3 font-bold text-primary text-sm">
                          المستخدم
                        </th>
                        <th className="px-6 py-3 font-bold text-primary text-sm hidden md:table-cell">
                          الكلية
                        </th>
                        <th className="px-6 py-3 font-bold text-primary text-sm">
                          الدور
                        </th>
                        <th className="px-6 py-3 font-bold text-primary text-sm hidden sm:table-cell">
                          الملفات
                        </th>
                        <th className="px-6 py-3 font-bold text-primary text-sm hidden lg:table-cell">
                          تاريخ التسجيل
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
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="text-center py-16 text-gray-400"
                            >
                              <div className="text-5xl mb-3">👥</div>
                              <p className="font-semibold">
                                لا توجد نتائج
                              </p>
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user, i) => {
                            const role = roleConfig[user.role];
                            return (
                              <motion.tr
                                key={user.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{
                                  duration: 0.25,
                                  delay: i * 0.04,
                                }}
                                className="border-b border-gray-50 hover:bg-bgSection transition-colors"
                              >
                                {/* User */}
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                      {user.name.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="font-bold text-primary text-sm">
                                        {user.name}
                                      </p>
                                      <p className="text-gray-400 text-xs">
                                        {user.email}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                {/* College */}
                                <td className="px-6 py-4 text-gray-500 text-sm font-semibold hidden md:table-cell">
                                  {user.college}
                                </td>
                                {/* Role */}
                                <td className="px-6 py-4">
                                  <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${role.className}`}
                                  >
                                    {role.label}
                                  </span>
                                </td>
                                {/* Files */}
                                <td className="px-6 py-4 text-primary font-bold text-sm hidden sm:table-cell">
                                  {user.filesCount}
                                </td>
                                {/* Joined */}
                                <td className="px-6 py-4 text-gray-400 text-sm hidden lg:table-cell">
                                  {user.joinedAt}
                                </td>
                                {/* Status */}
                                <td className="px-6 py-4">
                                  <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                      user.status === "active"
                                        ? "bg-green-100 text-green-700 border border-green-200"
                                        : "bg-gray-100 text-gray-500 border border-gray-200"
                                    }`}
                                  >
                                    {user.status === "active" ? "نشط" : "غير نشط"}
                                  </span>
                                </td>
                                {/* Actions */}
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setModalUser(user)}
                                      className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-colors"
                                      title="تعديل"
                                    >
                                      <FiEdit2 size={15} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteUser(user.id)
                                      }
                                      className="p-2 rounded-xl hover:bg-red-100 text-red-500 transition-colors"
                                      title="حذف"
                                    >
                                      <FiTrash2 size={15} />
                                    </button>
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

                {/* Footer count */}
                <div className="px-6 py-4 border-t border-gray-100">
                  <p className="text-gray-400 text-sm font-semibold">
                    يُعرض {filteredUsers.length} من أصل {users.length} مستخدم
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminPanel;
