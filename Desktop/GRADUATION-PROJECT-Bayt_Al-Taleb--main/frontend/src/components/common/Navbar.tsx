import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Link, NavLink, useNavigate } from "react-router-dom";
import Button from "./Button";
import { useAuth } from "../../store/AuthContext";
import { FiLogOut } from "react-icons/fi";
import { FaUserCircle, FaSearch } from "react-icons/fa";
import { MdAdminPanelSettings, MdKeyboardArrowDown } from "react-icons/md";
import { RiDashboardLine } from "react-icons/ri";

interface NavLinkConfig {
  label: string;
  path: string;
}

const mainLinks: NavLinkConfig[] = [
  { label: "الرئيسية", path: "/" },
  { label: "التخصصات", path: "/colleges" },
  { label: "الملخصات", path: "/course-summaries" },
  { label: "المنح", path: "/scholarships" },
  { label: "تواصل معنا", path: "/contact" },
];

const navVariants: Variants = {
  hidden: { y: -80, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6 },
  },
};

const linksVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const linkItem = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getDashboardLink = () => {
    if (!user) return "/auth";
    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") return "/";
    if (user.role === "MODERATOR") return "/supervisor";
    return "/dashboard";
  };

  const visibleLinks = mainLinks;

  const ProfileDropdownContent = ({ onClose }: { onClose: () => void }) => (
    <>
      {user?.role !== "MEMBER" && (
        <Link
          to={getDashboardLink()}
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 transition-colors no-underline"
        >
          {user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" ? (
            <MdAdminPanelSettings size={20} />
          ) : (
            <RiDashboardLine size={20} />
          )}
          <span className="text-md font-semibold">
            {user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
              ? "لوحة التحكم"
              : "لوحة المراجعة"}
          </span>
        </Link>
      )}

      <Link
        to={user?.role === "MEMBER" ? "/dashboard" : "/profile"}
        onClick={onClose}
        className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 transition-colors no-underline"
      >
        <FaUserCircle size={18} />
        <span className="text-md font-semibold">حسابي</span>
      </Link>

      <button
        onClick={() => {
          onClose();
          handleLogout();
        }}
        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-primary/5 transition-colors text-red-400 no-underline text-start bg-transparent border-none cursor-pointer"
      >
        <FiLogOut size={20} />
        <span className="text-md font-semibold">تسجيل الخروج</span>
      </button>
    </>
  );

  return (
    <motion.nav
      className="sticky top-0 z-50 bg-primary border-b border-white/10"
      variants={navVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
        {/* LOGO */}
        <Link to="/" className="text-2xl font-bold text-paragraph no-underline">
          🎓 بيت <span className="text-accent">الطالب</span>
        </Link>

        {/* LINKS Desktop */}
        <div className="hidden lg:flex items-center gap-6">
          <motion.ul
            className="flex items-center gap-6 m-0 p-0 list-none"
            variants={linksVariants}
            initial="hidden"
            animate="visible"
          >
            {visibleLinks.map((item) => (
              <motion.li key={item.label} variants={linkItem}>
                <NavLink
                  to={item.path}
                  className="text-paragraph hover:text-accent transition-colors text-lg no-underline font-semibold"
                >
                  {item.label}
                </NavLink>
              </motion.li>
            ))}

            {user?.role === "MODERATOR" && (
              <motion.li variants={linkItem}>
                <NavLink
                  to="/supervisor"
                  className="text-paragraph hover:text-accent transition-colors text-lg no-underline font-semibold"
                >
                  لوحة المراجعة
                </NavLink>
              </motion.li>
            )}
          </motion.ul>
        </div>

        {/* Desktop Search Link */}
        <NavLink
          to="/search"
          className="hidden lg:flex items-center gap-2 text-paragraph hover:text-accent transition-colors text-lg no-underline font-semibold"
        >
          <FaSearch className="text-paragraph/60" size={13} />
          <span>بحث</span>
        </NavLink>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Desktop Profile Dropdown */}
          {isAuthenticated && user ? (
            <div className="relative hidden lg:block">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 text-paragraph hover:text-accent transition-colors bg-transparent border-none outline-none cursor-pointer p-0"
              >
                <FaUserCircle size={24} />
                <span className="font-semibold text-sm">{user.fullName}</span>
                <MdKeyboardArrowDown
                  size={20}
                  className={`transition-transform duration-300 ${isProfileOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isProfileOpen && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileOpen(false)}
                />
              )}

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 top-full mt-2 w-48 bg-bgSection text-primary border border-white/10 rounded-xl shadow-xl overflow-hidden py-2 z-50 flex flex-col"
                  >
                    <ProfileDropdownContent
                      onClose={() => setIsProfileOpen(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <NavLink to="/auth" className="hidden lg:block">
              <Button>تسجيل الدخول</Button>
            </NavLink>
          )}

          {/* BURGER Mobile */}
          <button
            className="lg:hidden p-2 text-accent focus:outline-none"
            onClick={() => {
              setIsOpen(!isOpen);
              setIsMobileProfileOpen(false);
            }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, pointerEvents: "none" }}
            animate={{ height: "auto", opacity: 1, pointerEvents: "auto" }}
            exit={{ height: 0, opacity: 0, pointerEvents: "none" }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-primary border-t border-white/10 text-center"
          >
            <div className="flex flex-col px-4 py-6 gap-4">
              {/* Navigation Links */}
              <ul className="flex flex-col gap-4 list-none m-0 p-0">
                {visibleLinks.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.path}
                      className="text-paragraph hover:text-accent transition-colors text-lg no-underline font-medium block"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                {user?.role === "MODERATOR" && (
                  <li>
                    <Link
                      to="/supervisor"
                      className="text-paragraph hover:text-accent transition-colors text-lg no-underline font-medium block"
                      onClick={() => setIsOpen(false)}
                    >
                      لوحة المراجعة
                    </Link>
                  </li>
                )}
              </ul>

              {/* Divider */}
              <div className="w-full h-px bg-white/10" />

              {/* Mobile Profile Section */}
              {isAuthenticated && user && (
                <div className="relative inline-flex flex-col items-center">
                  {/* Profile Toggle Button */}
                  <button
                    onClick={() => setIsMobileProfileOpen(!isMobileProfileOpen)}
                    className="flex items-center gap-2 text-paragraph hover:text-accent transition-colors bg-transparent border-none outline-none cursor-pointer p-0"
                  >
                    <FaUserCircle size={22} />
                    <span className="font-semibold text-base">
                      {user.fullName}
                    </span>
                    <MdKeyboardArrowDown
                      size={20}
                      className={`transition-transform duration-300 ${isMobileProfileOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Invisible overlay to close on click outside */}
                  {isMobileProfileOpen && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsMobileProfileOpen(false)}
                    />
                  )}

                  {/* Floating dropdown - Pure Tailwind, perfectly centered under button */}
                  <AnimatePresence>
                    {isMobileProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute  -translate-x-1/2 top-full mt-2 w-48 bg-bgSection text-primary border border-white/10 rounded-xl shadow-xl overflow-hidden py-2 z-50 flex flex-col"
                      >
                        <ProfileDropdownContent
                          onClose={() => {
                            setIsMobileProfileOpen(false);
                            setIsOpen(false);
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Login Button - Only for non-authenticated users */}
              {!isAuthenticated && (
                <div className="flex flex-col">
                  <Link
                    to="/auth"
                    onClick={() => setIsOpen(false)}
                    className="w-full text-center no-underline"
                  >
                    <Button>تسجيل الدخول</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
