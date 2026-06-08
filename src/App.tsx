import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Award, Globe, Sparkles, LogIn, Shield, Users, School, 
  ExternalLink, ArrowRight, CheckCircle2, ChevronRight, BookOpen
} from "lucide-react";
import { Teacher, TeacherData } from "./types";
import AuthPage from "./components/AuthPage";
import TeacherDashboard from "./components/TeacherDashboard";
import PublicProfile from "./components/PublicProfile";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  // Navigation Routing States
  const [currentView, setCurrentView] = useState<"home" | "auth" | "dashboard" | "admin" | "public_profile">("home");
  const [publicSlug, setPublicSlug] = useState<string | null>(null);

  // Auth States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTeacherData, setActiveTeacherData] = useState<TeacherData | null>(null);

  // List of active teachers for demonstration on home page
  const [demoTeachers, setDemoTeachers] = useState<Teacher[]>([]);

  // 1. URL Query Parameter Sniffer
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pSlug = params.get("p") || params.get("slug");
    
    if (pSlug) {
      setPublicSlug(pSlug);
      setCurrentView("public_profile");
    } else {
      // Check for active logged in user in standard localStorage for persistency
      const stored = localStorage.getItem("pa_user");
      const storedData = localStorage.getItem("pa_teacher_data");
      
      if (stored) {
        try {
          const parsedUser = JSON.parse(stored);
          setCurrentUser(parsedUser);
          if (parsedUser.role === "admin") {
            setCurrentView("admin");
          } else {
            setCurrentView("dashboard");
            if (storedData) {
              setActiveTeacherData(JSON.parse(storedData));
            }
          }
        } catch (e) {
          localStorage.removeItem("pa_user");
        }
      }
    }

    // Always fetch teacher demography for homepage list
    fetch("/api/teachers")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setDemoTeachers(resData.teachers);
        }
      })
      .catch((err) => console.error("Error loading teachers demo list:", err));
  }, []);

  const handleLoginSuccess = (user: any, data: any) => {
    setCurrentUser(user);
    localStorage.setItem("pa_user", JSON.stringify(user));
    if (user.role === "admin") {
      setCurrentView("admin");
    } else {
      setActiveTeacherData(data);
      localStorage.setItem("pa_teacher_data", JSON.stringify(data));
      setCurrentView("dashboard");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTeacherData(null);
    localStorage.removeItem("pa_user");
    localStorage.removeItem("pa_teacher_data");
    setCurrentView("home");
    
    // Refresh demo lists
    fetch("/api/teachers")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setDemoTeachers(resData.teachers);
        }
      });
  };

  const navigateToHomeFromPublic = () => {
    // Clean URL query parameter so we don't reload to profile
    const newUrl = window.location.origin + window.location.pathname;
    window.history.pushState({}, document.title, newUrl);
    setPublicSlug(null);
    setCurrentView("home");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-amber-100">
      
      {/* 1. PUBLIC PROFILE LAYER */}
      {currentView === "public_profile" && publicSlug && (
        <PublicProfile 
          slug={publicSlug} 
          onBackToSystem={navigateToHomeFromPublic} 
          onLoginToEdit={() => {
            const newUrl = window.location.origin + window.location.pathname;
            window.history.pushState({}, document.title, newUrl);
            setPublicSlug(null);
            setCurrentView("auth");
          }}
        />
      )}

      {/* 2. SECURITY AUTH LAYER */}
      {currentView === "auth" && (
        <AuthPage 
          onLoginSuccess={handleLoginSuccess} 
          onNavigateHome={() => setCurrentView("home")} 
        />
      )}

      {/* 3. ACTIVE TEACHER WORK STATION PANEL */}
      {currentView === "dashboard" && activeTeacherData && (
        <TeacherDashboard 
          initialData={activeTeacherData} 
          onLogout={handleLogout} 
        />
      )}

      {/* 4. ACTIVE CENTRAL ADMINISTRATION PANEL */}
      {currentView === "admin" && (
        <AdminPanel 
          onLogout={handleLogout} 
        />
      )}

      {/* 5. IMMERSIVE THAI PORTAL LANDING PAGE */}
      {currentView === "home" && (
        <div className="flex flex-col min-h-screen bg-[#f1f5f9]">
          
          {/* Main Hero Header - Geometric Balance Styling with Yellow bottom border */}
          <header className="bg-[#1e3a8a] text-white relative py-16 md:py-24 px-6 overflow-hidden border-b-4 border-b-[#facc15] shadow-md animate-fade-in">
            <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-24 translate-x-12">
              <Award className="w-[600px] h-[600px] text-white" />
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-20">
              
              {/* Product value statement */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-1.5 bg-[#facc15]/10 text-[#facc15] px-3.5 py-1 rounded-full text-xs font-semibold border border-[#facc15]/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  สพฐ. PERFORMANCE AGREEMENT (PA)
                </div>
                
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-white mb-2">
                  ระบบบันทึกผลการประเมิน <br />
                  <span className="text-[#facc15]">ข้อตกลงในการพัฒนางาน (PA)</span> <br />
                  ของข้าราชการครู
                </h1>
                
                <p className="text-blue-100 text-sm md:text-base leading-relaxed max-w-2xl">
                  เครื่องมือบันทึกความก้าวหน้าตามเกณฑ์ตัวชี้วัด 3 ด้าน (15 ตัวชี้วัดมาตรฐานและแบบประเมินประเด็นท้าทาย) สำหรับข้าราชการครูกระทรวงศึกษาธิการ เพื่อสร้างพอร์ตสะสมผลงานอิงลิงก์อัตโนมัติจัดส่งแก่คณะกรรมการประเมิน
                </p>

                <div className="flex flex-wrap gap-3.5 pt-2">
                  <button
                    onClick={() => setCurrentView("auth")}
                    className="flex items-center gap-2 px-6 py-3 bg-[#facc15] hover:bg-[#ebd113] text-[#1e3a8a] font-bold text-sm rounded-lg cursor-pointer shadow transition-all duration-150 hover:-translate-y-0.5"
                    id="home-register-btn"
                  >
                    สมัครขอลิงก์ใช้งานใหม่
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentView("auth")}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-850 hover:bg-blue-800 text-white font-bold text-sm rounded-lg cursor-pointer border border-blue-700/60 transition-all duration-150 hover:bg-blue-900/50"
                    id="home-login-btn"
                  >
                    <LogIn className="w-4 h-4 text-[#facc15]" />
                    เข้าสู่ระบบบันทึก (แก้ไขข้อมูล)
                  </button>
                </div>
              </div>

              {/* Quick interactive lookup dashboard preview of active links */}
              <div className="lg:col-span-5 bg-[#172554] border border-blue-950/65 p-6 md:p-8 rounded-lg shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider mb-2">
                    <Users className="w-5 h-5 text-[#facc15]" />
                    รายชื่อคุณครูที่พร้อมรับการตรวจประเมิน
                  </h3>
                  <p className="text-xs text-blue-200 border-none leading-relaxed">
                    คุณกรรมการของสพฐ.หรือโรงเรียน สามารถคลิกอ้างอิงชื่อลิงก์เพื่อเข้าตรวจสอบข้อมูลและหลักฐานตัวชี้วัดได้ทันที
                  </p>
                </div>

                <div className="my-5 divide-y divide-blue-900/50 max-h-[220px] overflow-y-auto pr-1">
                  {demoTeachers.length === 0 ? (
                    <p className="text-xs text-blue-300 italic py-4">กำลังเตรียมรายชื่อคุณครูนำเสนอ...</p>
                  ) : (
                    demoTeachers.map((t) => (
                      <div key={t.id} className="py-2.5 flex items-center justify-between text-xs border-b border-blue-900/30">
                        <div>
                          <strong className="text-slate-100 block">{t.name}</strong>
                          <span className="text-[10px] text-blue-300">{t.school}</span>
                        </div>
                        <a 
                          href={`/?p=${t.slug}`}
                          className="flex items-center gap-1 font-mono text-[#facc15] hover:text-yellow-300 font-semibold hover:underline"
                        >
                          /{t.slug}
                          <ChevronRight className="w-3 h-3" />
                        </a>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-4 border-t border-blue-900 text-[11px] text-blue-200 flex justify-between items-center bg-transparent">
                  <span>ผู้จัดทำ: คณะทำงานโรงเรียนข้าราชการยึดสมรรถนะ</span>
                  <Award className="w-4 h-4 text-[#facc15]" />
                </div>
              </div>

            </div>
          </header>

          {/* Guidelines Section with Feature descriptions & Demo credentials */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Left Columns: Features / Guideline Info */}
            <div className="md:col-span-8 space-y-8">
              <div>
                <h3 className="font-extrabold text-2xl text-slate-900">องค์ประกอบระบบบันทึกข้อตกลง PA</h3>
                <p className="text-sm text-slate-500">ค่านิยมปฏิบัติงานตามหลักเกณฑ์สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน (กระทรวงศึกษาธิการ)</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* feature 1 */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-[#e2e8f0] flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="bg-[#eff6ff] text-[#1e40af] p-2.5 rounded-lg">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <h4 className="font-bold text-slate-800 text-sm">การบันทึกตัวชี้วัดระดับตำแหน่ง</h4>
                    <p className="text-slate-500 leading-relaxed">
                      แบ่งประเภทแบบฟอร์มการประเมินออกเป็น 15 ตัวชี้วัดเชิงวิทยาศาสตร์ (3 ด้าน) มีช่องบันทึกอธิบายผลการปฏิบัติและปุ่มแนบเอกสารอย่างทันสมัย
                    </p>
                  </div>
                </div>

                {/* feature 2 */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-[#e2e8f0] flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="bg-[#eff6ff] text-[#1e40af] p-2.5 rounded-lg">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <h4 className="font-bold text-slate-800 text-sm">บันทึกประเด็นท้าทาย (ส่วนที่ 2)</h4>
                    <p className="text-slate-500 leading-relaxed">
                      แบบฟอร์มตั้งสมมติฐานและสภาพปัญหากลุ่มตัวอย่างนักเรียน การคำนวณเชิงปริมาณและผลสัมฤทธิ์เชิงเลขาเชิงคุณภาพสอดคล้องกับรายงานสถานศึกษา
                    </p>
                  </div>
                </div>

                {/* feature 3 */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-[#e2e8f0] flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="bg-[#eff6ff] text-[#1e40af] p-2.5 rounded-lg">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <h4 className="font-bold text-slate-800 text-sm">ลิงก์ประเมินผลสาธารณะโดยอัตโนมัติ</h4>
                    <p className="text-slate-500 leading-relaxed">
                      ส่งต่อลิงก์เฉพาะของคุณครูให้วิทยฐานะกรรมการผ่านโซเชียล โดยเปิดอ่านบนเว็บได้ทันทีผ่านคอมพิวเตอร์ แท็บเล็ต หรือมือถือ สวยงามรวดเร็ว
                    </p>
                  </div>
                </div>

                {/* feature 4 */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-[#e2e8f0] flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="bg-[#eff6ff] text-[#1e40af] p-2.5 rounded-lg">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <h4 className="font-bold text-slate-800 text-sm">ส่วนควบคุมดูแลระบบแอดมิน</h4>
                    <p className="text-slate-500 leading-relaxed">
                      ผู้บริหารหรือแอดมินจำลองตรวจการอนุมัติสิทธิ์ พร้อมทั้งรวบรวมพิมพ์หรือสกรีนสคริปต์สำรองข้อมูล MySQL ไปใช้จริงในเครือข่ายสถานศึกษา
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column: Demo credential details - styled elegant white card with blue accent border-l-4 */}
            <div className="md:col-span-4 bg-white text-slate-800 p-6 rounded-lg shadow-sm border border-[#e2e8f0] border-l-4 border-l-[#1e3a8a] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#1e40af]" />
                  <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider leading-none">ทดสอบสิทธิ์สาธิต</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ผู้มาทดสอบระบบสามารถใช้ความลื่นไหลด้วยสิทธิ์บัญชีคุณครูและดูแลระบบแนะนําดังนี้ เพื่อประหยัดเวลาการประเมิน:
                </p>

                <div className="p-3 bg-slate-50 rounded-lg space-y-2 border border-[#e2e8f0] text-xs">
                  <span className="font-bold text-[#1e40af] block border-b border-[#e2e8f0] pb-1">สำหรับเข้าแก้ไขข้อมูลครู (Teacher)</span>
                  <p className="font-mono text-[11px] leading-relaxed text-slate-600">
                    เลขประจำตัวประชาชน: <span className="underline select-all text-slate-900 font-semibold">1234567890123</span> <br />
                    รหัสผ่าน: <span className="text-slate-900 font-medium">อะไรก็ได้</span> (เช่น 1234)
                  </p>
                  <p className="font-mono text-[11px] leading-relaxed mt-1 text-slate-600">
                    เลขประจำตัวประชาชน: <span className="underline select-all text-slate-900 font-semibold">9876543210987</span> <br />
                    รหัสผ่าน: <span className="text-slate-900 font-medium">อะไรก็ได้</span>
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg space-y-2 border border-[#e2e8f0] text-xs">
                  <span className="font-bold text-[#1e40af] block border-b border-[#e2e8f0] pb-1">สำหรับผู้ดูแลควบคุมสถานศึกษา (Admin)</span>
                  <p className="font-mono text-[11px] leading-relaxed text-slate-600">
                    ชื่อผู้ใช้: <span className="underline select-all text-slate-900 font-semibold">admin</span> <br />
                    รหัสผ่าน: <span className="underline select-all text-slate-900 font-semibold">admin123</span>
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 text-[10px] text-slate-400">
                ระบบจัดการระดับคุณครู สพฐ. พัฒนาถูกต้องด้วยโครงสร้างฟังก์ชั่น 100%
              </div>
            </div>

          </main>

          {/* Footer of the Portal app - Navy elegant */}
          <footer className="bg-slate-900 text-white py-8 border-t border-slate-800 text-center text-xs">
            <div className="max-w-7xl mx-auto px-6 space-y-1">
              <p>&copy; ระบบแฟ้มสะสมข้อตกลงในการพัฒนางาน (PA) ข้าราชการครู สพฐ.</p>
              <p className="text-slate-400 text-[10px]">สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน กระทรวงศึกษาธิการ ประเทศไทย</p>
            </div>
          </footer>

        </div>
      )}

    </div>
  );
}
