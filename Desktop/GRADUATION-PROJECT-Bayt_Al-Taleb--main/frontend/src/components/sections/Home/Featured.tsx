import React from "react";
import { motion, Variants } from "framer-motion";
import { Link } from "react-router-dom";
import { GiGraduateCap } from "react-icons/gi";
import { BsStars } from "react-icons/bs";
import { GrLinkPrevious } from "react-icons/gr";

interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  desc: string;
  link: string;
  path: string;
}

const cards: FeatureCard[] = [
  {
    icon: <GiGraduateCap size={44} />,
    title: "التخصصات الأكاديمية",
    desc: "شرح شامل لكل تخصص دراسي يتضمن المسارات الوظيفية، المتطلبات، وأهم تلخيصات الكورسات الدراسية.",
    link: "استكشف التخصصات",
    path: "/colleges",
  },
  {
    icon: <BsStars size={40} />,
    title: "المنح الأكاديمية",
    desc: "قائمة منسقة بجميع المنح المتاحة للطلاب العرب، بما في ذلك منح البكالوريوس والدراسات العليا العالمية.",
    link: "تصفح جميع المنح",
    path: "/scholarships",
  },
];

const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2 },
  },
};

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

const Featured: React.FC = () => {
  return (
    <section className="bg-white w-full py-20 shadow-sm">
      <div className="container  py-6">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-center"
        >
          {cards.map((card, i) => (
            <motion.div
              variants={cardPopUp}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -8 }}
              key={i}
            >
              <div className="p-8 h-full  shadow-sm rounded-2xl border border-gray-200  hover:border-primary flex flex-col">
                <div className="flex justify-end font-bold mb-6 ">
                  <div className="p-4 bg-primary/10 rounded-2xl text-accent">
                    {card.icon}
                  </div>
                </div>
                <h3 className="font-bold mb-4 text-3xl text-primary">
                  {card.title}
                </h3>
                <p className="mb-8 font-semibold text-xl text-gray-500 leading-relaxed flex-grow">
                  {card.desc}
                </p>
                <Link
                  to={card.path}
                  className="group font-bold text-lg text-primary hover:text-accent no-underline flex items-center gap-2 transition-colors"
                >
                  {card.link}
                  <GrLinkPrevious className="transition-transform group-hover:-translate-x-2" />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Featured;
