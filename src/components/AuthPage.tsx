import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { User, Lock, Mail, School, Landmark, Phone, Globe, Sparkles, LogIn, ArrowRight } from "lucide-react";

interface AuthPageProps {
  onLoginSuccess: (user: any, data: any) => void;
  onNavigateHome: () => void;
}

export default function AuthPage({ onLoginSuccess, onNavigateHome }: AuthPageProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "admin">("login");

  // Login states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRole, setLoginRole] = useState<"teacher" | "admin">("teacher");

  // Registration states
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPosition, setRegPosition] = useState("ครู ค.ศ. 1 (ไม่มีวิทยฐานะ)");
  const [regSchool, setRegSchool] = useState("โรงเรียนบ้านหนองหว้า");
  const [regAffiliation, setRegAffiliation] = useState("สำนักงานเขตพื้นที่การศึกษาประถมศึกษาบุรีรัมย์ เขต 3");
  const [regPhone, setRegPhone] = useState("");
  const [regSlug, setRegSlug] = useState("");
  const [regAcademicYear, setRegAcademicYear] = useState("2569");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-generate URL slug in English based on name
  useEffect(() => {
    if (regName && activeTab === "register") {
      const simplified = regName
        .replace(/ครู|ผู้ช่วย|ดร\.|นาย|นาง|นางสาว|ผศ\.|รศ\./g, "")
        .trim();
      
      // Basic translit helper or just lowercase english approximation or a simple generated hash
      let engApprox = simplified
        .toLowerCase()
        .replace(/\s+/g, "-");
      
      // If it's pure Thai and empty english, generate a random number
      if (!/^[a-z0-9-]+$/i.test(engApprox)) {
        // Map to standard common characters or use a unique hash based on name values
        engApprox = "kru-" + Math.floor(100 + Math.random() * 900);
      }
      setRegSlug(engApprox);
    }
  }, [regName, activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginRole === "admin" ? loginEmail : loginEmail.trim(),
          password: loginPassword,
          role: loginRole
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์");
      }

      setMessage({ type: "success", text: resData.message });
      setTimeout(() => {
        onLoginSuccess(resData.user, resData.data);
      }, 800);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    if (!regName.trim() || !regEmail.trim() || !regSlug.trim() || !regSchool.trim()) {
      setMessage({ type: "error", text: "กรุณาระบุข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อ-นามสกุล, อีเมล, โรงเรียน, แอดเดรสลิงก์)" });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          position: regPosition,
          school: regSchool.trim(),
          affiliation: regAffiliation.trim(),
          phone: regPhone.trim(),
          slug: regSlug.trim().toLowerCase(),
          academicYear: regAcademicYear
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "การลงทะเบียนเกิดข้อผิดพลาด");
      }

      setMessage({ type: "success", text: resData.message });
      // Clear registration inputs
      setRegName("");
      setRegEmail("");
      setRegSchool("");
      setRegPhone("");
      // Automatically switch to login tab and prefill email
      setLoginEmail(regEmail);
      setLoginRole("teacher");
      setTimeout(() => {
        setActiveTab("login");
        setMessage({ type: "success", text: "สมัครสิทธิ์แล้ว! บัญชีสิทธิ์จำลองจะสามารถเข้าสู่ระบบเพื่อใช้งานได้หลังจากรับอนุมัติ หรือสามารถเข้าใช้งานด้วยอีเมลสาธิต: mana@samsen.ac.th" });
      }, 2000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="w-full bg-slate-900 border-b border-slate-800 text-white py-4 px-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            onClick={onNavigateHome}
            className="flex items-center gap-3 cursor-pointer hover:opacity-90"
            id="header-brand-auth"
          >
            <div className="bg-amber-500 text-slate-900 p-2 rounded-lg font-bold text-lg shadow-sm">PA</div>
            <div>
              <h1 className="font-sans font-semibold text-lg leading-tight tracking-tight">ระบบบันทึกข้อตกลงในการพัฒนางาน (PA)</h1>
              <p className="text-xs font-sans text-slate-400">สํานักงานคณะกรรมการการศึกษาขั้นพื้นฐาน (สพฐ.)</p>
            </div>
          </div>
          <button 
            onClick={onNavigateHome}
            className="text-sm font-sans text-slate-300 hover:text-white border border-slate-700 px-4 py-1.5 rounded-lg transition-colors"
            id="back-home-btn"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Header tabs toggle */}
          <div className="flex bg-slate-900 text-slate-400 border-b border-slate-800">
            <button
              onClick={() => { setActiveTab("login"); setLoginRole("teacher"); setMessage(null); }}
              className={`flex-1 py-4 text-center font-medium text-sm transition-all focus:outline-none ${activeTab === "login" && loginRole === "teacher" ? "text-amber-400 bg-slate-800 border-b-2 border-amber-400 font-semibold" : "hover:text-white"}`}
              id="tab-login"
            >
              <LogIn className="inline-block w-4 h-4 mr-2" />
              ลงชื่อเข้าใช้งาน (ครู)
            </button>
            <button
              onClick={() => { setActiveTab("register"); setMessage(null); }}
              className={`flex-1 py-4 text-center font-medium text-sm transition-all focus:outline-none ${activeTab === "register" ? "text-amber-400 bg-slate-800 border-b-2 border-amber-400 font-semibold" : "hover:text-white"}`}
              id="tab-register"
            >
              <Sparkles className="inline-block w-4 h-4 mr-2" />
              ขอเปิดสิทธิ์ใช้งานใหม่
            </button>
            <button
              onClick={() => { setActiveTab("admin"); setLoginRole("admin"); setMessage(null); }}
              className={`flex-1 py-4 text-center font-medium text-sm transition-all focus:outline-none ${activeTab === "admin" || (activeTab === "login" && loginRole === "admin") ? "text-amber-400 bg-slate-800 border-b-2 border-amber-400 font-semibold" : "hover:text-white"}`}
              id="tab-admin"
            >
              <User className="inline-block w-4 h-4 mr-2" />
              ระบบดูแลระบบ (Admin)
            </button>
          </div>

          <div className="p-8">
            {message && (
              <div 
                className={`mb-6 p-4 rounded-xl text-sm border font-sans ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}
                id="auth-alert-message"
              >
                {message.text}
              </div>
            )}

            {/* TAB 1: LOGIN (Teacher) */}
            {(activeTab === "login" || activeTab === "admin") && (
              <motion.form 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleLogin}
                className="space-y-6"
                id="login-form"
              >
                <div>
                  <h3 className="text-xl font-bold font-sans text-slate-800 mb-2">
                    {loginRole === "admin" ? "เข้าใช้งานในฐานะผู้ดูแลสถานศึกษา" : "เข้าสู่ระบบเพื่อแก้ไขตัวชี้วัด PA"}
                  </h3>
                  <p className="text-sm font-sans text-slate-500">
                    {loginRole === "admin" 
                      ? "ควบคุมบัญชีคุณครู ตรวจสอบ อนุมัติการเผยแพร่ลิงก์รายงานผลการปฏิบัติงาน" 
                      : "กรอกข้อมูลอีเมลและรหัสผ่านเพื่อเข้าใช้งานแบบฟอร์มบันทึกตัวชี้วัดข้อตกลงการพัฒนางาน"}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold font-sans text-slate-600 uppercase tracking-wider mb-2">
                      {loginRole === "admin" ? "ชื่อบัญชีผู้ดูแลระบบ" : "อีเมลผู้ใช้งานครู (Email Address)"}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder={loginRole === "admin" ? "admin" : "ตัวอย่าง: mana@samsen.ac.th"}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-sans transition-all"
                        id="login-email-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold font-sans text-slate-600 uppercase tracking-wider mb-2">
                      รหัสผ่านความปลอดภัย (Password)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder={loginRole === "admin" ? "admin123" : "ระบุตัวเลข/รหัสผ่านเพื่อรักษาความปลอดภัย"}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-sans transition-all"
                        id="login-password-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Demonstration Alert Banner */}
                {loginRole === "teacher" && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 leading-relaxed font-sans">
                    💡 <strong>บัญชีตัวอย่างสำหรับทดลองสิทธิ์:</strong><br />
                    ครูชำนาญการพิเศษ: <span className="underline font-mono">mana@samsen.ac.th</span> (รหัสผ่านใดก็ได้)<br />
                    คุณครู ค.ศ.1: <span className="underline font-mono">piti@triamudom.ac.th</span> (รหัสผ่านใดก็ได้)
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3.5 bg-slate-900 border-none rounded-xl text-white font-sans text-sm font-semibold shadow-md hover:bg-slate-800 transition-colors cursor-pointer focus:outline-shadow disabled:opacity-50"
                  id="auth-submit-btn"
                >
                  {isLoading ? "กำลังทำงาน..." : "เข้าสู่ระบบทำงาน"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.form>
            )}

            {/* TAB 2: REGISTER (New teacher signup) */}
            {activeTab === "register" && (
              <motion.form 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleRegister}
                className="space-y-5"
                id="register-form"
              >
                <div>
                  <h3 className="text-xl font-bold font-sans text-slate-800 mb-1">
                    ขอขึ้นทะเบียนลิงก์และบัญชีครูผู้สอน
                  </h3>
                  <p className="text-sm font-sans text-slate-500">
                    ในการขึ้นทะเบียน คุณครูจะได้รับ ลิงก์ข้อตกลงในการพัฒนางาน (PA) ของคุณครูโดยอัตโนมัติ สำหรับจัดส่งให้คณะกรรมการประเมินของโรงเรียนท่านได้ทันที
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold font-sans text-slate-600 mb-1.5">
                      ชื่อ-นามสกุล (พร้อมคำนำหน้า) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="ครูสมคิด มุ่งมั่น"
                        className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-sans"
                        id="reg-name-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold font-sans text-slate-600 mb-1.5">
                      อีเมลสิทธิ์ใช้งาน <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="somkid@school.go.th"
                        className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-sans"
                        id="reg-email-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold font-sans text-slate-600 mb-1.5">
                      วิทยฐานะตามมาตรฐานตำแหน่ง
                    </label>
                    <select
                      value={regPosition}
                      onChange={(e) => setRegPosition(e.target.value)}
                      className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-sans"
                      id="reg-position-select"
                    >
                      <option value="ครู ค.ศ. 1 (ไม่มีวิทยฐานะ)">ครู ค.ศ. 1 (ไม่มีวิทยฐานะ)</option>
                      <option value="ครูวิทยฐานะชำนาญการ">ครูวิทยฐานะชำนาญการ</option>
                      <option value="ครูวิทยฐานะชำนาญการพิเศษ">ครูวิทยฐานะชำนาญการพิเศษ</option>
                      <option value="ครูวิทยฐานะเชี่ยวชาญ">ครูวิทยฐานะเชี่ยวชาญ</option>
                      <option value="ครูวิทยฐานะเชี่ยวชาญพิเศษ">ครูวิทยฐานะเชี่ยวชาญพิเศษ</option>
                      <option value="ครูผู้ช่วย">ครูผู้ช่วย</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold font-sans text-slate-600 mb-1.5">
                      เบอร์โทรศัพท์ติดต่อ
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="08X-XXXXXXX"
                        className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-sans"
                        id="reg-phone-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold font-sans text-slate-600 mb-1.5">
                      สถาบันการศึกษา / โรงเรียน <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <School className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={regSchool}
                        onChange={(e) => setRegSchool(e.target.value)}
                        placeholder="ระบุชื่อเต็มโรงเรียน เช่น โรงเรียนบ้านดอนวิทยาธิการ"
                        className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-sans"
                        id="reg-school-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold font-sans text-slate-600 mb-1.5">
                      สังกัดเขตพื้นที่ / อบจ. / อื่นๆ
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Landmark className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={regAffiliation}
                        onChange={(e) => setRegAffiliation(e.target.value)}
                        placeholder="สำนักงานเขตพื้นที่การศึกษาประถมศึกษาพระนครศรีอยุธยา เขต 1"
                        className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-sans"
                        id="reg-affiliation-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold font-sans text-slate-600 mb-1.5">
                        ปีงบประมาณที่เริ่มต้นทำข้อตกลง
                      </label>
                      <select
                        value={regAcademicYear}
                        onChange={(e) => setRegAcademicYear(e.target.value)}
                        className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-sans"
                        id="reg-year-select"
                      >
                        <option value="2569">ปีงบประมาณ 2569</option>
                        <option value="2568">ปีงบประมาณ 2568</option>
                        <option value="2567">ปีงบประมาณ 2567</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold font-sans text-slate-600 mb-1.5">
                        ชื่อลิงก์ประเมินที่ต้องการ (Slug) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Globe className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          required
                          value={regSlug}
                          onChange={(e) => setRegSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
                          placeholder="เช่น somkid-pa"
                          className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-sans font-mono"
                          id="reg-slug-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    🎈 ลิงก์ที่คณะกรรมการประเมินจะเข้ามาเห็นของคุณครู: <br />
                    <span className="font-mono text-amber-600 font-semibold select-all break-all">
                      {window.location.origin}/?p={regSlug || "(ชื่อลิงก์)"}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3 bg-amber-500 border-none rounded-xl text-slate-950 font-sans text-sm font-semibold shadow-md hover:bg-amber-400 transition-colors cursor-pointer focus:outline-shadow disabled:opacity-50"
                  id="reg-submit-btn"
                >
                  {isLoading ? "กำลังตรวจสอบข้อมูล..." : "ดำเนินการสมัครสิทธิ์ส่งให้แอดมินอนุมัติ"}
                </button>
              </motion.form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
