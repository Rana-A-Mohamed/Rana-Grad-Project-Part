import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FcGoogle } from "react-icons/fc";
import { TfiMicrosoftAlt } from "react-icons/tfi";
import { GiGraduateCap } from "react-icons/gi";
import { useToast } from "@/hooks/use-toast";
import { loginApi, registerApi } from "@/api/auth";
import { useAuth } from "@/store/AuthContext";
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("صيغة البريد الإلكتروني غير صحيحة"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

const registerSchema = z
  .object({
    name: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
    email: z
      .string()
      .min(1, "البريد الإلكتروني مطلوب")
      .email("صيغة البريد الإلكتروني غير صحيحة"),
    password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتان",
    path: ["confirmPassword"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

const slideVariants: Variants = {
  enterLogin: { x: "-100%", opacity: 0 },
  enterRegister: { x: "100%", opacity: 0 },
  center: { x: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
  exitLogin: { x: "100%", opacity: 0, transition: { duration: 0.3 } },
  exitRegister: { x: "-100%", opacity: 0, transition: { duration: 0.3 } },
};

interface InputFieldProps {
  label: string;
  type: string;
  placeholder: string;
  error?: string;
  registration: object;
  className?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  type,
  placeholder,
  error,
  registration,
}) => (
  <div className="flex flex-col gap-2">
    <label className="font-semibold text-primary text-sm">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      className={`border rounded-xl px-4 py-3 outline-none transition-colors bg-bgSection  text-primary placeholder:text-gray-400 ${
        error
          ? "border-red-400 focus:border-red-400"
          : "border-gray-300 focus:border-primary"
      }`}
      {...registration}
    />
    {error && <p className="text-red-400 text-xs">{error}</p>}
  </div>
);

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const {
    register: registerSignup,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors, isSubmitting: isRegisterSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const onLogin = async (data: LoginFormData) => {
    try {
      const json = await loginApi(data.email, data.password);

      login(json.data.user, json.data.tokens.accessToken);

      if (
        json.data.user.role === "ADMIN" ||
        json.data.user.role === "SUPER_ADMIN"
      ) {
        navigate("/");
      } else if (json.data.user.role === "MODERATOR") {
        navigate("/supervisor");
      } else {
        navigate("/dashboard");
      }

      toast({
        title: "تم تسجيل الدخول",
        description: `مرحباً ${json.data.user.fullName}`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: err.response?.data?.message || "فشل تسجيل الدخول",
      });
    }
  };
  const onRegister = async (data: RegisterFormData) => {
    try {
      const json = await registerApi(data.email, data.password, data.name);
      login(json.data.user, json.data.tokens.accessToken);
      navigate("/");
      toast({
        title: "تم إنشاء الحساب",
        description: `مرحباً ${json.data.user.fullName}`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description:
          err.response?.data?.message || "حدث خطأ أثناء إنشاء الحساب",
      });
    }
  };
  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-10 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="py-5 bg-bgSection rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center text-4xl mx-auto mb-6 w-20 h-20 rounded-full bg-primary/10 text-accent">
              <GiGraduateCap />
            </div>
            <p className="text-primary mt-2 font-semibold text-lg">
              منصة التعليم المتكاملة
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-4 font-bold text-lg transition-colors duration-300 ${
                isLogin
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-400 hover:text-primary"
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-4 font-bold text-lg transition-colors duration-300 ${
                !isLogin
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-400 hover:text-primary"
              }`}
            >
              إنشاء حساب
            </button>
          </div>

          {/* Forms */}
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              {isLogin ? (
                <motion.div
                  key="login"
                  initial="enterLogin"
                  animate="center"
                  exit="exitLogin"
                  variants={slideVariants}
                  className="p-8"
                >
                  <form
                    onSubmit={handleLoginSubmit(onLogin)}
                    className="flex flex-col gap-4"
                  >
                    <InputField
                      label="البريد الإلكتروني"
                      type="email"
                      placeholder="example@email.com"
                      error={loginErrors.email?.message}
                      registration={registerLogin("email")}
                    />

                    <InputField
                      label="كلمة المرور"
                      type="password"
                      placeholder="••••••••"
                      error={loginErrors.password?.message}
                      registration={registerLogin("password")}
                    />

                    <Link
                      to="#"
                      className="w-fit text-primary text-sm font-semibold no-underline hover:text-accent transition-colors"
                    >
                      نسيت كلمة المرور؟
                    </Link>

                    <motion.button
                      type="submit"
                      disabled={isLoginSubmitting}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
                      className="w-full bg-primary text-paragraph font-bold py-3 rounded-xl hover:bg-primaryLight transition-colors duration-300 text-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isLoginSubmitting
                        ? "جارٍ تسجيل الدخول..."
                        : "تسجيل الدخول"}
                    </motion.button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-primary text-sm">أو تابع عبر</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Social buttons */}
                    <div className="flex gap-3">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-xl py-3 font-semibold text-primary hover:border-primary transition-colors"
                      >
                        <FcGoogle size={20} />
                        Google
                      </motion.button>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-xl py-3 font-semibold text-primary hover:border-primary transition-colors"
                      >
                        <TfiMicrosoftAlt size={20} color="#00a1f1" />
                        Microsoft
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  initial="enterRegister"
                  animate="center"
                  exit="exitRegister"
                  variants={slideVariants}
                  className="p-8"
                >
                  <form
                    onSubmit={handleRegisterSubmit(onRegister)}
                    className="flex flex-col gap-4"
                  >
                    <InputField
                      label="الاسم"
                      type="text"
                      placeholder="الاسم الكامل"
                      error={registerErrors.name?.message}
                      registration={registerSignup("name")}
                    />

                    <InputField
                      label="البريد الإلكتروني"
                      type="email"
                      placeholder="example@email.com"
                      error={registerErrors.email?.message}
                      registration={registerSignup("email")}
                    />

                    <InputField
                      label="كلمة المرور"
                      type="password"
                      placeholder="••••••••"
                      error={registerErrors.password?.message}
                      registration={registerSignup("password")}
                    />

                    <InputField
                      label="تأكيد كلمة المرور"
                      type="password"
                      placeholder="••••••••"
                      error={registerErrors.confirmPassword?.message}
                      registration={registerSignup("confirmPassword")}
                    />

                    <motion.button
                      type="submit"
                      disabled={isRegisterSubmitting}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
                      className="w-full bg-primary text-paragraph font-bold py-3 mt-5 rounded-xl hover:bg-primaryLight transition-colors duration-300 text-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isRegisterSubmitting
                        ? "جارٍ إنشاء الحساب..."
                        : "إنشاء حساب"}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
