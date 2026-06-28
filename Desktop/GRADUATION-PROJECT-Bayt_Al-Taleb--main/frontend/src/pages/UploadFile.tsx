import React, { useState, useRef } from "react";
import { motion, Variants } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FiUploadCloud,
  FiFileText,
  FiX,
  FiCheckCircle,
  FiChevronDown,
  FiAlertCircle,
} from "react-icons/fi";
import { IoChevronBack } from "react-icons/io5";
import Button from "@/components/common/Button";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SelectOption {
  value: string;
  label: string;
}

type UploadState = "idle" | "uploading" | "success" | "error";

// ── Mock Data ─────────────────────────────────────────────────────────────────
// TODO: استبدل بـ API calls حقيقية لما يجهز الباك:
//   mockColleges       → GET /api/colleges
//   mockMajorsByCollege → GET /api/majors?college=:id
//   mockCoursesByMajor  → GET /api/courses?major=:id

const mockColleges: SelectOption[] = [
  { value: "medicine", label: "الطب والصحة" },
  { value: "engineering", label: "الهندسة" },
  { value: "cs", label: "علوم الحاسوب" },
  { value: "law", label: "الحقوق" },
  { value: "business", label: "اقتصاد وإدارة الأعمال" },
  { value: "science", label: "العلوم الطبيعية" },
  { value: "arts", label: "الفنون والتصميم" },
  { value: "education", label: "التربية" },
];

const mockMajorsByCollege: Record<string, SelectOption[]> = {
  medicine: [
    { value: "general-medicine", label: "الطب العام" },
    { value: "nursing", label: "التمريض" },
    { value: "pharmacy", label: "الصيدلة" },
    { value: "dentistry", label: "طب الأسنان" },
    { value: "physiotherapy", label: "العلاج الطبيعي" },
  ],
  engineering: [
    { value: "civil", label: "الهندسة المدنية" },
    { value: "electrical", label: "الهندسة الكهربائية" },
    { value: "mechanical", label: "الهندسة الميكانيكية" },
    { value: "chemical", label: "الهندسة الكيميائية" },
  ],
  cs: [
    { value: "cs-major", label: "علوم الحاسوب" },
    { value: "software", label: "هندسة البرمجيات" },
    { value: "ai", label: "الذكاء الاصطناعي" },
    { value: "networks", label: "الشبكات والأمن" },
  ],
  law: [
    { value: "private-law", label: "القانون الخاص" },
    { value: "public-law", label: "القانون العام" },
    { value: "international", label: "القانون الدولي" },
  ],
  business: [
    { value: "accounting", label: "المحاسبة" },
    { value: "finance", label: "التمويل" },
    { value: "marketing", label: "التسويق" },
    { value: "management", label: "إدارة الأعمال" },
  ],
  science: [
    { value: "biology", label: "الأحياء" },
    { value: "chemistry", label: "الكيمياء" },
    { value: "physics", label: "الفيزياء" },
    { value: "math", label: "الرياضيات" },
  ],
  arts: [
    { value: "graphic", label: "التصميم الجرافيكي" },
    { value: "architecture", label: "العمارة" },
  ],
  education: [
    { value: "primary", label: "التعليم الابتدائي" },
    { value: "secondary", label: "التعليم الثانوي" },
  ],
};

const mockCoursesByMajor: Record<string, SelectOption[]> = {
  "general-medicine": [
    { value: "anatomy", label: "علم التشريح" },
    { value: "physiology", label: "علم وظائف الأعضاء" },
    { value: "biochem", label: "الكيمياء الحيوية" },
    { value: "pathology", label: "علم الأمراض" },
    { value: "pharmacology", label: "علم الأدوية" },
  ],
  nursing: [
    { value: "nursing-basics", label: "أساسيات التمريض" },
    { value: "adult-care", label: "رعاية البالغين" },
  ],
  pharmacy: [
    { value: "organic-chem", label: "الكيمياء العضوية" },
    { value: "pharmaceutics", label: "الصيدلانيات" },
  ],
  "cs-major": [
    { value: "data-structures", label: "هياكل البيانات" },
    { value: "algorithms", label: "الخوارزميات" },
    { value: "os", label: "أنظمة التشغيل" },
    { value: "databases", label: "قواعد البيانات" },
  ],
  software: [
    { value: "software-eng", label: "هندسة البرمجيات" },
    { value: "web-dev", label: "تطوير الويب" },
  ],
  accounting: [
    { value: "financial-acc", label: "المحاسبة المالية" },
    { value: "cost-acc", label: "محاسبة التكاليف" },
  ],
};

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];
const MAX_SIZE_MB = 10;

