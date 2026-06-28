import React from "react";
import { motion, Variants } from "framer-motion";

const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

interface StatItem {
  num: string;
  label: string;
}

const stats: StatItem[] = [
  { num: "+80K عضو", label: "طالب وخريج في المجتمع" },
  { num: "+50 منشور يوميًا", label: "منشور أكاديمي يومياً" },
  { num: "منذ 2014", label: "عشر سنوات من العطاء" },
];

const StatsBar: React.FC = () => {
  return (
    <section className="bg-white">
      <div className=" container bg-white  w-full  shadow-sm">
        <div className="container mx-auto px-4">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3   text-center"
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="py-8 flex flex-col items-center justify-center hover:bg-muted/50 transition-colors"
              >
                <div className="font-bold text-3xl md:text-3xl text-primary">
                  {stat.num}
                </div>
                <div className="font-semibold text-gray-500 mt-2 text-lg">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
