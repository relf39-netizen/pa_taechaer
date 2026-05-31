import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, School, Landmark, Phone, Globe, BookOpen, Clock, 
  CheckCircle2, Plus, Trash2, FileText, ExternalLink, Save, 
  Eye, Check, AlertCircle, Sparkles, LogOut, Code, Library
} from "lucide-react";
import { Teacher, TeacherData, PAIndicator, PACleaningChallenge, EvidenceLink } from "../types";
import PublicProfile from "./PublicProfile";

interface TeacherDashboardProps {
  initialData: TeacherData;
  onLogout: () => void;
}

export default function TeacherDashboard({ initialData, onLogout }: TeacherDashboardProps) {
  const [data, setData] = useState<TeacherData>(initialData);
  const [activeMenu, setActiveMenu] = useState<"profile" | "part1" | "part2" | "preview" | "school_manage">("part1");
  
  // Profile edit state
  const [name, setName] = useState(data.teacher.name);
  const [position, setPosition] = useState(data.teacher.position);
  const [school, setSchool] = useState(data.teacher.school);
  const [affiliation, setAffiliation] = useState(data.teacher.affiliation);
  const [phone, setPhone] = useState(data.teacher.phone);
  const [academicYear, setAcademicYear] = useState(data.teacher.academicYear);

  // Active Part 1 indicator state
  const [selectedIndId, setSelectedIndId] = useState<string>("1.1");
  const [indDescription, setIndDescription] = useState(data.indicators["1.1"]?.description || "");
  const [indStatus, setIndStatus] = useState<'not_started' | 'in_progress' | 'completed'>(data.indicators["1.1"]?.status || "not_started");
  const [indLinks, setIndLinks] = useState<EvidenceLink[]>(data.indicators["1.1"]?.evidenceLinks || []);

  // New Link temporary input state
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  // Part 2 Challenge state
  const [chalTitle, setChalTitle] = useState(data.challenge?.title || "");
  const [chalProblem, setChalProblem] = useState(data.challenge?.problemContext || "");
  const [chalProcess, setChalProcess] = useState(data.challenge?.process || "");
  const [chalQuant, setChalQuant] = useState(data.challenge?.quantitativeOutput || "");
  const [chalQual, setChalQual] = useState(data.challenge?.qualitativeOutput || "");
  const [chalStatus, setChalStatus] = useState<'not_started' | 'in_progress' | 'completed'>(data.challenge?.status || "not_started");
  const [chalLinks, setChalLinks] = useState<EvidenceLink[]>(data.challenge?.evidenceLinks || []);

  // School Admin states
  const [directorName, setDirectorName] = useState("");
  const [committeeMembers, setCommitteeMembers] = useState<{ id: string; name: string; title: string }[]>([]);
  const [schoolTeachers, setSchoolTeachers] = useState<Teacher[]>([]);
  const [isSchoolLoading, setIsSchoolLoading] = useState(false);
  const [newCommName, setNewCommName] = useState("");
  const [newCommTitle, setNewCommTitle] = useState("ผู้ทรงคุณวุฒิ");

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Trigger brief alert
  const triggerToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Fetch school configuration data
  const loadSchoolConfiguration = async () => {
    if (!data.teacher.schoolSmissCode) return;
    setIsSchoolLoading(true);
    try {
      const sRes = await fetch("/api/schools");
      const sData = await sRes.json();
      if (sData.success) {
        const mySchool = sData.schools?.find((s: any) => s.smissCode === data.teacher.schoolSmissCode);
        if (mySchool) {
          setDirectorName(mySchool.directorName || "");
          setCommitteeMembers(mySchool.paCommitteeMembers || []);
        }
      }

      const tRes = await fetch(`/api/school/teachers?smissCode=${data.teacher.schoolSmissCode}`);
      const tData = await tRes.json();
      if (tData.success) {
        setSchoolTeachers(tData.teachers || []);
      }
    } catch (e) {
      console.error("Error loading admin school tools:", e);
    } finally {
      setIsSchoolLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeMenu === "school_manage") {
      loadSchoolConfiguration();
    }
  }, [activeMenu]);

  // Save Committee & Director
  const handleSaveCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/school/committee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smissCode: data.teacher.schoolSmissCode,
          directorName,
          paCommitteeMembers: committeeMembers
        })
      });
      const resData = await res.json();
      if (res.ok) {
        triggerToast("success", "บันทึกรายชื่อผู้อำนวยการและกรรรมการประเมิน PA เรียบร้อยเเล้ว");
      } else {
        throw new Error(resData.message || "เกิดข้อผิดพลาด");
      }
    } catch (err: any) {
      triggerToast("error", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Add Committee member tag
  const handleAddCommitteeMember = () => {
    if (!newCommName.trim()) {
      triggerToast("error", "กรุณากรอกชื่อ-นามสกุลกรรมการประเมิน");
      return;
    }
    const newM = {
      id: "comm-" + Date.now(),
      name: newCommName.trim(),
      title: newCommTitle
    };
    setCommitteeMembers(prev => [...prev, newM]);
    setNewCommName("");
  };

  // Remove Committee member tag
  const handleRemoveCommitteeMember = (id: string) => {
    setCommitteeMembers(prev => prev.filter(m => m.id !== id));
  };

  // Update School Teacher approval state status 
  const handleUpdateTeacherStatus = async (teacherId: string, status: string) => {
    try {
      const res = await fetch("/api/school/teachers/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          status,
          smissCode: data.teacher.schoolSmissCode
        })
      });
      const resData = await res.json();
      if (res.ok) {
        triggerToast("success", resData.message || "ดำเนินการเสร็จสิ้น");
        setSchoolTeachers(prev => prev.map(t => t.id === teacherId ? { ...t, status } : t));
      } else {
        throw new Error(resData.message || "เกิดข้อผิดพลาดในการเปลี่ยนสิทธิ์");
      }
    } catch (err: any) {
      triggerToast("error", err.message);
    }
  };

  // 1. Update Profile API
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/teachers/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: data.teacher.id,
          name,
          position,
          school,
          affiliation,
          phone,
          academicYear
        }),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message || "อัปเดตล้มเหลว");
      
      setData(prev => ({
        ...prev,
        teacher: responseData.teacher
      }));
      triggerToast("success", "บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว");
    } catch (err: any) {
      triggerToast("error", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Load new selected indicator details
  const handleSelectIndicator = (id: string) => {
    setSelectedIndId(id);
    const ind = data.indicators[id];
    setIndDescription(ind?.description || "");
    setIndStatus(ind?.status || "not_started");
    setIndLinks(ind?.evidenceLinks || []);
    setNewLinkName("");
    setNewLinkUrl("");
  };

  // 2. Add Indicator Link
  const handleAddIndLink = () => {
    if (!newLinkName.trim() || !newLinkUrl.trim()) {
      triggerToast("error", "กรุณาระบุชื่อหลักฐาน และที่อยู่ลิงก์ให้ถูกต้อง");
      return;
    }
    const newLink: EvidenceLink = {
      id: "ev-" + Date.now(),
      name: newLinkName.trim(),
      url: newLinkUrl.trim()
    };
    setIndLinks(prev => [...prev, newLink]);
    setNewLinkName("");
    setNewLinkUrl("");
  };

  // Remove Indicator Link
  const handleRemoveIndLink = (linkId: string) => {
    setIndLinks(prev => prev.filter(l => l.id !== linkId));
  };

  // 3. Save Active Indicator API
  const handleSaveIndicator = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/indicators/${selectedIndId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: data.teacher.id,
          description: indDescription,
          status: indStatus,
          evidenceLinks: indLinks
        }),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message || "บันทึกตัวชี้วัดล้มเหลว");

      setData(prev => {
        const copy = { ...prev.indicators };
        copy[selectedIndId] = responseData.indicator;
        return {
          ...prev,
          indicators: copy
        };
      });
      triggerToast("success", `บันทึกข้อมูลตัวชี้วัดที่ ${selectedIndId} สำเร็จ`);
    } catch (err: any) {
      triggerToast("error", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Add Challenge Link
  const handleAddChalLink = () => {
    if (!newLinkName.trim() || !newLinkUrl.trim()) {
      triggerToast("error", "กรุณาระบุชื่อหลักฐาน และที่อยู่ลิงก์ให้ถูกต้อง");
      return;
    }
    const newLink: EvidenceLink = {
      id: "ev-chal-" + Date.now(),
      name: newLinkName.trim(),
      url: newLinkUrl.trim()
    };
    setChalLinks(prev => [...prev, newLink]);
    setNewLinkName("");
    setNewLinkUrl("");
  };

  // Remove Challenge Link
  const handleRemoveChalLink = (linkId: string) => {
    setChalLinks(prev => prev.filter(l => l.id !== linkId));
  };

  // 5. Save Challenge API
  const handleSaveChallenge = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/challenge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: data.teacher.id,
          title: chalTitle,
          problemContext: chalProblem,
          process: chalProcess,
          quantitativeOutput: chalQuant,
          qualitativeOutput: chalQual,
          status: chalStatus,
          evidenceLinks: chalLinks
        }),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message || "บันทึกข้อมูลประเด็นท้าทายล้มเหลว");

      setData(prev => ({
        ...prev,
        challenge: responseData.challenge
      }));
      triggerToast("success", "บันทึกประเด็นท้าทาย (ส่วนที่ 2) เรียบร้อยแล้ว");
    } catch (err: any) {
      triggerToast("error", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const copyPublicLink = () => {
    const publicUrl = `${window.location.origin}/?p=${data.teacher.slug}`;
    navigator.clipboard.writeText(publicUrl);
    triggerToast("success", "คัดลอกจากลิงก์สาธารณะเรียบร้อย! สามารถส่งให้คณะกรรมการได้ทันที");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f1f5f9] text-slate-850 font-sans">
      {/* Toast Warning */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 16 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg border text-sm font-sans flex items-center gap-2 ${
              toast.type === "success" 
                ? "bg-green-50 text-green-800 border-green-200" 
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
            id="toast-notification"
          >
            {toast.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header - Geometric Balance Styling with Yellow bottom border */}
      <header className="bg-[#1e3a8a] border-b-4 border-b-[#facc15] text-white shadow-md sticky top-0 z-45">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#facc15] text-[#1e3a8a] p-2.5 rounded-lg font-bold font-sans text-xl shadow-inner">PA</div>
            <div>
              <h1 className="font-sans font-semibold text-lg leading-snug">
                ระบบจัดการระดับคุณครู: บันทึกประเมินผลการปฏิบัติงาน
              </h1>
              <span className="text-xs text-blue-200 font-sans flex items-center gap-1.5 mt-0.5">
                <School className="w-3.5 h-3.5 text-[#facc15]" />
                {data.teacher.school} &bull; สังกัด {data.teacher.affiliation}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={copyPublicLink}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#facc15] hover:bg-[#ebd113] text-[#1e3a8a] rounded-lg transition-all shadow-sm cursor-pointer border-none"
              id="copy-pa-link-header"
            >
              <Globe className="w-3.5 h-3.5" />
              คัดลอกลิงก์คณะกรรมการ
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-450 hover:text-white border border-rose-500/30 hover:bg-rose-600/30 rounded-lg transition-all cursor-pointer"
              id="logout-btn"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      {/* Secondary Sub Header for teacher summary */}
      <section className="bg-white border-b border-[#e2e8f0] py-3.5 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-slate-600 text-xs font-sans">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="bg-slate-50 text-slate-800 px-3 py-1 rounded-md border border-[#e2e8f0] font-medium" id="teacher-profile-badge">
              <strong>ผู้บันทึก:</strong> {data.teacher.name}
            </div>
            <div>
              <strong>ตำแหน่ง:</strong> {data.teacher.position}
            </div>
            <div>
              <strong>ปีงบประมาณ:</strong> พ.ศ. {data.teacher.academicYear}
            </div>
          </div>
          <div className="text-blue-700 font-bold font-mono text-xs select-all bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1">
            Link: {window.location.origin}/?p={data.teacher.slug}
          </div>
        </div>
      </section>

      {/* Main Panel Content with Sidebar & Form Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar Controls */}
        <section className="lg:col-span-3 flex flex-col gap-2">
          <div className="bg-white rounded-lg shadow-sm border border-[#e2e8f0] overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-[#e2e8f0] font-semibold text-sm text-slate-800">
              เมนูบริหารข้อตกลง PA
            </div>
            <div className="p-2 space-y-1">
              <button
                onClick={() => setActiveMenu("part1")}
                className={`w-full text-left px-4 py-2.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 border-none cursor-pointer ${activeMenu === "part1" ? "bg-[#e0f1fe] text-[#0369a1] border-l-4 border-l-[#0284c7] font-semibold" : "text-slate-600 hover:bg-slate-50"}`}
                id="menu-part1"
              >
                <BookOpen className="w-4 h-4" />
                ส่วนที่ 1: ตาราง 15 ตัวชี้วัด
              </button>
              <button
                onClick={() => setActiveMenu("part2")}
                className={`w-full text-left px-4 py-2.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 border-none cursor-pointer ${activeMenu === "part2" ? "bg-[#e0f1fe] text-[#0369a1] border-l-4 border-l-[#0284c7] font-semibold" : "text-slate-600 hover:bg-slate-50"}`}
                id="menu-part2"
              >
                <Sparkles className="w-4 h-4" />
                ส่วนที่ 2: ประเด็นท้าทาย (Challenge)
              </button>
              <button
                onClick={() => setActiveMenu("profile")}
                className={`w-full text-left px-4 py-2.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 border-none cursor-pointer ${activeMenu === "profile" ? "bg-[#e0f1fe] text-[#0369a1] border-l-4 border-l-[#0284c7] font-semibold" : "text-slate-600 hover:bg-slate-50"}`}
                id="menu-profile"
              >
                <User className="w-4 h-4" />
                ตั้งค่าข้อมูลประวัติตนเอง
              </button>
              <button
                onClick={() => setActiveMenu("preview")}
                className={`w-full text-left px-4 py-2.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 border-none cursor-pointer ${activeMenu === "preview" ? "bg-[#e0f1fe] text-[#0369a1] border-l-4 border-l-[#0284c7] font-semibold" : "text-slate-600 hover:bg-slate-50"}`}
                id="menu-preview"
              >
                <Eye className="w-4 h-4" />
                ดูตัวอย่างหน้าคณะกรรมการ (Live)
              </button>

              {data.teacher.role === "school_admin" && (
                <button
                  onClick={() => setActiveMenu("school_manage")}
                  className={`w-full text-left px-4 py-2.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 border-none cursor-pointer ${activeMenu === "school_manage" ? "bg-amber-100 text-amber-900 border-l-4 border-l-amber-500 font-semibold" : "text-amber-800 hover:bg-amber-50/60"}`}
                  id="menu-school-manage"
                >
                  <School className="w-4 h-4 text-amber-600" />
                  จัดการข้อมูลโรงเรียนและอนุมัติคุณครู
                </button>
              )}
            </div>
          </div>

          <div className="bg-[#1e3a8a] text-white p-4.5 rounded-lg text-xs space-y-2 border-l-4 border-l-[#facc15]">
            <h4 className="font-semibold text-[#facc15] flex items-center gap-1">💡 คำแนะนำการยื่นประเมิน</h4>
            <p className="text-blue-100 leading-relaxed font-sans">
              การจัดทำข้อตกลงในการพัฒนางาน (PA) จะต้องได้รับความเห็นชอบรวมถึงลงบันทึกในระบบก่อน เพื่อให้คณะกรรมการสามารถเข้าตรวจสอบและดาวน์โหลดหลักฐานได้ตามกลุ่มสาระการเรียนรู้ต่างๆ
            </p>
          </div>
        </section>

        {/* WORK CARD EDITOR AREA */}
        <section className="lg:col-span-9 flex flex-col">
          
          {/* TAB 1: PART 1 INDICATORS EDITOR */}
          {activeMenu === "part1" && (
            <div className="bg-white rounded-lg shadow-sm border border-[#e2e8f0] overflow-hidden flex flex-col md:flex-row flex-1 min-h-[500px]">
              
              {/* Left Side Indicators Slider */}
              <div className="w-full md:w-64 bg-slate-50 border-r border-[#e2e8f0] p-2.5 space-y-1 overflow-y-auto max-h-[600px] md:max-h-none">
                <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  ด้านการจัดการเรียนรู้ (1.1 - 1.8)
                </div>
                {["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8"].map((id) => (
                  <button
                    key={id}
                    onClick={() => handleSelectIndicator(id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center justify-between transition-all cursor-pointer border-none ${
                      selectedIndId === id 
                        ? "bg-[#eff6ff] text-[#1e40af] border-l-2 border-l-[#1e40af] font-semibold" 
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{id} {data.indicators[id]?.title.substring(0, 16)}...</span>
                    {data.indicators[id]?.status === "completed" && <CheckCircle2 className="w-3.5 h-3.5 text-green-600 ml-1" />}
                    {data.indicators[id]?.status === "in_progress" && <Clock className="w-3.5 h-3.5 text-yellow-600 ml-1" />}
                  </button>
                ))}

                <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-4">
                  ด้านร่วมส่งเสริมเรียนรู้ (2.1 - 2.4)
                </div>
                {["2.1", "2.2", "2.3", "2.4"].map((id) => (
                  <button
                    key={id}
                    onClick={() => handleSelectIndicator(id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center justify-between transition-all cursor-pointer border-none ${
                      selectedIndId === id 
                        ? "bg-[#eff6ff] text-[#1e40af] border-l-2 border-l-[#1e40af] font-semibold" 
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{id} {data.indicators[id]?.title?.substring(0, 16)}...</span>
                    {data.indicators[id]?.status === "completed" && <CheckCircle2 className="w-3.5 h-3.5 text-green-600 ml-1" />}
                    {data.indicators[id]?.status === "in_progress" && <Clock className="w-3.5 h-3.5 text-yellow-600 ml-1" />}
                  </button>
                ))}

                <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-4">
                  ด้านการพัฒนาตนเองและวิชาชีพ (3.1 - 3.3)
                </div>
                {["3.1", "3.2", "3.3"].map((id) => (
                  <button
                    key={id}
                    onClick={() => handleSelectIndicator(id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center justify-between transition-all cursor-pointer border-none ${
                      selectedIndId === id 
                        ? "bg-[#eff6ff] text-[#1e40af] border-l-2 border-l-[#1e40af] font-semibold" 
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{id} {data.indicators[id]?.title?.substring(0, 16)}...</span>
                    {data.indicators[id]?.status === "completed" && <CheckCircle2 className="w-3.5 h-3.5 text-green-600 ml-1" />}
                    {data.indicators[id]?.status === "in_progress" && <Clock className="w-3.5 h-3.5 text-yellow-600 ml-1" />}
                  </button>
                ))}
              </div>

              {/* Right Side Indicator Editor Panel Form */}
              <div className="flex-1 p-6 space-y-6">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1e40af] uppercase tracking-wider mb-2">
                    {data.indicators[selectedIndId]?.aspect}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-[#1e3a8a] text-[#facc15] font-semibold px-2.5 py-0.5 rounded-md text-sm">{selectedIndId}</span>
                    {data.indicators[selectedIndId]?.title}
                  </h3>
                </div>

                {/* Performance input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    รายละเอียดการปฏิบัติงานตามตัวชี้วัด (Description / Work Done)
                  </label>
                  <textarea
                    rows={6}
                    value={indDescription}
                    onChange={(e) => setIndDescription(e.target.value)}
                    placeholder="กรอกรายละเอียดสอดคล้องกับคุณสมบัติตัวชี้วัด (เช่น มีการจัดทำโครงสร้างรายวิชา มีเอกสารอ้างอิงบทเรียนออนไลน์เพื่อพัฒนานักเรียน...)"
                    className="block w-full p-3.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] text-sm font-sans placeholder-slate-400"
                    id="ind-description-textarea"
                  />
                </div>

                {/* Status Toggle buttons */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2.5">
                    สถานะการทำงาน (Performance Status)
                  </label>
                  <div className="flex gap-2">
                    {[
                      { key: "not_started", label: "ยังไม่ได้เริ่ม", color: "border-[#e2e8f0] text-slate-500 hover:bg-slate-50 bg-white" },
                      { key: "in_progress", label: "กำลังดำเนินการ", color: "border-yellow-300 text-yellow-800 bg-yellow-50" },
                      { key: "completed", label: "ดำเนินการสำเร็จแล้ว", color: "border-green-300 text-green-800 bg-green-50" }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.key}
                        onClick={() => setIndStatus(item.key as any)}
                        className={`px-4 py-2 border text-xs font-semibold rounded-md transition-all border-solid cursor-pointer ${
                          indStatus === item.key 
                            ? "bg-[#1e3a8a] text-white border-[#1e3a8a]" 
                            : item.color
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Evidence Links addition and List view */}
                <div className="space-y-3.5">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    ลิงก์แหล่งที่เก็บหลักฐานและร่องรอยอ้างอิง (Evidence Links)
                  </label>
                  
                  {/* Link display lists */}
                  {indLinks.length === 0 ? (
                    <div className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-md border border-dashed border-[#e2e8f0]">
                      ยังไม่มีการบันทึกเอกสารสรุปผลงาน/ลิงก์หลักฐานอ้างอิงของคุณครู
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {indLinks.map((link) => (
                        <div 
                          key={link.id} 
                          className="flex items-center justify-between p-2.5 bg-slate-50 rounded-md border border-[#e2e8f0] text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-450" />
                            <span className="font-semibold text-slate-700">{link.name}</span>
                            <span className="text-slate-400 text-[10px] truncate max-w-xs">&bull; {link.url}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-slate-500 hover:text-slate-900 inline-block p-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveIndLink(link.id)}
                              className="text-rose-550 hover:text-rose-650 p-1 border-none bg-transparent cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add form */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-[#e2e8f0] grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                    <div className="md:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        ชื่อหลักฐานอ้างอิง
                      </label>
                      <input
                        type="text"
                        value={newLinkName}
                        onChange={(e) => setNewLinkName(e.target.value)}
                        placeholder="เช่น แผนการจัดการเรียนรู้/ผลงานนักเรียน"
                        className="block w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-xs"
                      />
                    </div>
                    <div className="md:col-span-6">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        ที่อยู่ลิงก์หลักฐาน (Google Drive, OneDrive, etc.)
                      </label>
                      <input
                        type="text"
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="block w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-xs"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddIndLink}
                        className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold border-none cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        เพิ่มลิงก์
                      </button>
                    </div>
                  </div>
                </div>

                {/* Save main action */}
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveIndicator}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold border-none cursor-pointer shadow-sm select-all"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? "กำลังบันทึก..." : "บันทึกตัวชี้วัดนี้"}
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: PART 2 CHALLENGE EDITOR */}
          {activeMenu === "part2" && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">ส่วนที่ 2 (แบบฟอร์มการประเมิน PA)</span>
                <h3 className="text-xl font-bold text-slate-800">
                  ข้อตกลงประเด็นท้าทายเพื่อพัฒนาผลสัมฤทธิ์เรียนรู้ผู้เรียน
                </h3>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  ประเด็นท้าทายในการพัฒนาผลผลลัพธ์การเรียนรู้ของผู้เรียน จะต้องกรอกรายละเอียดครอบคลุมปัญหา วิธีดำเนินการ และคำอธิบายความคาดหวังเชิงสัมฤทธิ์
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    ๑. หัวข้อประเด็นท้าทาย (Challenge Issue Title)
                  </label>
                  <input
                    type="text"
                    value={chalTitle}
                    onChange={(e) => setChalTitle(e.target.value)}
                    placeholder="เช่น การแก้ปัญหาผลสัมฤทธิ์ทางการเรียนและการคิดแก้ปัญหารายวิชาฟิสิกส์ชั้น ม.4"
                    className="block w-full p-3.5 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    ๒. สภาพปัญหาการจัดการเรียนรู้และคุณภาพการเรียนรู้ของผู้เรียน (Problem Context / Backing issues)
                  </label>
                  <textarea
                    rows={4}
                    value={chalProblem}
                    onChange={(e) => setChalProblem(e.target.value)}
                    placeholder="โรงเรียนมีเป้าหมาย หรือการจัดการเรียนการสอนแบบวิทยาประยุกต์เดิมที่ทำให้นักเรียนเข้าใจเนื้อหายาก..."
                    className="block w-full p-3.5 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    ๓. วิธีการดำเนินงานให้บรรลุผล (Process description of activities)
                  </label>
                  <textarea
                    rows={4}
                    value={chalProcess}
                    onChange={(e) => setChalProcess(e.target.value)}
                    placeholder="1. ออกแบบกระบวนการวิศวกรรมการเรียนการสอนเชิงลึก (Active Learning) ร่วมสัปดาห์..."
                    className="block w-full p-3.5 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      ๔. ผลลัพธ์เชิงปริมาณ (Quantitative Outcomes)
                    </label>
                    <textarea
                      rows={4}
                      value={chalQuant}
                      onChange={(e) => setChalQuant(e.target.value)}
                      placeholder="นักเรียนร้อยละ 80 มีเกรดผลคะแนนการรักษาระเบียบทักษะระดับผ่านและดีเยี่ยม..."
                      className="block w-full p-3.5 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      ๕. ผลลัพธ์เชิงคุณภาพ (Qualitative Outcomes)
                    </label>
                    <textarea
                      rows={4}
                      value={chalQual}
                      onChange={(e) => setChalQual(e.target.value)}
                      placeholder="นักเรียนรู้จักการเชื่อมโยงระบบการประยุกต์ใช้งานวิชาการกับกระบวนการกลุ่มอย่างเข้าใจจริง..."
                      className="block w-full p-3.5 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Challenge general status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2.5">
                    ระดับความก้าวหน้าประเด็นท้าทาย
                  </label>
                  <div className="flex gap-2">
                    {[
                      { key: "not_started", label: "ยังไม่ได้เริ่ม", color: "border-slate-200 text-slate-500" },
                      { key: "in_progress", label: "กำลังดำเนินการ", color: "border-amber-300 text-amber-700 bg-amber-50" },
                      { key: "completed", label: "สำเร็จร้อยละ 100", color: "border-emerald-300 text-emerald-700 bg-emerald-50" }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.key}
                        onClick={() => setChalStatus(item.key as any)}
                        className={`px-4 py-2 border text-xs font-semibold rounded-lg transition-all border-solid cursor-pointer ${
                          chalStatus === item.key 
                            ? "bg-slate-900 text-white border-slate-900" 
                            : item.color
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Evidence links for Part 2 */}
                <div className="space-y-3 pt-3">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    เอกสารหลักฐานประกอบประเด็นท้าทาย (Evidence Links for Challenge)
                  </label>

                  {chalLinks.length === 0 ? (
                    <div className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200">
                      ยังไม่มีการแนบลิงก์หลักฐานประเด็นท้าทาย
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {chalLinks.map((link) => (
                        <div 
                          key={link.id} 
                          className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-150 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span className="font-semibold">{link.name}</span>
                            <span className="text-slate-400 text-[10px] truncate max-w-xs">&bull; {link.url}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-slate-500 hover:text-slate-900 inline-block p-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveChalLink(link.id)}
                              className="text-rose-500 hover:text-rose-600 p-1 border-none bg-transparent cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-slate-50/50 p-4.5 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                    <div className="md:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5">
                        ชื่อหลักฐานประเด็นท้าทาย
                      </label>
                      <input
                        type="text"
                        value={newLinkName}
                        onChange={(e) => setNewLinkName(e.target.value)}
                        placeholder="เช่น เล่มรายงานวิจัยหน้าเดียว"
                        className="block w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-xs"
                      />
                    </div>
                    <div className="md:col-span-6">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5">
                        ที่อยู่ลิงก์หลักฐาน (Google Drive/YouTube/Docs)
                      </label>
                      <input
                        type="text"
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="block w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-xs"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddChalLink}
                        className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold border-none cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        เพิ่มลิงก์
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveChallenge}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold border-none cursor-pointer shadow-sm select-all"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? "กำลังรวบรวม..." : "บันทึกประเด็นท้าทายทั้งหมด"}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: PERSONAL PROFILE EDITOR */}
          {activeMenu === "profile" && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-800">ตั้งค่าประวัติตนเอง</h3>
                <p className="text-xs text-slate-500">ข้อมูลเหล่านี้และวิทยฐานะจะถูกแสดงให้คณะกรรมการเห็นในแถบหัวเรื่องรายงานประเมินผล</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      ชื่อ-นามสกุลครูผู้ยื่นข้อตกลง
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      วิทยฐานะปัจจุบัน
                    </label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
                    >
                      <option value="ครู ค.ศ. 1 (ไม่มีวิทยฐานะ)">ครู ค.ศ. 1 (ไม่มีวิทยฐานะ)</option>
                      <option value="ครูวิทยฐานะชำนาญการ">ครูวิทยฐานะชำนาญการ</option>
                      <option value="ครูวิทยฐานะชำนาญการพิเศษ">ครูวิทยฐานะชำนาญการพิเศษ</option>
                      <option value="ครูวิทยฐานะเชี่ยวชาญ">ครูวิทยฐานะเชี่ยวชาญ</option>
                      <option value="ครูวิทยฐานะเชี่ยวชาญพิเศษ">ครูวิทยฐานะเชี่ยวชาญพิเศษ</option>
                      <option value="ครูผู้ช่วย">ครูผู้ช่วย</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      สถาบันศึกษา / โรงเรียน
                    </label>
                    <input
                      type="text"
                      required
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      สังกัดหน่วยงานการศึกษา
                    </label>
                    <input
                      type="text"
                      required
                      value={affiliation}
                      onChange={(e) => setAffiliation(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      เบอร์โทรศัพท์มือถือ
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      ปีงบประมาณประเมินผล
                    </label>
                    <select
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
                    >
                      <option value="2569">2569</option>
                      <option value="2568">2568</option>
                      <option value="2567">2567</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans text-xs font-bold border-none rounded-xl cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? "กำลังเซฟ..." : "บันทึกข้อมูลประวัติผู้ใช้งาน"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: SCHOOL ADMIN MANAGEMENT CONTROL PANEL */}
          {activeMenu === "school_manage" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-750 to-indigo-900 text-white p-6 rounded-xl shadow-md border-b-4 border-[#facc15]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#facc15] text-[#1e3a8a] rounded-lg">
                      <School className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold font-sans">
                        แผงควบคุมระบบจัดตั้งและบริหารโรงเรียน
                      </h2>
                      <p className="text-xs text-blue-100 font-sans mt-0.5">
                        โรงเรียนสังกัด: {data.teacher.school} &bull; รหัส SMISS: {data.teacher.schoolSmissCode}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={loadSchoolConfiguration}
                    className="self-start sm:self-auto px-3.5 py-1.5 bg-white/10 hover:bg-white/25 text-white border-none text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    🔄 รีเฟรชฐานข้อมูลครู
                  </button>
                </div>
              </div>

              {isSchoolLoading ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-amber-500 border-r-transparent mb-3"></div>
                  <p className="text-sm text-slate-500">กำลังโหลดฐานข้อมูลโรงเรียนและรายชื่อสมาชิกครู...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* LEFT COLUMN: COMMITTEE & DIRECTOR FOR PA */}
                  <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="pb-3 border-b border-slate-100 mb-4">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          👨‍⚖️ คณะกรรมการประเมินข้อตกลง PA
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-1">
                          ผู้อำนวยการและคณะกรรมการชุดนี้ จะถูกดึงไปแสดงในหน้าพอร์ตโฟลิโอแฟ้มสะสมผลงานด้านกรรมการของครูทุกคนในโรงเรียน
                        </p>
                      </div>

                      <form onSubmit={handleSaveCommittee} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            ผู้อำนวยการโรงเรียน (ประธานคณะกรรมการ) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={directorName}
                            onChange={(e) => setDirectorName(e.target.value)}
                            placeholder="เช่น นายสมยศ รักเรียน (ผอ.โรงเรียน)"
                            className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-sans"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-2">
                            รายชื่อกรรมการร่วมประเมิน (เพิ่มเติม)
                          </label>

                          {committeeMembers.length === 0 ? (
                            <div className="text-[11px] text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200 text-center">
                              ยังไม่มีรายชื่อคณะกรรมการร่วมประเมินเพิ่มเติม
                            </div>
                          ) : (
                            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                              {committeeMembers.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-150 text-xs">
                                  <div>
                                    <span className="font-semibold text-slate-800">{member.name}</span>
                                    <span className="ml-1.5 text-[10px] bg-slate-200 text-slate-705 px-1.5 py-0.5 rounded">
                                      {member.title}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCommitteeMember(member.id)}
                                    className="text-rose-500 hover:text-rose-600 p-1 border-none bg-transparent cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Quick Add committee member */}
                          <div className="mt-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                ชื่อ-นามสกุล และวิทยฐานะกรรมการหลัก
                              </label>
                              <input
                                type="text"
                                value={newCommName}
                                onChange={(e) => setNewCommName(e.target.value)}
                                placeholder="เช่น ดร.วิทยา ใจแข็ง (ศึกษานิเทศก์ชำนาญการ)"
                                className="block w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                  ตำแหน่งในบอร์ด
                                </label>
                                <select
                                  value={newCommTitle}
                                  onChange={(e) => setNewCommTitle(e.target.value)}
                                  className="block w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                >
                                  <option value="ผู้ทรงคุณวุฒิ">ผู้ทรงคุณวุฒิ</option>
                                  <option value="ผู้ทรงคุณวุฒิภายนอก">ผู้ทรงคุณวุฒิภายนอก</option>
                                  <option value="ศึกษานิเทศก์">ศึกษานิเทศก์</option>
                                  <option value="กรรมการร่วม">กรรมการร่วม</option>
                                </select>
                              </div>
                              <div className="flex items-end">
                                <button
                                  type="button"
                                  onClick={handleAddCommitteeMember}
                                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border-none cursor-pointer"
                                >
                                  เพิ่มเข้ารายชื่อ
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex justify-end">
                          <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-1 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs border-none cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            {isSaving ? "กำลังบันทึก..." : "บันทึกตั้งค่ากรรมการ & ผอ."}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: AFFILIATED TEACHERS LIST */}
                  <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="pb-3 border-b border-slate-105 mb-4">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          👥 รายชื่อคุณครูผู้สมัครเข้าใช้ระบบสังกัดโรงเรียนของท่าน ({schoolTeachers.length} คน)
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-1">
                          คุณต้องอนุมัติสิทธิ์ให้ครูในเครือข่ายเปิดใช้งาน หรือสามารถระงับสิทธิ์ชั่วคราวได้ตลอดเวลาเพื่อความปลอดภัย
                        </p>
                      </div>

                      {schoolTeachers.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 italic font-sans text-xs">
                          ยังไม่มีบัญชีคุณครูสังกัดรหัส SMISS เดียวกันขึ้นทะเบียนในระบบ
                        </div>
                      ) : (
                        <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                          {schoolTeachers.map((teacher) => (
                            <div 
                              key={teacher.id} 
                              className="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800 text-sm">
                                    {teacher.name}
                                  </span>
                                  {teacher.status === "approved" ? (
                                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      อนุมัติแล้ว
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                      รอการตรวจสอบ
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-sans space-y-0.5">
                                  <p>วิทยฐานะ: {teacher.position}</p>
                                  <p className="font-mono">อีเมล: {teacher.email} &bull; เบอร์โทร: {teacher.phone || "-"}</p>
                                  <p className="text-amber-600 font-semibold break-all">
                                    ลิงก์รายงาน PA: <a href={`/?p=${teacher.slug}`} target="_blank" rel="noreferrer" className="underline hover:text-amber-700">/?p={teacher.slug}</a>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 sm:self-center">
                                {teacher.status !== "approved" ? (
                                  <button
                                    onClick={() => handleUpdateTeacherStatus(teacher.id, "approved")}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold border-none cursor-pointer shadow-sm"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    อนุมัติสิทธิ์
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUpdateTeacherStatus(teacher.id, "pending")}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-205 cursor-pointer"
                                  >
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    ระงับสิทธิ์ชั่วคราว
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 4: PUBLIC PREVIEW */}
          {activeMenu === "preview" && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white p-4.5 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-amber-400">👀 กำลังมองเห็นหน้าตัวอย่างในรูปแบบที่คณะกรรมการประเมินเห็นจริง</h4>
                  <p className="text-[11px] text-slate-400">นี่คือความสมบูรณ์ที่ปรากฏต่อผู้อื่นเมื่อนำเสนองานประเมินผลสภากองโรงเรียน</p>
                </div>
                <button
                  onClick={copyPublicLink}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-900 border-none px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  คัดลอกลิงก์คณะประเมิน
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner p-2">
                <PublicProfile 
                  slug={data.teacher.slug} 
                  initialProvidedTeacherData={{ teacher: data.teacher, data: data }} 
                />
              </div>
            </div>
          )}

        </section>

      </main>
    </div>
  );
}