// ── Animation Variants ────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ── uploadFile service ────────────────────────────────────────────────────────
// الفنكشن دي هي اللي هتتغير لما يجهز الباك.
// دلوقتي بتعمل simulate للـ upload بـ Promise،
// لما يجهز الـ API استبدلي الجوّه بـ fetch حقيقي.

async function uploadFileToServer(
  file: File,
  college: string,
  major: string,
  course: string,
  description: string,
  onProgress: (pct: number) => void
): Promise<void> {
  // ──────────────────────────────────────────────────────────────────
  // TODO: لما يجهز الباك، احذفي الـ simulation دي واستبدليها بالكود ده:
  //
  // const formData = new FormData();
  // formData.append("file", file);
  // formData.append("college", college);
  // formData.append("major", major);
  // formData.append("course", course);
  // formData.append("description", description);
  //
  // const res = await fetch("/api/files/upload", {
  //   method: "POST",
  //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  //   body: formData,
  // });
  //
  // if (!res.ok) throw new Error("فشل رفع الملف");
  // ──────────────────────────────────────────────────────────────────

  // Simulation مؤقتة — بتحاكي upload حقيقي بـ progress
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      onProgress(Math.min(progress, 100));
      if (progress >= 100) {
        clearInterval(interval);
        resolve();
      }
    }, 150);
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

