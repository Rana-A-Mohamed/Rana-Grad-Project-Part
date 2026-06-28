import React from "react";
import { Link } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { IoIosMail } from "react-icons/io";
import { FaPhoneAlt } from "react-icons/fa";
interface FooterLink {
  label: string;
  path: string;
}

const quickLinks: FooterLink[] = [
  { label: "الرئيسية", path: "/" },
  { label: "التخصصات", path: "/colleges" },
  { label: "المنح", path: "/scholarships" },
];

const legalLinks: FooterLink[] = [
  { label: "سياسة الخصوصية", path: "#" },
  { label: "شروط الاستخدام", path: "#" },
  { label: "الأسئلة الشائعة", path: "#" },
];

const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};
const Footer: React.FC = () => {
  return (
    <footer className="pt-16 pb-8 bg-bgDark">
      <div className="container ">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
          className=" grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 lg:gap-3"
        >
          {/* About */}
          <motion.div
            variants={fadeUp}
            className=" lg:col-span-1 text-center md:text-start"
          >
            <h3 className="font-bold text-2xl mb-4 text-paragraph">
              🎓 بيت <span className="text-accent">الطالب</span>
            </h3>
            <p className="font-semibold text-gray-400 leading-relaxed max-w-sm  mx-auto ">
              المنصة الأكاديمية الأولى في العالم العربي لإرشاد الطلاب وتوجيههم
              نحو المستقبل المشرق.
            </p>
          </motion.div>

          {/* Quick links */}
          <motion.div
            variants={fadeUp}
            className=" flex flex-col  items-center text-center md:text-start"
          >
            <h5 className="font-bold mb-4 text-paragraph text-lg">
              روابط سريعة
            </h5>
            <ul className="list-none p-0 m-0 flex flex-col gap-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="no-underline font-medium text-gray-400 hover:text-accent  transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal links and Social */}
          <motion.div
            variants={fadeUp}
            className=" flex flex-col  items-center text-center md:text-start flex flex-col "
          >
            <h5 className="font-bold mb-4 text-paragraph text-lg">قانوني</h5>
            <ul className="list-none p-0 m-0 flex flex-col gap-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="no-underline font-medium text-gray-400 hover:text-accent "
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            variants={fadeUp}
            className=" items-center text-center md:text-start flex flex-col "
          >
            <h5 className="font-bold mb-4 text-paragraph text-lg">تابعنا</h5>
            <div className="flex gap-4 justify-center md:justify-start">
              <Link
                to="mailto:info@baitaltalib.com"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-accent"
              >
                <IoIosMail size={20} />
              </Link>

              <Link
                to="tel:+201234567890"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-accent"
              >
                <FaPhoneAlt size={20} />
              </Link>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom bar */}
        <div className="text-center pt-8 mt-12 border-t border-gray-700">
          <p className="font-semibold text-paragraph hover:text-accent  duration-300 cursor-pointer">
            © 2026 بيت الطالب. جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
