"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { setStoredUser } from "@/lib/auth";

import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  User,
  Building2,
  DoorOpen,
  ChevronRight,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"login" | "register">(
    searchParams.get("tab") === "register" ? "register" : "login"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [hostelBlock, setHostelBlock] = useState("");
  const [roomNo, setRoomNo] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res =
        tab === "login"
          ? await api.auth.login(email, password)
          : await api.auth.register({
              email,
              password,
              name,
              hostel_block: hostelBlock,
              room_no: roomNo,
            });
      setStoredUser(res.user, res.access_token);
      const redirect: Record<string, string> = {
        student: "/student/dashboard",
        tech: "/tech/dashboard",
        admin: "/admin/dashboard",
      };
      router.push(redirect[res.user.role] || "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const formVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.2, ease: "easeIn" },
    },
  } as const;

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-purple-300/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-pattern opacity-[0.03]" />
      </div>

      <main className="relative z-10 flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md mx-auto">
          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <div className="bg-white rounded-3xl shadow-xl shadow-black/5 ring-1 ring-black/5 p-8 md:p-10">
              {/* Tab Switcher - Modern pill design */}
              <div className="flex gap-1.5 mb-8 bg-slate-100 rounded-2xl p-1.5">
                <button
                  onClick={() => {
                    setTab("login");
                    setError("");
                  }}
                  className={`relative flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    tab === "login"
                      ? "text-primary"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab === "login" && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white rounded-xl shadow-sm"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Lock className="size-3.5" />
                    Sign In
                  </span>
                </button>
                <button
                  onClick={() => {
                    setTab("register");
                    setError("");
                  }}
                  className={`relative flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    tab === "register"
                      ? "text-primary"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab === "register" && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white rounded-xl shadow-sm"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <User className="size-3.5" />
                    Register
                  </span>
                </button>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2.5 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3.5 rounded-xl mb-6 overflow-hidden"
                  >
                    <div className="size-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form with AnimatePresence for tab transitions */}
              <AnimatePresence mode="wait">
                <motion.form
                  key={tab}
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 ml-1 uppercase tracking-wider">
                      Email Address
                    </Label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] text-slate-400 group-focus-within:text-primary transition-colors duration-200">
                        <Mail className="size-[18px]" />
                      </div>
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@institution.edu"
                        className="w-full bg-slate-50/80 border-slate-200 rounded-xl pl-12 pr-4 py-4 h-auto text-sm placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center px-1">
                      <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Password
                      </Label>
                    </div>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] text-slate-400 group-focus-within:text-primary transition-colors duration-200">
                        <Lock className="size-[18px]" />
                      </div>
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50/80 border-slate-200 rounded-xl pl-12 pr-12 py-4 h-auto text-sm placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="size-[18px]" />
                        ) : (
                          <Eye className="size-[18px]" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Register extra fields */}
                  {tab === "register" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-5"
                    >
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600 ml-1 uppercase tracking-wider">
                          Full Name
                        </Label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] text-slate-400 group-focus-within:text-primary transition-colors duration-200">
                            <User className="size-[18px]" />
                          </div>
                          <Input
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full bg-slate-50/80 border-slate-200 rounded-xl pl-12 pr-4 py-4 h-auto text-sm placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-600 ml-1 uppercase tracking-wider">
                            Hostel Block
                          </Label>
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] text-slate-400 group-focus-within:text-primary transition-colors duration-200">
                              <Building2 className="size-[18px]" />
                            </div>
                            <Input
                              value={hostelBlock}
                              onChange={(e) => setHostelBlock(e.target.value)}
                              placeholder="A, B..."
                              className="w-full bg-slate-50/80 border-slate-200 rounded-xl pl-12 pr-4 py-4 h-auto text-sm placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-600 ml-1 uppercase tracking-wider">
                            Room No
                          </Label>
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] text-slate-400 group-focus-within:text-primary transition-colors duration-200">
                              <DoorOpen className="size-[18px]" />
                            </div>
                            <Input
                              value={roomNo}
                              onChange={(e) => setRoomNo(e.target.value)}
                              placeholder="101"
                              className="w-full bg-slate-50/80 border-slate-200 rounded-xl pl-12 pr-4 py-4 h-auto text-sm placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="pt-1"
                  >
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-primary to-blue-600 text-white py-4 rounded-xl font-semibold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-primary/25 active:scale-[0.98] transition-all duration-300 h-auto text-sm tracking-wide"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />{" "}
                          Processing...
                        </>
                      ) : (
                        <>
                          {tab === "login" ? "Sign In" : "Create Account"}
                          <ChevronRight className="size-4" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </motion.form>
              </AnimatePresence>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-slate-400 font-medium">
                    {tab === "login"
                      ? "New to FixTrack?"
                      : "Already registered?"}
                  </span>
                </div>
              </div>

              {/* Toggle Link */}
              <div className="text-center">
                <button
                  onClick={() => {
                    setTab(tab === "login" ? "register" : "login");
                    setError("");
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
                >
                  {tab === "login" ? (
                    <>
                      Create an account
                      <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  ) : (
                    <>
                      <ArrowRight className="size-3.5 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                      Sign in instead
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
