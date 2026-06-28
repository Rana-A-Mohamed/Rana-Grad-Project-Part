import React from "react";
import { LiaCertificateSolid } from "react-icons/lia";
import { FaSearch } from "react-icons/fa";
import { GiGraduateCap } from "react-icons/gi";
import { motion, Variants } from "framer-motion";

interface Step {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

const steps: Step[] = [
  {
    icon: <FaSearch />,
    title: "اختر تخصصك",
    desc: "ابحث عن المجال الدراسي الذي يلائم شغفك وطموحك المهني.",
  },
  {
    icon: <LiaCertificateSolid />,
    title: "اطّلع على التلخيصات والمنح",
    desc: "استفد من مكتبة ضخمة من الملخصات الدراسية وقوائم المنح المحدثة.",
  },
  {
    icon: <GiGraduateCap />,
    title: "سجّل وارفع/استفد",
    desc: "انضم للمجتمع، شارك معرفتك أو احصل على الدعم الأكاديمي الذي تحتاجه.",
  },
];

const cardPopUp: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      duration: 0.6,
    },
  },
};

const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2 },
  },
};

const HowItWorks: React.FC = () => {
  return (
    <section className="py-20 bg-bgSection">
      <div className="container py-8">
        {/* Header */}
        <motion.div
          variants={cardPopUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-bold text-3xl md:text-4xl mb-4 text-primary">
            كيف تعمل المنصة؟
          </h2>
          <p className="text-gray-500 text-lg">
            ثلاث خطوات بسيطة لبداية رحلتك الأكاديمية
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {steps.map((step, i) => (
            <motion.div
              key={i}
              variants={cardPopUp}
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
              className=" h-full"
            >
              <div className="p-6 text-center h-full rounded-2xl shadow-sm border border-gray-300 bg-white hover:border-primary  ">
                <div className="flex items-center justify-center text-4xl mx-auto mb-6 w-20 h-20 rounded-full bg-primary/10 text-accent">
                  {step.icon}
                </div>
                <h5 className="font-bold text-xl mb-3 text-primary">
                  {step.title}
                </h5>
                <p className="font-semibold text-gray-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
