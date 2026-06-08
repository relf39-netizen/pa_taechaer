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
  const [regType, setRegType] = useState<"teacher" | "school">("teacher");
  
  // 1) General teacher signup
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPosition, setRegPosition] = useState("ครู ค.ศ. 1 (ไม่มีวิทยฐานะ)");
  const [regSchool, setRegSchool] = useState("");
  const [regAffiliation, setRegAffiliation] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regSlug, setRegSlug] = useState("");
  const [regIdCard, setRegIdCard] = useState("");
  const [regAcademicYear, setRegAcademicYear] = useState("2569");
  const [schoolSmissCode, setSchoolSmissCode] = useState("");
  const [detectedSchoolName, setDetectedSchoolName] = useState("");
  const [schools, setSchools] = useState<any[]>([]);

  // 2) School system register (8-digit SMISS)
  const [regSchoolSmissCode, setRegSchoolSmissCode] = useState("");
  const [regSchoolName, setRegSchoolName] = useState("");
  const [regSchoolAffiliation, setRegSchoolAffiliation] = useState("");

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

  // Handle setting default internal email when ID Card changes
  useEffect(() => {
    if (regIdCard && activeTab === "register") {
      setRegEmail(`${regIdCard.trim()}@pa.local`);
    }
  }, [regIdCard, activeTab]);

  // Load schools list on tab shift to assist signup selection
  useEffect(() => {
    if (activeTab === "register") {
      const fetchSchools = async () => {
        try {
          const response = await fetch("/api/schools");
          const resData = await response.json();
          if (resData.success) {
            setSchools(resData.schools || []);
          }
        } catch (err) {
          console.error("Error fetching schools list:", err);
        }
      };
      fetchSchools();
    }
  }, [activeTab]);

  // Reactive SMISS code lookup helper
  useEffect(() => {
    if (schoolSmissCode.length === 8) {
      const match = schools.find(s => s.smissCode === schoolSmissCode);
      if (match) {
        if (match.status === "approved") {
          setDetectedSchoolName(`✅ โรงเรียน: ${match.name} | ${match.affiliation}`);
          setRegSchool(match.name);
          setRegAffiliation(match.affiliation);
        } else {
          setDetectedSchoolName("⚠️ โรงเรียนนี้ส่งคำขอจดทะเบียนแล้ว แต่ยังไม่ได้รับการอนุมัติใช้งานจากแอดมินกลาง");
          setRegSchool("");
          setRegAffiliation("");
        }
      } else {
        setDetectedSchoolName("❌ ไม่พบสำนักรหัสโรงเรียนนี้ในระบบ (กรุณาให้แอดมินขอจัดตั้งโรงเรียนนี้ก่อน)");
        setRegSchool("");
        setRegAffiliation("");
      }
    } else if (schoolSmissCode.length > 0) {
      setDetectedSchoolName("ระบุรหัสประจำโรงเรียน 8 หลักเพื่อตรวจสอบ...");
      setRegSchool("");
      setRegAffiliation("");
    } else {
      setDetectedSchoolName("");
    }
  }, [schoolSmissCode, schools]);

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

    if (!regIdCard || regIdCard.trim().length !== 13) {
      setMessage({ type: "error", text: "กรุณาระบุหมายเลขประจำตัวประชาชนให้ครบถ้วน 13 หลักเพื่อใช้เป็นรหัสประจำตัว (Username) ในการเข้าสู่ระบบ" });
      setIsLoading(false);
      return;
    }

    if (regType === "school") {
      if (!regSchoolSmissCode.trim() || !regSchoolName.trim() || !regName.trim() || !regEmail.trim() || !regSlug.trim()) {
        setMessage({ type: "error", text: "กรุณาระบุข้อมูลที่จำเป็นสำหรับการขอจัดตั้งและครูดูแลหลัก (School Admin) ให้ครบถ้วน" });
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/schools/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            smissCode: regSchoolSmissCode.trim(),
            schoolName: regSchoolName.trim(),
            affiliation: regSchoolAffiliation.trim(),
            adminName: regName.trim(),
            adminEmail: regEmail.trim(),
            adminPhone: regPhone.trim(),
            slug: regSlug.trim().toLowerCase(),
            position: regPosition,
            academicYear: regAcademicYear,
            idCard: regIdCard.trim()
          }),
        });

        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.message || "การขอจัดตั้งโรงเรียนเกิดข้อผิดพลาด");
        }

        setMessage({ type: "success", text: resData.message });
        setRegSchoolSmissCode("");
        setRegSchoolName("");
        setRegName("");
        setRegEmail("");
        setRegPhone("");
        setRegSlug("");
        setRegIdCard("");

        setTimeout(() => {
          setActiveTab("login");
          setMessage({ type: "success", text: "ส่งคำขอจัดตั้งโรงเรียนเรียบร้อยแล้ว! Username ล็อกอินคือหมายเลขประจำตัวประชาชนของคุณ โดยมีรหัสผ่านชั่วคราวเริ่มต้นคือ 123456 (รอ Super Admin อนุมัติสิทธิ์จัดตั้งโรงเรียน)" });
        }, 3500);
      } catch (err: any) {
        setMessage({ type: "error", text: err.message });
      } finally {
        setIsLoading(false);
      }
    } else { // regType === "teacher"
      if (!regName.trim() || !regEmail.trim() || !regSlug.trim() || !schoolSmissCode.trim() || !regSchool.trim()) {
        setMessage({ type: "error", text: "กรุณากรอกรหัสประจำโรงเรียน 8 หลักและตรวจสอบความถูกต้อง โรงเรียนปลายทางต้องได้รับการจดทะเบียนก่อนคุณเข้าร่วม" });
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
            schoolSmissCode: schoolSmissCode.trim(),
            school: regSchool.trim(),
            affiliation: regAffiliation.trim(),
            phone: regPhone.trim(),
            slug: regSlug.trim().toLowerCase(),
            academicYear: regAcademicYear,
            idCard: regIdCard.trim()
          }),
        });

        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.message || "การลงทะเบียนเกิดข้อผิดพลาด");
        }

        setMessage({ type: "success", text: resData.message });
        setRegName("");
        setRegEmail("");
        setSchoolSmissCode("");
        setRegSchool("");
        setRegPhone("");
        setRegSlug("");
        const registeredIdCard = regIdCard.trim();
        setRegIdCard("");

        // Automatically prefill login with successful ID card number
        setLoginEmail(registeredIdCard);
        setLoginRole("teacher");

        setTimeout(() => {
          setActiveTab("login");
          setMessage({ type: "success", text: "ส่งใบสมัครสมาชิกแล้ว! กรุณาลงชื่อใช้งานด้วย หมายเลขประจำตัวประชาชน และรหัสผ่านชั่วคราวเริ่มต้น 123456 (คุณจะเข้าใช้งานได้หลังจากแอดมินของโรงเรียนอนุมัติ)" });
        }, 3500);
      } catch (err: any) {
        setMessage({ type: "error", text: err.message });
      } finally {
        setIsLoading(false);
      }
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
                    {loginRole === "admin" ? "เข้าใช้งานในฐานะผู้ดูแลระบบสูงสุด (Super Admin)" : "เข้าสู่ระบบด้วยหมายเลขประจำตัวประชาชน"}
                  </h3>
                  <p className="text-sm font-sans text-slate-500">
                    {loginRole === "admin" 
                      ? "อนุมัติโรงเรียนเครือข่าย มอบอำนวยการระบบและตรวจสอบสิทธิ์แอดมินย่อย" 
                      : "กรอกหมายเลขประจำตัวประชาชน 13 หลัก และรหัสผ่านเพื่อเข้าใช้งาน"}
                  </p>
                  
                  {loginRole === "admin" && (
                    <div className="mt-4 p-3.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-sans italic">
                      <p className="font-bold mb-1">🔑 ส่วนเข้าใช้งานของผู้ดูแลระบบส่วนกลาง:</p>
                      <p>กรุณาระบุชื่อผู้ใช้และรหัสผ่านที่คุณได้รับการแจ้งจากทางส่วนกลางเพื่อเข้าสู่ระบบควบคุม</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold font-sans text-slate-600 uppercase tracking-wider mb-2">
                      {loginRole === "admin" ? "ชื่อบัญชีผู้ดูแลระบบ" : "หมายเลขประจำตัวประชาชน (13 หลัก)"}
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
                        placeholder={loginRole === "admin" ? "admin" : "ตัวอย่าง: 1234567890123"}
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
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold font-sans text-slate-800 mb-1">
                    สมัครขอเปิดสิทธิ์ใช้งานระบบ
                  </h3>
                  <p className="text-sm font-sans text-slate-500">
                    เลือกสิทธิ์ผู้รับประโยชน์เพื่อดำเนินการขอเข้าใช้ระบบบันทึกความตกลงการพัฒนางาน (OBEC PA)
                  </p>
                </div>

                {/* Sub-tab switcher: Teacher vs. School Admin */}
                <div className="flex p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { setRegType("teacher"); setMessage(null); }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg font-sans transition-all cursor-pointer ${regType === "teacher" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    คุณครูทั่วไป (ร่วมเครือข่ายโรงเรียน)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRegType("school"); setMessage(null); }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg font-sans transition-all cursor-pointer ${regType === "school" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    ขอจัดตั้งโรงเรียนใหม่ (แอดมินโรงเรียน)
                  </button>
                </div>

                <form onSubmit={handleRegister} className="space-y-5" id="register-form">
                  {regType === "school" ? (
                    /* SCHOOL REGISTER FORM FIELDS */
                    <div className="space-y-4">
                      <div className="p-3.5 bg-cyan-50 border border-cyan-100 rounded-xl text-xs text-slate-700 leading-relaxed">
                        🏫 <strong>การจัดตั้งระบบโรงเรียนใหม่:</strong> กรอกรหัส SMISS 8 หลัก เพื่อขออนุญาต Super Admin ให้เปิดใช้บริการฐานข้อมูลแบบฟอร์มโรงเรียนของท่าน เมื่อได้รับการอนุมัติแล้ว ครูผู้ยื่นขอจะได้รับสิทธิ์เป็น <strong>School Admin (แอดมินโรงเรียน)</strong> เพื่อเพิ่ม/ดูแลคุณครูและกำหนดกรรมการประเมินของสถาบันได้เอง
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold font-sans text-slate-600 mb-1.5">
                            รหัส SMISS โรงเรียน (8 หลัก) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={8}
                            value={regSchoolSmissCode}
                            onChange={(e) => setRegSchoolSmissCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="ระบุรหัส 8 หลัก เช่น 10300101"
                            className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-sans"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold font-sans text-slate-600 mb-1.5">
                            ชื่อสถานศึกษา/โรงเรียนเต็ม <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={regSchoolName}
                            onChange={(e) => setRegSchoolName(e.target.value)}
                            placeholder="เช่น โรงเรียนบ้านหนองหว้า"
                            className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-sans"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold font-sans text-slate-600 mb-1.5">
                          สำนักงานสังกัดเขตพื้นที่การศึกษา <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Landmark className="h-4 w-4 text-slate-400" />
                          </div>
                          <input
                            type="text"
                            required
                            value={regSchoolAffiliation}
                            onChange={(e) => setRegSchoolAffiliation(e.target.value)}
                            placeholder="เช่น สำนักงานเขตพื้นที่การศึกษาประถมศึกษาบุรีรัมย์ เขต 3"
                            className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-sans"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* TEACHER JOIN FORM FIELDS */
                    <div className="space-y-4">
                      <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 leading-relaxed">
                        🧩 <strong>คุณครูร่วมเครือข่าย:</strong> กรอกรหัส SMISS 8 หลัก เพื่อค้นหาโรงเรียนสังกัดเดิมที่แอดมินขอยื่นจัดตั้งไว้ เมื่อลงทะเบียนแล้ว แอดมินโรงเรียนของคุณจะกดตรวจสอบตอบรับอนุมัติเข้าประเมินงาน
                      </div>

                      <div>
                        <label className="block text-xs font-semibold font-sans text-slate-600 mb-1.5">
                          รหัส SMISS โรงเรียนสังกัด (8 หลัก) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <School className="h-4 w-4 text-slate-400" />
                          </div>
                          <input
                            type="text"
                            required
                            maxLength={8}
                            value={schoolSmissCode}
                            onChange={(e) => setSchoolSmissCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="ระบุรหัส 8 หลัก เช่น 10300101"
                            className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-sans font-semibold text-slate-800 tracking-wider"
                            id="reg-smiss-input"
                          />
                        </div>
                        {detectedSchoolName && (
                          <p className={`mt-2 text-xs font-bold font-sans px-1 ${detectedSchoolName.startsWith("✅") ? "text-emerald-600" : "text-amber-600"}`}>
                            {detectedSchoolName}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* COMMON PROFILE DETAILS */}
                  <div className="border-t border-slate-100 pt-4 space-y-4">
                    <p className="text-xs font-bold font-sans text-slate-700 uppercase tracking-wide">
                      ข้อมูลสิทธิ์ส่วนบุคคล {regType === "school" ? "(แอดมินดูแลหลัก)" : "(คุณครูผู้เขียนเป้าหมาย)"}
                    </p>

                    <div>
                      <label className="block text-xs font-semibold font-sans text-slate-600 mb-1.5">
                        หมายเลขประจำตัวประชาชน (13 หลัก) <span className="text-rose-500">*</span> <span className="text-slate-400 font-normal">(ใช้เป็นคุณลักษณะชื่อล็อกอิน Username และรหัสแรกเข้าคือ 1-6 อัตโนมัติ)</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={13}
                        value={regIdCard}
                        onChange={(e) => setRegIdCard(e.target.value.replace(/\D/g, ""))}
                        placeholder="กรอกตัวเลข 13 หลัก เช่น 1234567890123"
                        className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-sans font-semibold tracking-widest text-slate-800"
                        id="reg-idcard-input"
                      />
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold font-sans text-slate-600 mb-1.5">
                          ชื่อ-นามสกุลของคุณครู <span className="text-rose-500">*</span>
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
                          <option value="ผู้อำนวยการโรงเรียน">ผู้อำนวยการโรงเรียน</option>
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
                      🎈 ลิงก์แฟ้มรายงานตัวชี้วัด PA ที่เครื่องคณะกรรมการเปิดดูได้: <br />
                      <span className="font-mono text-amber-600 font-semibold select-all break-all">
                        {window.location.origin}/?p={regSlug || "(ชื่อลิงก์)"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || (regType === "teacher" && !regSchool)}
                    className="w-full flex justify-center items-center gap-2 py-3 bg-amber-500 border-none rounded-xl text-slate-950 font-sans text-sm font-semibold shadow-md hover:bg-amber-400 transition-colors cursor-pointer focus:outline-shadow disabled:opacity-50"
                    id="reg-submit-btn"
                  >
                    {isLoading ? "กำลังประมวลผลคำขอ..." : "ดำเนินการสมัครสิทธิ์ส่งขออนุมัติ"}
                  </button>
                </form>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
