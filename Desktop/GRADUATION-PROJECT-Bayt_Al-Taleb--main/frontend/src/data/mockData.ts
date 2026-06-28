// ─────────────────────────────────────────────────
//  MOCK DATA  –  Bayt Al-Taleb Frontend
// ─────────────────────────────────────────────────

export interface MockCollege {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
}

export interface MockMajor {
  id: string;
  slug: string;
  name: string;
  collegeId: string;
  degree: string;
}

export interface MockCourse {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  majorId: string;
  year: number;
  semester: string;
  credits: number;
  icon: string;
  summaries: MockFile[];
  exams: MockFile[];
}

export interface MockFile {
  id: string;
  title: string;
  type: "summary" | "exam";
  uploadedBy: string;
  uploadDate: string;
  downloads: number;
  rating: number;
  fileSize: string;
  tags: string[];
}

// ── Colleges ──────────────────────────────────────
export const MOCK_COLLEGES: MockCollege[] = [
  { id: "med", slug: "medicine", name: "كلية الطب", category: "طب", description: "أعرق الكليات الطبية في العالم العربي" },
  { id: "eng", slug: "engineering", name: "كلية الهندسة", category: "هندسة", description: "كلية الهندسة بتخصصاتها المتنوعة" },
  { id: "cs", slug: "computer-science", name: "كلية علوم الحاسوب", category: "تقنية", description: "مجال علوم الحاسوب والذكاء الاصطناعي" },
  { id: "bus", slug: "business", name: "كلية إدارة الأعمال", category: "أعمال", description: "كلية إدارة الأعمال والاقتصاد" },
  { id: "law", slug: "law", name: "كلية الحقوق", category: "قانون", description: "كلية الحقوق والدراسات القانونية" },
  { id: "sci", slug: "science", name: "كلية العلوم", category: "علوم", description: "كلية العلوم الطبيعية والتطبيقية" },
  { id: "edu", slug: "education", name: "كلية التربية", category: "تربية", description: "إعداد المعلمين والكوادر التربوية" },
  { id: "pharma", slug: "pharmacy", name: "كلية الصيدلة", category: "طب", description: "دراسة الأدوية والعلوم الصيدلانية" },
];

// ── Majors ────────────────────────────────────────
export const MOCK_MAJORS: MockMajor[] = [
  // Medicine
  { id: "nursing", slug: "nursing", name: "التمريض", collegeId: "med", degree: "بكالوريوس تمريض" },
  { id: "phys", slug: "physiology", name: "علم وظائف الأعضاء", collegeId: "med", degree: "بكالوريوس طب وجراحة" },
  { id: "dent", slug: "dentistry", name: "طب الأسنان", collegeId: "med", degree: "بكالوريوس طب أسنان" },
  { id: "biomed", slug: "biomedical-eng", name: "الهندسة الطبية الحيوية", collegeId: "eng", degree: "بكالوريوس هندسة" },
  // Engineering
  { id: "civil", slug: "civil-eng", name: "الهندسة المدنية", collegeId: "eng", degree: "بكالوريوس هندسة مدنية" },
  { id: "mech", slug: "mechanical-eng", name: "الهندسة الميكانيكية", collegeId: "eng", degree: "بكالوريوس هندسة ميكانيكية" },
  { id: "elec", slug: "electrical-eng", name: "الهندسة الكهربائية", collegeId: "eng", degree: "بكالوريوس هندسة كهربائية" },
  // CS
  { id: "cs-ai", slug: "ai", name: "الذكاء الاصطناعي", collegeId: "cs", degree: "بكالوريوس علوم حاسوب" },
  { id: "cs-se", slug: "software-eng", name: "هندسة البرمجيات", collegeId: "cs", degree: "بكالوريوس هندسة برمجيات" },
  { id: "cs-net", slug: "networks", name: "شبكات الحاسوب", collegeId: "cs", degree: "بكالوريوس شبكات" },
  { id: "cs-cy", slug: "cybersecurity", name: "أمن المعلومات", collegeId: "cs", degree: "بكالوريوس أمن معلومات" },
  // Business
  { id: "biz-acc", slug: "accounting", name: "المحاسبة", collegeId: "bus", degree: "بكالوريوس محاسبة" },
  { id: "biz-fin", slug: "finance", name: "التمويل والمصارف", collegeId: "bus", degree: "بكالوريوس تمويل" },
  { id: "biz-mkt", slug: "marketing", name: "التسويق", collegeId: "bus", degree: "بكالوريوس تسويق" },
  // Law
  { id: "law-pub", slug: "public-law", name: "القانون العام", collegeId: "law", degree: "بكالوريوس حقوق" },
  { id: "law-priv", slug: "private-law", name: "القانون الخاص", collegeId: "law", degree: "بكالوريوس حقوق" },
  // Science
  { id: "chem", slug: "chemistry", name: "الكيمياء", collegeId: "sci", degree: "بكالوريوس علوم كيمياء" },
  { id: "phys-sci", slug: "physics", name: "الفيزياء", collegeId: "sci", degree: "بكالوريوس علوم فيزياء" },
  // Education
  { id: "edu-math", slug: "math-edu", name: "تعليم الرياضيات", collegeId: "edu", degree: "بكالوريوس تربية" },
  // Pharmacy
  { id: "pharma-gen", slug: "pharmacy-general", name: "الصيدلة العامة", collegeId: "pharma", degree: "بكالوريوس صيدلة" },
];