const UploadFile: React.FC = () => {
  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState("");
  const [serverError, setServerError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableMajors = selectedCollege
    ? mockMajorsByCollege[selectedCollege] ?? []
    : [];
  const availableCourses = selectedMajor
    ? mockCoursesByMajor[selectedMajor] ?? []
    : [];

  const handleCollegeChange = (v: string) => {
    setSelectedCollege(v);
    setSelectedMajor("");
    setSelectedCourse("");
  };

  const handleMajorChange = (v: string) => {
    setSelectedMajor(v);
    setSelectedCourse("");
  };

  const validateFile = (f: File): string => {
    if (!ACCEPTED_TYPES.includes(f.type))
      return "نوع الملف غير مدعوم. يُقبل: PDF، Word، صور.";
    if (f.size > MAX_SIZE_MB * 1024 * 1024)
      return `حجم الملف يتجاوز ${MAX_SIZE_MB} ميجابايت.`;
    return "";
  };

  const handleFile = (f: File) => {
    const err = validateFile(f);
    if (err) {
      setFileError(err);
      setFile(null);
    } else {
      setFileError("");
      setFile(f);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) handleFile(picked);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024)
      return `${(bytes / 1024).toFixed(1)} كيلوبايت`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
  };

  const isFormValid =
    selectedCollege && selectedMajor && selectedCourse && file && !fileError;

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !file) return;

    setUploadState("uploading");
    setUploadProgress(0);
    setServerError("");

    try {
      await uploadFileToServer(
        file,
        selectedCollege,
        selectedMajor,
        selectedCourse,
        description,
        (pct) => setUploadProgress(pct)
      );
      setUploadState("success");
    } catch {
      setUploadState("error");
      setServerError("حدث خطأ أثناء رفع الملف. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleReset = () => {
    setSelectedCollege("");
    setSelectedMajor("");
    setSelectedCourse("");
    setDescription("");
    setFile(null);
    setFileError("");
    setServerError("");
    setUploadState("idle");
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Success Screen ────────────────────────────────────────────────────────
  if (uploadState === "success") {
    return (
      <div className="min-h-screen bg-bgSection flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center max-w-md w-full"
        >
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="font-bold text-2xl text-primary mb-3">
            تم رفع الملف بنجاح!
          </h2>
          <p className="text-gray-500 font-semibold mb-8 leading-relaxed">
            تم إرسال ملفك للمراجعة. ستصلك إشعار عند اعتماده من قبل المشرف.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={handleReset} className="w-full">
              رفع ملف آخر
            </Button>
            <Link to="/dashboard">
              <button className="w-full px-6 py-2.5 rounded-2xl border border-gray-200 text-primary font-semibold hover:border-primary transition-colors">
                العودة للوحة التحكم
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main Form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bgSection">
      <div className="container py-10">
        {/* Breadcrumb */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex items-center gap-2 text-sm font-semibold mb-8"
        >
          <Link to="/" className="text-gray-400 hover:text-primary transition-colors">
            الرئيسية
          </Link>
          <IoChevronBack className="text-gray-400" />
          <Link to="/dashboard" className="text-gray-400 hover:text-primary transition-colors">
            لوحة التحكم
          </Link>
          <IoChevronBack className="text-gray-400" />
          <span className="text-primary">رفع ملف</span>
        </motion.div>

        {/* Page title */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-10"
        >
          <h1 className="font-bold text-3xl md:text-4xl text-primary mb-2">
            رفع ملف أكاديمي
          </h1>
          <p className="text-gray-500 font-semibold">
            شارك ملخصاتك ومذكراتك لمساعدة طلاب آخرين
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Form ── */}
          <motion.form
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            onSubmit={handleSubmit}
            className="lg:col-span-2 flex flex-col gap-6"
          >
            {/* College / Major / Course */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5">
              <h2 className="font-bold text-lg text-primary">تصنيف الملف</h2>

              {/* College */}
              <div className="flex flex-col gap-2">
                <label className="font-bold text-primary text-sm">
                  الكلية <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedCollege}
                    onChange={(e) => handleCollegeChange(e.target.value)}
                    className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors bg-white text-primary font-semibold"
                  >
                    <option value="">اختر الكلية</option>
                    {mockColleges.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Major */}
              <div className="flex flex-col gap-2">
                <label className="font-bold text-primary text-sm">
                  التخصص <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedMajor}
                    onChange={(e) => handleMajorChange(e.target.value)}
                    disabled={!selectedCollege}
                    className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors bg-white text-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">اختر التخصص</option>
                    {availableMajors.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Course */}
              <div className="flex flex-col gap-2">
                <label className="font-bold text-primary text-sm">
                  المساق / المادة <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    disabled={!selectedMajor}
                    className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors bg-white text-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">اختر المادة</option>
                    {availableCourses.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                    {selectedMajor && availableCourses.length === 0 && (
                      <option value="other">أخرى</option>
                    )}
                  </select>
                  <FiChevronDown
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <label className="font-bold text-primary text-sm">
                  وصف الملف{" "}
                  <span className="text-gray-400 font-normal">(اختياري)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب وصفاً مختصراً للملف..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors resize-none text-primary font-semibold placeholder:text-gray-400 placeholder:font-normal"
                />
              </div>
            </div>

            {/* ── Drop Zone ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
              <h2 className="font-bold text-lg text-primary">الملف</h2>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-primary hover:bg-bgSection"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleInputChange}
                  className="hidden"
                />
                <FiUploadCloud
                  size={48}
                  className={`mb-4 transition-colors ${dragOver ? "text-primary" : "text-gray-400"}`}
                />
                <p className="font-bold text-primary mb-1">
                  اسحب الملف هنا أو انقر للاختيار
                </p>
                <p className="text-gray-400 text-sm">
                  PDF، Word، صور · الحد الأقصى {MAX_SIZE_MB} ميجابايت
                </p>
              </div>

              {/* File validation error */}
              {fileError && (
                <p className="text-red-500 text-sm font-semibold flex items-center gap-2">
                  <FiX size={14} />
                  {fileError}
                </p>
              )}

              {/* Server error */}
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold px-4 py-3 rounded-xl"
                >
                  <FiAlertCircle size={16} className="shrink-0" />
                  {serverError}
                </motion.div>
              )}

              {/* Selected file preview */}
              {file && !fileError && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-accent shrink-0">
                    <FiFileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-primary text-sm truncate">
                      {file.name}
                    </p>
                    <p className="text-gray-400 text-xs">{formatSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <FiX size={16} />
                  </button>
                </motion.div>
              )}

              {/* Upload progress bar */}
              {uploadState === "uploading" && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm font-semibold text-primary">
                    <span>جارٍ الرفع...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-hero h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={!isFormValid || uploadState === "uploading"}
              className="w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiUploadCloud size={20} />
              {uploadState === "uploading" ? "جارٍ الرفع..." : "رفع الملف"}
            </Button>
          </motion.form>

          {/* ── Tips Sidebar ── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-5"
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-lg text-primary mb-4">
                إرشادات الرفع
              </h3>
              <ul className="flex flex-col gap-3 text-sm font-semibold text-gray-600">
                {[
                  "تأكد من أن الملف واضح وقابل للقراءة",
                  "الحد الأقصى لحجم الملف ١٠ ميجابايت",
                  "الصيغ المقبولة: PDF، Word، صور",
                  "ستتم مراجعة الملف قبل نشره",
                  "لا ترفع محتوى منقول من مصادر أخرى",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-accent font-bold shrink-0">✓</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-lg text-primary mb-3">
                ماذا يحدث بعد الرفع؟
              </h3>
              <ol className="flex flex-col gap-3">
                {[
                  { n: "١", text: "يستلم المشرف إشعاراً بالملف" },
                  { n: "٢", text: "يراجع المشرف محتوى الملف" },
                  { n: "٣", text: "تصلك نتيجة المراجعة بالبريد" },
                  { n: "٤", text: "يُنشر الملف للطلاب بعد الاعتماد" },
                ].map((step) => (
                  <li key={step.n} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                      {step.n}
                    </span>
                    <span className="text-sm font-semibold text-gray-600 mt-0.5">
                      {step.text}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UploadFile;
