import React from "react";
import { motion, Variants } from "framer-motion";
import Button from "../.././common/Button";
import { Link } from "react-router-dom";

const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.5 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const HeroSection: React.FC = () => {
  return (
    <section className="py-20 relative overflow-hidden bg-hero">
      {/* Background decoration circles */}
      <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-accent/10  pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-primaryLight/30  pointer-events-none" />
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="  container mx-auto px-4 py-12 text-center relative z-10"
      >
        <div className="animate-up-down">
          <motion.span
            variants={fadeUp}
            className="inline-block bg-accent/15 border border-accent/40 text-accent rounded-full px-4 py-2 text-lg font-semibold mb-6"
          >
            🌟 منصة الطلاب العرب الأولى
          </motion.span>
        </div>
        <motion.h1
          variants={fadeUp}
          className="font-bold mb-6 text-paragraph text-5xl md:text-6xl"
        >
          بيت الطالب —{" "}
          <span className="text-accent block mt-2">بيت كل طالب عربي</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="text-lg md:text-xl mx-auto mb-10 font-semibold text-paragraph max-w-xl"
        >
          نصل الطلاب العرب بالإرشاد الأكاديمي الموثوق لمستقبل تعليمي أفضل وبناء
          مهني متميز
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link to="/colleges">
            <Button className=" sm:w-auto">🎓 استكشف التخصصات</Button>
          </Link>
          <Link to="/scholarships">
            <Button className=" sm:w-auto">💰 تصفح المنح</Button>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
