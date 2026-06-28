import React from "react";
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
} from "react-icons/md";
import { GrLinkPrevious } from "react-icons/gr";
import { GiMicroscope } from "react-icons/gi";

interface Category {
  icon: React.ReactNode;
  label: string;
}

const categories: Category[] = [
  { icon: <MdPayments size={32} />, label: "اقتصاد وإدارة الأعمال" },
  { icon: <MdGavel size={32} />, label: "الحقوق" },
  { icon: <MdMedicalServices size={32} />, label: "الطب والصحة" },
  { icon: <MdComputer size={32} />, label: "علوم الحاسوب" },
  { icon: <MdEngineering size={32} />, label: "الهندسة" },
  { icon: <MdPalette size={32} />, label: "الفنون والتصميم" },
  { icon: <MdRecordVoiceOver size={32} />, label: "التربية" },
  { icon: <GiMicroscope size={32} />, label: "العلوم الطبيعية" },
];

const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

const headerPop = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      scale: { type: "spring", visualDuration: 0.4, bounce: 0.2 },
    },
  },
};

const cardPop: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      type: "spring",
      bounce: 0.4,
    },
  },
};

const Categories: React.FC = () => {
  return (
    <section className="py-20 bg-bgSection">
      <div className="container  py-8">
        {/* Header */}
        <motion.div
          variants={headerPop}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
          className="text-center mb-10"
        >
          <h2 className="font-bold text-3xl md:text-4xl mb-4 text-primary">
            استكشف حسب المجال
          </h2>
          <p className="text-gray-500 text-lg ">
            اختر مجالك المفضل وابدأ رحلتك التعليمية معنا
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.5 }}
          className="flex justify-end mb-6"
        >
          <Link
            to="/colleges"
            className="  font-bold text-primary hover:text-accent text-lg no-underline flex items-center  gap-2 transition-colors w-fit group"
          >
            عرض جميع المجالات{" "}
            <GrLinkPrevious className="group-hover:-translate-x-2 transition-transform" />
          </Link>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {categories.map((cat, i) => (
            <motion.div variants={cardPop} key={i}>
              <div className="p-6 text-center shadow-sm h-full rounded-2xl bg-card border border-gray-200 hover:border-primary cursor-pointer hover:-translate-y-2 transition-all duration-300">
                <div className="flex items-center justify-center mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 text-accent">
                  {cat.icon}
                </div>
                <div className="font-semibold text-primary text-lg">
                  {cat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Categories;
