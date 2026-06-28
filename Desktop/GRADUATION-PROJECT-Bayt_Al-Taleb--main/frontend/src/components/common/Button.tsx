import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface ButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.3, transition: { duration: 0.3 } }}
      className={`rounded-2xl font-semibold  text-xl p-2 bg-hero text-paragraph border border-paragraph outline-none  transition-all duration-300  ${className || ""}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;