// ── Helper to build mock files ──────────────────
const mkSummary = (id: string, title: string, by: string, date: string, dl: number, rating: number, size: string, tags: string[]): MockFile => ({ id, title, type: "summary", uploadedBy: by, uploadDate: date, downloads: dl, rating, fileSize: size, tags });
const mkExam   = (id: string, title: string, by: string, date: string, dl: number, rating: number, size: string, tags: string[]): MockFile => ({ id, title, type: "exam",    uploadedBy: by, uploadDate: date, downloads: dl, rating, fileSize: size, tags });

// ── Courses ───────────────────────────────────────
export const MOCK_COURSES: MockCourse[] = [
  // ── Nursing
  {
    id: "nur-ana", code: "NUR201", name: "Anatomy", nameAr: "علم التشريح", majorId: "nursing", year: 1, semester: "الفصل الأول", credits: 4, icon: "🦴",
    summaries: [
      mkSummary("s1","ملخص التشريح الكامل – السنة الأولى","أحمد محمد","2024-10-01",342,4.8,"2.4 MB",["تشريح","عظام","عضلات"]),
      mkSummary("s2","ملخص الجهاز العصبي المركزي","سارة علي","2024-09-20",210,4.5,"1.8 MB",["جهاز عصبي","دماغ"]),
    ],
    exams: [
      mkExam("e1","امتحان التشريح 2023 – نهاية الفصل","إدارة الكلية","2024-01-10",198,4.7,"1.1 MB",["امتحان","2023"]),
      mkExam("e2","اختبار منتصف الفصل 2024","إدارة الكلية","2024-04-15",145,4.3,"0.9 MB",["كويز","2024"]),
    ],
  },
  {
    id: "nur-phys", code: "NUR202", name: "Physiology", nameAr: "علم وظائف الأعضاء", majorId: "nursing", year: 1, semester: "الفصل الثاني", credits: 4, icon: "❤️",
    summaries: [
      mkSummary("s3","ملخص فسيولوجيا القلب والأوعية","محمود حسن","2024-11-05",289,4.9,"3.1 MB",["قلب","دورة دموية"]),
    ],
    exams: [
      mkExam("e3","امتحان الفسيولوجيا 2023","إدارة الكلية","2023-12-20",176,4.6,"1.2 MB",["امتحان","2023"]),
    ],
  },
  {
    id: "nur-pharm", code: "NUR301", name: "Pharmacology", nameAr: "علم الأدوية", majorId: "nursing", year: 2, semester: "الفصل الأول", credits: 3, icon: "💊",
    summaries: [
      mkSummary("s4","ملخص الأدوية الأساسية","رنا محمد","2024-09-10",412,4.7,"2.8 MB",["أدوية","علاج"]),
    ],
    exams: [
      mkExam("e4","امتحان علم الأدوية 2024","إدارة الكلية","2024-01-18",234,4.8,"1.5 MB",["امتحان","2024"]),
    ],
  },
  {
    id: "nur-micro", code: "NUR302", name: "Microbiology", nameAr: "الأحياء الدقيقة", majorId: "nursing", year: 2, semester: "الفصل الثاني", credits: 3, icon: "🦠",
    summaries: [
      mkSummary("s5","ملخص البكتيريا والفيروسات","يوسف أحمد","2024-10-20",198,4.4,"2.0 MB",["بكتيريا","فيروسات"]),
    ],
    exams: [
      mkExam("e5","امتحان الأحياء الدقيقة 2023","إدارة الكلية","2023-11-30",142,4.2,"1.0 MB",["امتحان","2023"]),
    ],
  },
  // ── CS – Software Engineering
  {
    id: "se-oop", code: "CS201", name: "OOP", nameAr: "البرمجة الكائنية", majorId: "cs-se", year: 1, semester: "الفصل الأول", credits: 3, icon: "💻",
    summaries: [
      mkSummary("s6","ملخص مبادئ OOP","خالد ناصر","2024-09-15",560,4.9,"1.5 MB",["برمجة","OOP","جافا"]),
      mkSummary("s7","أمثلة عملية على التغليف والوراثة","منى سالم","2024-10-02",310,4.6,"1.2 MB",["وراثة","تغليف"]),
    ],
    exams: [
      mkExam("e6","امتحان OOP 2023 مع الإجابات","إدارة الكلية","2023-12-15",420,4.8,"1.4 MB",["امتحان","2023","OOP"]),
    ],
  },
  {
    id: "se-db", code: "CS301", name: "Databases", nameAr: "قواعد البيانات", majorId: "cs-se", year: 2, semester: "الفصل الأول", credits: 3, icon: "🗄️",
    summaries: [
      mkSummary("s8","ملخص SQL و NoSQL","عمر فاروق","2024-09-25",488,4.8,"2.2 MB",["SQL","قواعد بيانات"]),
    ],
    exams: [
      mkExam("e7","امتحان قواعد البيانات 2024","إدارة الكلية","2024-01-22",330,4.7,"1.6 MB",["امتحان","2024","SQL"]),
    ],
  },
  {
    id: "se-algo", code: "CS302", name: "Algorithms", nameAr: "الخوارزميات وهياكل البيانات", majorId: "cs-se", year: 2, semester: "الفصل الثاني", credits: 4, icon: "📊",
    summaries: [
      mkSummary("s9","ملخص الخوارزميات الأساسية","ليلى حمدي","2024-11-01",376,4.7,"3.0 MB",["خوارزميات","ترتيب","بحث"]),
    ],
    exams: [
      mkExam("e8","امتحان الخوارزميات 2023","إدارة الكلية","2023-12-28",290,4.9,"1.8 MB",["امتحان","2023"]),
    ],
  },
  // ── AI
  {
    id: "ai-ml", code: "AI301", name: "Machine Learning", nameAr: "التعلم الآلي", majorId: "cs-ai", year: 2, semester: "الفصل الأول", credits: 4, icon: "🤖",
    summaries: [
      mkSummary("s10","ملخص شامل للتعلم الآلي","دانا يوسف","2024-10-10",620,4.9,"4.2 MB",["AI","تعلم آلي","Python"]),
    ],
    exams: [
      mkExam("e9","امتحان التعلم الآلي 2024","إدارة الكلية","2024-02-01",480,4.8,"2.1 MB",["امتحان","2024","AI"]),
    ],
  },
  {
    id: "ai-dl", code: "AI401", name: "Deep Learning", nameAr: "التعلم العميق", majorId: "cs-ai", year: 3, semester: "الفصل الأول", credits: 4, icon: "🧠",
    summaries: [
      mkSummary("s11","ملخص الشبكات العصبية","فراس كمال","2024-11-15",410,4.8,"3.8 MB",["شبكات عصبية","TensorFlow"]),
    ],
    exams: [
      mkExam("e10","امتحان التعلم العميق 2023","إدارة الكلية","2023-12-10",320,4.7,"1.9 MB",["امتحان","2023","DL"]),
    ],
  },
  // ── Civil Engineering
  {
    id: "civ-stru", code: "CE301", name: "Structural Analysis", nameAr: "تحليل الإنشاءات", majorId: "civil", year: 2, semester: "الفصل الأول", credits: 4, icon: "🏗️",
    summaries: [
      mkSummary("s12","ملخص تحليل الهياكل الإنشائية","باسم ناجي","2024-10-05",278,4.6,"2.6 MB",["إنشاءات","هياكل"]),
    ],
    exams: [
      mkExam("e11","امتحان الإنشاءات 2024","إدارة الكلية","2024-01-05",205,4.5,"1.3 MB",["امتحان","2024"]),
    ],
  },
  {
    id: "civ-geo", code: "CE201", name: "Engineering Geology", nameAr: "الجيولوجيا الهندسية", majorId: "civil", year: 1, semester: "الفصل الثاني", credits: 3, icon: "🪨",
    summaries: [
      mkSummary("s13","ملخص الجيولوجيا الهندسية","نور عزيز","2024-09-28",190,4.3,"1.9 MB",["جيولوجيا","تربة"]),
    ],
    exams: [
      mkExam("e12","امتحان الجيولوجيا 2023","إدارة الكلية","2023-12-05",155,4.2,"0.8 MB",["امتحان","2023"]),
    ],
  },
  // ── Accounting
  {
    id: "acc-fin", code: "ACC201", name: "Financial Accounting", nameAr: "المحاسبة المالية", majorId: "biz-acc", year: 1, semester: "الفصل الأول", credits: 3, icon: "📒",
    summaries: [
      mkSummary("s14","ملخص المحاسبة المالية المستوى الأول","رامي صالح","2024-09-12",390,4.7,"2.0 MB",["محاسبة","قوائم مالية"]),
    ],
    exams: [
      mkExam("e13","امتحان المحاسبة المالية 2024","إدارة الكلية","2024-01-30",275,4.6,"1.4 MB",["امتحان","2024"]),
    ],
  },
  {
    id: "acc-cost", code: "ACC301", name: "Cost Accounting", nameAr: "محاسبة التكاليف", majorId: "biz-acc", year: 2, semester: "الفصل الأول", credits: 3, icon: "💰",
    summaries: [
      mkSummary("s15","ملخص محاسبة التكاليف","هند عوض","2024-10-18",280,4.5,"1.7 MB",["تكاليف","محاسبة"]),
    ],
    exams: [
      mkExam("e14","امتحان محاسبة التكاليف 2023","إدارة الكلية","2023-11-25",198,4.4,"1.1 MB",["امتحان","2023"]),
    ],
  },
  // ── Pharmacy
  {
    id: "ph-org", code: "PH201", name: "Organic Chemistry", nameAr: "الكيمياء العضوية", majorId: "pharma-gen", year: 1, semester: "الفصل الأول", credits: 4, icon: "⚗️",
    summaries: [
      mkSummary("s16","ملخص الكيمياء العضوية للصيدلة","آية كريم","2024-10-07",352,4.8,"2.9 MB",["كيمياء","عضوية"]),
    ],
    exams: [
      mkExam("e15","امتحان الكيمياء العضوية 2024","إدارة الكلية","2024-02-10",260,4.7,"1.5 MB",["امتحان","2024"]),
    ],
  },
];

// ─── Search index helper (used in SearchResultsPage) ──────────────
export type SearchResultType = "major" | "course" | "summary" | "exam";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  description: string;
  collegeName?: string;
  majorName?: string;
  link: string;
  tags: string[];
  date?: string;
  downloads?: number;
}

export function buildSearchIndex(): SearchResult[] {
  const results: SearchResult[] = [];

  // Majors
  MOCK_MAJORS.forEach((m) => {
    const college = MOCK_COLLEGES.find((c) => c.id === m.collegeId);
    results.push({
      id: `major-${m.id}`,
      type: "major",
      title: m.name,
      subtitle: m.degree,
      description: `تخصص ${m.name} ضمن ${college?.name || ""} – يمنح درجة ${m.degree}`,
      collegeName: college?.name,
      link: `/majors/${m.slug}`,
      tags: [college?.category || "", "تخصص"],
    });
  });

  // Courses & Files
  MOCK_COURSES.forEach((c) => {
    const major = MOCK_MAJORS.find((m) => m.id === c.majorId);
    const college = major ? MOCK_COLLEGES.find((col) => col.id === major.collegeId) : undefined;

    // Course itself
    results.push({
      id: `course-${c.id}`,
      type: "course",
      title: c.nameAr,
      subtitle: `${c.code} – ${major?.name || ""}`,
      description: `مساق ${c.nameAr} للسنة ${c.year} – ${c.semester}`,
      collegeName: college?.name,
      majorName: major?.name,
      link: `/course-summaries?majorId=${c.majorId}`,
      tags: [college?.category || "", major?.name || "", "مساق"],
    });

    // Summaries
    c.summaries.forEach((f) => {
      results.push({
        id: `summary-${f.id}`,
        type: "summary",
        title: f.title,
        subtitle: `ملخص – ${c.nameAr}`,
        description: `ملخص دراسي للمساق ${c.nameAr} – ${major?.name || ""}`,
        collegeName: college?.name,
        majorName: major?.name,
        link: `/course-summaries?majorId=${c.majorId}&tab=summary`,
        tags: [...f.tags, "ملخص"],
        date: f.uploadDate,
        downloads: f.downloads,
      });
    });

    // Exams
    c.exams.forEach((f) => {
      results.push({
        id: `exam-${f.id}`,
        type: "exam",
        title: f.title,
        subtitle: `امتحان سابق – ${c.nameAr}`,
        description: `امتحان سابق للمساق ${c.nameAr} – ${major?.name || ""}`,
        collegeName: college?.name,
        majorName: major?.name,
        link: `/course-summaries?majorId=${c.majorId}&tab=exam`,
        tags: [...f.tags, "امتحان"],
        date: f.uploadDate,
        downloads: f.downloads,
      });
    });
  });

  return results;
}
