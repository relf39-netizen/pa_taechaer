import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, School, Landmark, Phone, Globe, BookOpen, Clock, 
  CheckCircle2, FileText, ExternalLink, Sparkles, Award, 
  Check, AlertCircle, ChevronDown, ChevronUp, Download, PlayCircle, X, Image as ImageIcon, FileCheck
} from "lucide-react";
import { Teacher, TeacherData, PAIndicator, PACleaningChallenge, EvidenceLink } from "../types";

interface PublicProfileProps {
  slug: string;
  initialProvidedTeacherData?: {
    teacher: Teacher;
    data: TeacherData;
  } | null;
  onBackToSystem?: () => void;
  onLoginToEdit?: () => void;
  isEvaluatorView?: boolean;
}

export interface ThemePreset {
  id: string;
  name: string;
  primaryBg: string;      // Tailwind bg class
  primaryText: string;    // Tailwind text class
  borderBg: string;       // Tailwind border class
  accentText: string;     // Tailwind text class
  accentBg: string;       // Tailwind bg class
  accentLight: string;    // Tailwind bg class for slate/hover
  badgeBg: string;        // Tailwind badge bg
  buttonActiveBg: string; // Tailwind background button state
  buttonActiveBorder: string; // Tailwind border button state
  hoverColor: string;     // Tailwind hover state
  sidebarActiveBg: string;
  sidebarActiveText: string;
  sidebarActiveBorder: string;
}

export const THEMES: Record<string, ThemePreset> = {
  blue: {
    id: "blue",
    name: "น้ำเงินภูมิฐาน (Default)",
    primaryBg: "bg-[#1e3a8a]",
    primaryText: "text-[#1e3a8a]",
    borderBg: "border-b-[#facc15]",
    accentText: "text-[#facc15]",
    accentBg: "bg-[#facc15]",
    accentLight: "bg-[#eff6ff]",
    badgeBg: "bg-[#172554]",
    buttonActiveBg: "bg-[#1e3a8a]",
    buttonActiveBorder: "border-[#1e3a8a]",
    hoverColor: "hover:bg-[#1e3a8a]/10",
    sidebarActiveBg: "bg-[#e0f1fe]",
    sidebarActiveText: "text-[#0369a1]",
    sidebarActiveBorder: "border-l-[#0284c7]"
  },
  green: {
    id: "green",
    name: "เขียวขจีวิชาการ",
    primaryBg: "bg-[#064e3b]",
    primaryText: "text-[#064e3b]",
    borderBg: "border-b-[#fbbf24]",
    accentText: "text-[#fbbf24]",
    accentBg: "bg-[#fbbf24]",
    accentLight: "bg-[#ecfdf5]",
    badgeBg: "bg-[#022c22]",
    buttonActiveBg: "bg-[#064e3b]",
    buttonActiveBorder: "border-[#064e3b]",
    hoverColor: "hover:bg-[#064e3b]/10",
    sidebarActiveBg: "bg-[#d1fae5]",
    sidebarActiveText: "text-[#065f46]",
    sidebarActiveBorder: "border-l-[#047857]"
  },
  purple: {
    id: "purple",
    name: "ม่วงอัญชันมงคล",
    primaryBg: "bg-[#4c1d95]",
    primaryText: "text-[#4c1d95]",
    borderBg: "border-b-[#facc15]",
    accentText: "text-[#facc15]",
    accentBg: "bg-[#facc15]",
    accentLight: "bg-[#f5f3ff]",
    badgeBg: "bg-[#2e1065]",
    buttonActiveBg: "bg-[#4c1d95]",
    buttonActiveBorder: "border-[#4c1d95]",
    hoverColor: "hover:bg-[#4c1d95]/10",
    sidebarActiveBg: "bg-[#ede9fe]",
    sidebarActiveText: "text-[#5b21b6]",
    sidebarActiveBorder: "border-l-[#6d28d9]"
  },
  amber: {
    id: "amber",
    name: "แสดประเสริฐศรัทธา",
    primaryBg: "bg-[#78350f]",
    primaryText: "text-[#78350f]",
    borderBg: "border-b-[#fbbf24]",
    accentText: "text-[#fbbf24]",
    accentBg: "bg-[#fbbf24]",
    accentLight: "bg-[#fffbeb]",
    badgeBg: "bg-[#451a03]",
    buttonActiveBg: "bg-[#78350f]",
    buttonActiveBorder: "border-[#78350f]",
    hoverColor: "hover:bg-[#78350f]/10",
    sidebarActiveBg: "bg-[#fef3c7]",
    sidebarActiveText: "text-[#92400e]",
    sidebarActiveBorder: "border-l-[#b45309]"
  },
  slate: {
    id: "slate",
    name: "เทาโมเดิร์นทันสมัย",
    primaryBg: "bg-[#1e293b]",
    primaryText: "text-[#1e293b]",
    borderBg: "border-b-[#38bdf8]",
    accentText: "text-[#38bdf8]",
    accentBg: "bg-[#38bdf8]",
    accentLight: "bg-[#f8fafc]",
    badgeBg: "bg-[#0f172a]",
    buttonActiveBg: "bg-[#1e293b]",
    buttonActiveBorder: "border-[#1e293b]",
    hoverColor: "hover:bg-[#1e293b]/10",
    sidebarActiveBg: "bg-[#f1f5f9]",
    sidebarActiveText: "text-[#334155]",
    sidebarActiveBorder: "border-l-[#475569]"
  },
  rose: {
    id: "rose",
    name: "ชมพูกุหลาบวิวัฒนา",
    primaryBg: "bg-[#881337]",
    primaryText: "text-[#881337]",
    borderBg: "border-b-[#facc15]",
    accentText: "text-[#facc15]",
    accentBg: "bg-[#facc15]",
    accentLight: "bg-[#fff1f2]",
    badgeBg: "bg-[#4c0519]",
    buttonActiveBg: "bg-[#881337]",
    buttonActiveBorder: "border-[#881337]",
    hoverColor: "hover:bg-[#881337]/10",
    sidebarActiveBg: "bg-[#ffe4e6]",
    sidebarActiveText: "text-[#9f1239]",
    sidebarActiveBorder: "border-l-[#be123c]"
  }
};

export default function PublicProfile({ 
  slug, 
  initialProvidedTeacherData, 
  onBackToSystem, 
  onLoginToEdit,
  isEvaluatorView = false
}: PublicProfileProps) {
  const [profileData, setProfileData] = useState<TeacherData | null>(
    initialProvidedTeacherData ? initialProvidedTeacherData.data : null
  );
  const [teacher, setTeacher] = useState<Teacher | null>(
    initialProvidedTeacherData ? initialProvidedTeacherData.teacher : null
  );
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(!initialProvidedTeacherData);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"part1" | "part2">("part1");
  const [openIndicatorId, setOpenIndicatorId] = useState<string | null>("1.1");

  // Indicator Showcase Modal State (For the whole indicator details)
  const [selectedIndForModal, setSelectedIndForModal] = useState<PAIndicator | null>(null);
  const [showIndModal, setShowIndModal] = useState(false);

  // Evidence Showcase Modal State (For a specific link/file)
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceLink | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleOpenIndicatorModal = (ind: PAIndicator) => {
    setSelectedIndForModal(ind);
    setShowIndModal(true);
  };

  const handleOpenEvidence = (link: EvidenceLink) => {
    // If it's a PDF, we might want to open directly in some cases, 
    // but the user asked for a pop-up that shows PDF nicely.
    setSelectedEvidence(link);
    setShowModal(true);
  };

  // Fetch teacher data by slug if not already provided
  useEffect(() => {
    if (initialProvidedTeacherData) {
      setTeacher(initialProvidedTeacherData.teacher);
      setProfileData(initialProvidedTeacherData.data);
      setIsLoading(false);
      
      // Set page title to teacher's name
      if (initialProvidedTeacherData.teacher.name) {
        document.title = `Portfolio: ${initialProvidedTeacherData.teacher.name} | PA System`;
      }
      return;
    }

    const fetchTeacherDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/teachers/slug/${slug}`);
        const resData = await res.json();
        if (!res.ok) {
          throw new Error(resData.message || "ไม่สามารถดึงข้อมูลรายงานการประเมินได้");
        }
        setTeacher(resData.teacher);
        setProfileData(resData.data);
        
        // Fetch school info for committee members
        if (resData.teacher?.schoolSmissCode) {
          const sRes = await fetch("/api/schools");
          const sData = await sRes.json();
          if (sData.success) {
            const mySchool = sData.schools?.find((s: any) => s.smissCode === resData.teacher.schoolSmissCode);
            if (mySchool) {
              setSchoolInfo(mySchool);
            }
          }
        }
        
        // Set page title to teacher's name
        if (resData.teacher?.name) {
          document.title = `Portfolio: ${resData.teacher.name} | PA System`;
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeacherDetails();
  }, [slug, initialProvidedTeacherData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-600 font-sans">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold">กำลังกำลังดาวน์โหลดแฟ้มสะสมรายงานข้อตกลง PA ของคุณครู...</p>
        </div>
      </div>
    );
  }

  if (error || !teacher || !profileData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800 font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 shadow-lg">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold">ไม่พบหน้าผลการประเมิน</h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              {error || "ไม่พบร่องรอยการบันทึกข้อมูลของคุณครูในสาสารระบบนี้ หรือลิงก์ดังกล่าวยังไม่ได้รับอนุมัติสื่อนำเสนอ"}
            </p>
          </div>
          {onBackToSystem && (
            <button
              onClick={onBackToSystem}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors border-none cursor-pointer"
            >
              กลับสู่สารเลือกระบบ
            </button>
          )}
        </div>
      </div>
    );
  }

  // Count helper statistics
  const indicatorsArray = Object.values(profileData.indicators) as PAIndicator[];
  const totalIndicators = indicatorsArray.length || 15;
  const completedCount = indicatorsArray.filter(i => i.status === "completed").length;
  const inProgressCount = indicatorsArray.filter(i => i.status === "in_progress").length;
  const notStartedCount = indicatorsArray.filter(i => i.status === "not_started" || !i.status).length;

  const getSmartIcon = (url: string) => {
    const lower = url.toLowerCase();
    if (lower.includes("drive.google.com") || lower.includes("dropbox.com") || lower.includes("one_drive")) {
      return <Award className="w-4 h-4 text-emerald-600" />;
    }
    if (lower.includes("youtube.com") || lower.includes("youtu.be") || lower.includes("vimeo")) {
      return <PlayCircle className="w-4 h-4 text-rose-600" />;
    }
    return <FileText className="w-4 h-4 text-blue-600" />;
  };

  const resolvedTheme = THEMES[teacher.themeColor || "blue"] || THEMES.blue;

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 font-sans pb-16 animate-fade-in">
      
      {/* Top Utility Header for Public Visitors & Educators */}
      <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-3 text-xs font-sans">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block animate-pulse"></span>
            <span className="text-slate-300 font-medium">ระบบรายงานข้อตกลงในการพัฒนางาน (PA) &bull; แฟ้มสะสมงานดิจิทัลเพื่อเลื่อนวิทยฐานะ</span>
          </div>
          <div className="flex items-center gap-2.5">
            {onBackToSystem && !isEvaluatorView && (
              <button
                onClick={onBackToSystem}
                className="text-slate-300 hover:text-white bg-transparent border-none cursor-pointer transition-colors text-xs font-semibold"
              >
                🏠 กลับสารบบหลัก
              </button>
            )}
            {onBackToSystem && !isEvaluatorView && <span className="text-slate-700 hidden sm:inline">|</span>}
            {onLoginToEdit && !isEvaluatorView && (
              <button
                onClick={onLoginToEdit}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg border-none cursor-pointer scale-95 md:scale-100 hover:scale-[1.02] transform transition-all text-xs flex items-center gap-1"
              >
                🔑 เข้าสู่ระบบเพื่อแก้ไขแผงรายงาน PA นี้
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Top Banner Cover For Educator - Geometric Balance with Deep Blue background and Gold highlight border */}
      <section 
        className={`${resolvedTheme.primaryBg} text-white pt-10 pb-20 px-6 relative overflow-hidden border-b-4 ${resolvedTheme.borderBg} shadow-md animate-fade-in`}
        style={teacher.headerImage ? { backgroundImage: `url(${teacher.headerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        {teacher.headerImage && <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px]"></div>}
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-6">
          <Award className="w-[400px] h-[400px] text-white" />
        </div>

        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* User Avatar Circle uploadable / customizable */}
            <div className={`w-24 h-24 rounded-full border-4 border-white overflow-hidden ${resolvedTheme.accentBg} flex-shrink-0 shadow-md flex items-center justify-center`}>
              {teacher.avatarImage ? (
                <img referrerPolicy="no-referrer" src={teacher.avatarImage} alt={teacher.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-800 font-sans font-bold text-3xl">
                  {teacher.name ? teacher.name.replaceAll("ครู", "").trim().charAt(0) : "ค"}
                </div>
              )}
            </div>

            <div className="space-y-2.5 text-center sm:text-left">
              <span className={`inline-block ${resolvedTheme.accentBg} ${resolvedTheme.accentText === "text-[#facc15]" || resolvedTheme.accentText === "text-[#fbbf24]" || resolvedTheme.accentText === "text-[#38bdf8]" ? "text-slate-950" : "text-white"} text-[11px] font-bold px-3 py-1 rounded-md shadow-sm`}>
                แฟ้มสะสมรายงานประเมินผลข้อตกลง PA
              </span>
              <div className="space-y-1">
                <h1 className="text-3xl font-extrabold leading-tight text-white">{teacher.name}</h1>
                <p className="text-slate-200 font-medium text-sm leading-relaxed">{teacher.position}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-slate-100">
                <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <School className="w-4 h-4 text-white/90" />
                  <span>โรงเรียน: <strong className="text-white">{teacher.school}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <Landmark className="w-4 h-4 text-white/90" />
                  <span>สังกัดเขตพื้นที่: {teacher.affiliation}</span>
                </div>
                {teacher.phone && (
                  <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                    <Phone className="w-4 h-4 text-white/90" />
                    <span>โทร: {teacher.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`${resolvedTheme.badgeBg} border border-white/10 p-5 rounded-lg flex flex-col items-center justify-center min-w-[180px] text-center shadow-md backdrop-blur-sm self-stretch md:self-auto`}>
            <span className="text-xs text-slate-300">ปีงบประมาณการประเมิน PA</span>
            <span className="text-3xl font-extrabold text-white mt-1">พ.ศ. {teacher.academicYear}</span>
            <div className="w-full h-px bg-white/15 my-2.5 font-sans"></div>
            <span className="text-[10px] text-green-300 font-semibold flex items-center gap-1.5 leading-none">
              <span className="w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse"></span>
              ขึ้นทะเบียนพร้อมตรวจสอบ
            </span>
          </div>
        </div>
      </section>

      {/* Gauges Panel & Tab Toggles overlay card */}
      <section className="max-w-5xl mx-auto px-4 -mt-10 relative z-30">
        <div className="bg-white rounded-lg shadow-sm border border-[#e2e8f0] p-5 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          
          {/* Quick Metrics */}
          <div className="md:col-span-5 flex flex-col justify-center space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800">สรุปสถานะความคืบหน้าของ 15 ตัวชี้วัด</h3>
              <p className="text-[11px] text-slate-500">ผลงานการปฏิบัติงานทีพร้อมรับการตรวจประเมิน</p>
            </div>

            {/* Micro Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">สำเร็จความสมบูรณ์</span>
                <span className="text-slate-800">{completedCount} จาก 15 ตัวชี้วัด ({Math.round((completedCount/totalIndicators)*100)}%)</span>
              </div>
              <div className="w-full h-3.5 bg-slate-100 rounded-lg overflow-hidden flex">
                <div 
                  className="bg-green-600 h-full transition-all duration-550" 
                  style={{ width: `${(completedCount/totalIndicators)*100}%` }}
                ></div>
                <div 
                  className="bg-[#facc15] h-full transition-all duration-550" 
                  style={{ width: `${(inProgressCount/totalIndicators)*100}%` }}
                ></div>
              </div>
            </div>

            {/* Badges explanation */}
            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="bg-green-50 border border-green-200 px-2 py-1.5 rounded-lg">
                <span className="block text-green-800 font-bold text-base">{completedCount}</span>
                <span className="text-[10px] text-green-600">สำเร็จ</span>
              </div>
              <div className="bg-yellow-50 border border-yellow-250 px-2 py-1.5 rounded-lg">
                <span className="block text-yellow-800 font-bold text-base">{inProgressCount}</span>
                <span className="text-[10px] text-yellow-700">กำลังทํา</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-lg">
                <span className="block text-slate-705 font-bold text-base">{notStartedCount}</span>
                <span className="text-[10px] text-slate-500">ยังไม่เริ่ม</span>
              </div>
            </div>
          </div>

          <div className="hidden md:block w-px bg-[#e2e8f0] h-full md:col-span-1 self-center justify-self-center"></div>

          {/* Tab Selector Buttons */}
          <div className="md:col-span-6 flex flex-col justify-center space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800">เครื่องมือเลือกดูรายละเอียด</h3>
              <p className="text-[11px] text-slate-500">เลือกดูรายงานด้านปฏิบัติงานตามมาตรฐานตัวชี้วัดหรือรายงานประเด็นท้าทาย</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setActiveTab("part1")}
                className={`flex-1 py-3 text-sm font-semibold rounded-lg border cursor-pointer transition-all ${
                  activeTab === "part1" 
                    ? "bg-[#1e3a8a] border-[#1e3a8a] text-white shadow" 
                    : "bg-white border-[#e2e8f0] hover:bg-slate-50 text-slate-700"
                }`}
                id="public-tab-part1"
              >
                ส่วนที่ 1: ตาราง 15 ตัวชี้วัด
              </button>
              <button
                onClick={() => setActiveTab("part2")}
                className={`flex-1 py-3 text-sm font-semibold rounded-lg border cursor-pointer transition-all ${
                  activeTab === "part2" 
                    ? "bg-[#1e3a8a] border-[#1e3a8a] text-white shadow" 
                    : "bg-white border-[#e2e8f0] hover:bg-slate-50 text-slate-700"
                }`}
                id="public-tab-part2"
              >
                ส่วนที่ 2: ข้อปฏิบัติประเด็นท้าทาย
              </button>
            </div>
          </div>

        </div>

        {/* TAB 1 CONTENT: 15 INDICATORS ACCORDIONS */}
        {activeTab === "part1" && (
          <div className="space-y-6">
            
            {/* Aspect 1 Group */}
            <div className="space-y-3.5">
              <div className="p-4 bg-[#1e3a8a] text-[#facc15] rounded-lg font-bold text-xs uppercase tracking-wide flex justify-between items-center border-l-4 border-l-[#facc15]">
                <span>ด้านที่ 1: ด้านการจัดการเรียนรู้ (8 ตัวชี้วัด)</span>
                <span className="text-[10px] bg-blue-950 text-blue-200 rounded px-2 py-0.5 font-normal">ข้อ 1.1 - 1.8</span>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-[#e2e8f0] overflow-hidden divide-y divide-[#e2e8f0]">
                {["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8"].map((id) => {
                  const ind = profileData.indicators[id];
                  const isOpen = openIndicatorId === id;
                  if (!ind) return null;

                  return (
                    <div key={id} className="transition-colors hover:bg-slate-50/40">
                      <button
                        onClick={() => setOpenIndicatorId(isOpen ? null : id)}
                        className="w-full px-5 py-4 text-left flex items-center justify-between border-none bg-transparent cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                            ตัวชี้วัด {id}
                          </span>
                          <span className="text-sm font-semibold text-slate-800 text-left line-clamp-1">{ind.title}</span>
                        </div>
                        <div className="flex items-center gap-3 ml-2 text-blue-600">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenIndicatorModal(ind);
                            }}
                            className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg shadow-sm transition-all transform hover:scale-105 border-none cursor-pointer"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            เปิดดูงาน
                          </button>
                          {ind.status === "completed" && (
                            <span className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-150">
                              <CheckCircle2 className="w-3 h-3" /> สำเร็จแล้ว
                            </span>
                          )}
                          {ind.status === "in_progress" && (
                            <span className="hidden sm:flex items-center gap-1 text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-150">
                              <Clock className="w-3 h-3" /> กำลังดำเนินการ
                            </span>
                          )}
                          {!ind.status || ind.status === "not_started" && (
                            <span className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded-full border border-slate-150">
                              ยังไม่ได้เริ่ม
                            </span>
                          )}
                          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 space-y-4 font-sans bg-slate-50/50">
                          <div className="p-4 bg-white rounded-xl border border-slate-150 text-sm leading-relaxed text-slate-700 whitespace-pre-line shadow-sm">
                            {ind.description ? ind.description : (
                              <span className="text-slate-400 italic">คุณครูยังไม่ได้บันทึกรายละเอียดการดำเนินงานในรายงานตัวชี้วัดนี้</span>
                            )}
                          </div>

                          {/* Evidence link items */}
                          <div className="space-y-2">
                            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              ลิงก์หลักฐานอ้างอิงและเอกสารแนบ
                            </h5>
                            {ind.evidenceLinks.length === 0 ? (
                              <p className="text-xs text-slate-400 italic font-sans pl-1">ไม่มีไฟล์อ้างอิงหรือเครื่องยืนยันแนบไว้</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {ind.evidenceLinks.map((link) => (
                                  <button
                                    key={link.id}
                                    onClick={() => handleOpenEvidence(link)}
                                    className="flex items-center justify-between p-3.5 bg-white border border-slate-200 hover:border-blue-500 text-slate-800 rounded-xl hover:shadow-md transition-all text-xs group cursor-pointer text-left w-full"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-blue-50 transition-colors">
                                        {link.displayMode === 'activity' ? <ImageIcon className="w-4 h-4 text-blue-600" /> : 
                                         link.displayMode === 'certificate' ? <Award className="w-4 h-4 text-amber-600" /> :
                                         link.displayMode === 'document' || link.url.toLowerCase().endsWith('.pdf') ? <FileText className="w-4 h-4 text-rose-600" /> :
                                         getSmartIcon(link.url)}
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">{link.name}</span>
                                        {link.displayMode && (
                                          <span className="text-[10px] text-slate-500 capitalize">{link.displayMode === 'activity' ? 'ภาพกิจกรรม' : link.displayMode === 'certificate' ? 'เกียรติบัตร' : 'เอกสาร'}</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-500">
                                      <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">ดูรายละเอียด</span>
                                      <ChevronDown className="w-4 h-4 -rotate-90" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Aspect 2 Group */}
            <div className="space-y-3.5">
              <div className="p-4 bg-[#1e3a8a] text-[#facc15] rounded-lg font-bold text-xs uppercase tracking-wide flex justify-between items-center border-l-4 border-l-[#facc15]">
                <span>ด้านที่ 2: ด้านการส่งเสริมและสนับสนุนการจัดการเรียนรู้ (4 ตัวชี้วัด)</span>
                <span className="text-[10px] bg-blue-950 text-blue-200 rounded px-2 py-0.5 font-normal">ข้อ 2.1 - 2.4</span>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-[#e2e8f0] overflow-hidden divide-y divide-[#e2e8f0]">
                {["2.1", "2.2", "2.3", "2.4"].map((id) => {
                  const ind = profileData.indicators[id];
                  const isOpen = openIndicatorId === id;
                  if (!ind) return null;

                  return (
                    <div key={id} className="transition-colors hover:bg-slate-50/40">
                      <button
                        onClick={() => setOpenIndicatorId(isOpen ? null : id)}
                        className="w-full px-5 py-4 text-left flex items-center justify-between border-none bg-transparent cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                            ตัวชี้วัด {id}
                          </span>
                          <span className="text-sm font-semibold text-slate-800 text-left line-clamp-1">{ind.title}</span>
                        </div>
                        <div className="flex items-center gap-3 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenIndicatorModal(ind);
                            }}
                            className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg shadow-sm transition-all transform hover:scale-105 border-none cursor-pointer"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            เปิดดูงาน
                          </button>
                          {ind.status === "completed" && (
                            <span className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-150">
                              <CheckCircle2 className="w-3 h-3" /> สำเร็จแล้ว
                            </span>
                          )}
                          {ind.status === "in_progress" && (
                            <span className="hidden sm:flex items-center gap-1 text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-150">
                              <Clock className="w-3 h-3" /> กำลังดำเนินการ
                            </span>
                          )}
                          {!ind.status || ind.status === "not_started" && (
                            <span className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded-full border border-slate-150">
                              ยังไม่ได้เริ่ม
                            </span>
                          )}
                          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 space-y-4 font-sans bg-slate-50/50">
                          <div className="p-4 bg-white rounded-xl border border-slate-150 text-sm leading-relaxed text-slate-700 whitespace-pre-line shadow-sm">
                            {ind.description ? ind.description : (
                              <span className="text-slate-400 italic">คุณครูยังไม่ได้บันทึกรายละเอียดการดำเนินงานในรายงานตัวชี้วัดนี้</span>
                            )}
                          </div>

                          {/* Evidence link items */}
                          <div className="space-y-2">
                            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              ลิงก์หลักฐานอ้างอิงและเอกสารแนบ
                            </h5>
                            {ind.evidenceLinks.length === 0 ? (
                              <p className="text-xs text-slate-400 italic font-sans pl-1">ไม่มีไฟล์อ้างอิงหรือเครื่องยืนยันแนบไว้</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {ind.evidenceLinks.map((link) => (
                                  <button
                                    key={link.id}
                                    onClick={() => handleOpenEvidence(link)}
                                    className="flex items-center justify-between p-3.5 bg-white border border-slate-200 hover:border-blue-500 text-slate-800 rounded-xl hover:shadow-md transition-all text-xs group cursor-pointer text-left w-full"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-blue-50 transition-colors">
                                        {link.displayMode === 'activity' ? <ImageIcon className="w-4 h-4 text-blue-600" /> : 
                                         link.displayMode === 'certificate' ? <Award className="w-4 h-4 text-amber-600" /> :
                                         link.displayMode === 'document' || link.url.toLowerCase().endsWith('.pdf') ? <FileText className="w-4 h-4 text-rose-600" /> :
                                         getSmartIcon(link.url)}
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">{link.name}</span>
                                        {link.displayMode && (
                                          <span className="text-[10px] text-slate-500 capitalize">{link.displayMode === 'activity' ? 'ภาพกิจกรรม' : link.displayMode === 'certificate' ? 'เกียรติบัตร' : 'เอกสาร'}</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-500">
                                      <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">ดูรายละเอียด</span>
                                      <ChevronDown className="w-4 h-4 -rotate-90" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Aspect 3 Group */}
            <div className="space-y-3.5">
              <div className={`p-4 ${resolvedTheme.primaryBg} text-white rounded-lg font-bold text-xs uppercase tracking-wide flex justify-between items-center border-l-4 ${resolvedTheme.borderBg}`}>
                <span>ด้านที่ 3: ด้านการพัฒนาตนเองและวิชาชีพ (3 ตัวชี้วัด)</span>
                <span className="text-[10px] bg-black/25 text-white/90 rounded px-2 py-0.5 font-normal">ข้อ 3.1 - 3.3</span>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-[#e2e8f0] overflow-hidden divide-y divide-[#e2e8f0]">
                {["3.1", "3.2", "3.3"].map((id) => {
                  const ind = profileData.indicators[id];
                  const isOpen = openIndicatorId === id;
                  if (!ind) return null;

                  return (
                    <div key={id} className="transition-colors hover:bg-slate-50/40">
                      <button
                        onClick={() => setOpenIndicatorId(isOpen ? null : id)}
                        className="w-full px-5 py-4 text-left flex items-center justify-between border-none bg-transparent cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                            ตัวชี้วัด {id}
                          </span>
                          <span className="text-sm font-semibold text-slate-800 text-left line-clamp-1">{ind.title}</span>
                        </div>
                        <div className="flex items-center gap-3 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenIndicatorModal(ind);
                            }}
                            className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg shadow-sm transition-all transform hover:scale-105 border-none cursor-pointer"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            เปิดดูงาน
                          </button>
                          {ind.status === "completed" && (
                            <span className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-150">
                              <CheckCircle2 className="w-3 h-3" /> สำเร็จแล้ว
                            </span>
                          )}
                          {ind.status === "in_progress" && (
                            <span className="hidden sm:flex items-center gap-1 text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-150">
                              <Clock className="w-3 h-3" /> กำลังดำเนินการ
                            </span>
                          )}
                          {(!ind.status || ind.status === "not_started") && (
                            <span className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded-full border border-slate-150">
                              ยังไม่ได้เริ่ม
                            </span>
                          )}
                          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 space-y-4 font-sans bg-slate-50/50">
                          <div className="p-4 bg-white rounded-xl border border-slate-150 text-sm leading-relaxed text-slate-700 whitespace-pre-line shadow-sm">
                            {ind.description ? ind.description : (
                              <span className="text-slate-400 italic">คุณครูยังไม่ได้บันทึกรายละเอียดการดำเนินงานในรายงานตัวชี้วัดนี้</span>
                            )}
                          </div>

                          {/* Evidence link items */}
                          <div className="space-y-2">
                            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              ลิงก์หลักฐานอ้างอิงและเอกสารแนบ
                            </h5>
                            {ind.evidenceLinks.length === 0 ? (
                              <p className="text-xs text-slate-400 italic font-sans pl-1">ไม่มีไฟล์อ้างอิงหรือเครื่องยืนยันแนบไว้</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {ind.evidenceLinks.map((link) => (
                                  <button
                                    key={link.id}
                                    onClick={() => handleOpenEvidence(link)}
                                    className="flex items-center justify-between p-3.5 bg-white border border-slate-200 hover:border-blue-500 text-slate-800 rounded-xl hover:shadow-md transition-all text-xs group cursor-pointer text-left w-full"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-blue-50 transition-colors">
                                        {link.displayMode === 'activity' ? <ImageIcon className="w-4 h-4 text-blue-600" /> : 
                                         link.displayMode === 'certificate' ? <Award className="w-4 h-4 text-amber-600" /> :
                                         link.displayMode === 'document' || link.url.toLowerCase().endsWith('.pdf') ? <FileText className="w-4 h-4 text-rose-600" /> :
                                         getSmartIcon(link.url)}
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">{link.name}</span>
                                        {link.displayMode && (
                                          <span className="text-[10px] text-slate-500 capitalize">{link.displayMode === 'activity' ? 'ภาพกิจกรรม' : link.displayMode === 'certificate' ? 'เกียรติบัตร' : 'เอกสาร'}</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-500">
                                      <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">ดูรายละเอียด</span>
                                      <ChevronDown className="w-4 h-4 -rotate-90" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2 CONTENT: CHALLENGE (ส่วนที่ 2) */}
        {activeTab === "part2" && (
          <div className="bg-white rounded-lg shadow-sm border border-[#e2e8f0] p-6 md:p-8 space-y-6">
            
            <div className="border-b border-[#e2e8f0] pb-5">
              <span className={`${resolvedTheme.primaryText} font-bold text-xs uppercase tracking-wider`}>ประเด็นท้าทาย (Part 2: Challenge Target)</span>
              {profileData.challenge?.status === "completed" && (
                <span className="float-right bg-green-50 text-green-800 text-[10px] font-bold px-3 py-1 rounded-md border border-green-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> สำเร็จสมบูรณ์แล้ว
                </span>
              )}
              {profileData.challenge?.status === "in_progress" && (
                <span className="float-right bg-yellow-50 text-yellow-800 text-[10px] font-bold px-3 py-1 rounded-md border border-yellow-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-yellow-600" /> กำลังดำเนินการเชิงคิดวิจัย
                </span>
              )}
              
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-2 leading-tight">
                {profileData.challenge?.title || <span className="text-slate-400 italic font-normal text-lg">คุณครูยังไม่ได้บันทึกระบุหัวข้อประเด็นท้าทาย</span>}
              </h2>
            </div>

            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Problem Context */}
                <div className={`bg-slate-50 p-5 rounded-lg border border-[#e2e8f0] space-y-2.5 shadow-sm border-l-4 ${resolvedTheme.borderBg}`}>
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 uppercase">
                    ๑. สภาพปัญหาผลสัมฤทธิ์
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-sans">
                    {profileData.challenge?.problemContext || "ยังไม่ได้บันทึกข้อมูลส่วนนี้"}
                  </p>
                </div>

                {/* Workflow process */}
                <div className={`bg-slate-50 p-5 rounded-lg border border-[#e2e8f0] space-y-2.5 shadow-sm border-l-4 ${resolvedTheme.borderBg}`}>
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 uppercase">
                    ๒. วิธีขับเคลื่อนให้บรรลุผล
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-sans">
                    {profileData.challenge?.process || "ยังไม่ได้บันทึกข้อมูลส่วนนี้"}
                  </p>
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Quantitative */}
                <div className={`bg-slate-50 p-5 rounded-lg border border-[#e2e8f0] space-y-2.5 shadow-sm border-l-4 ${resolvedTheme.borderBg}`}>
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 uppercase">
                    ๓. ผลลัพธ์เชิงปริมาณที่คาดหวัง
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-sans">
                    {profileData.challenge?.quantitativeOutput || "ยังไม่ได้บันทึกข้อมูลส่วนนี้"}
                  </p>
                </div>

                {/* Qualitative */}
                <div className={`bg-slate-50 p-5 rounded-lg border border-[#e2e8f0] space-y-2.5 shadow-sm border-l-4 ${resolvedTheme.borderBg}`}>
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 uppercase">
                    ๔. ผลลัพธ์เชิงคุณภาพที่คาดหวัง
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-sans">
                    {profileData.challenge?.qualitativeOutput || "ยังไม่ได้บันทึกข้อมูลส่วนนี้"}
                  </p>
                </div>

              </div>

                      {/* Evidence link items */}
                      <div className="pt-3 space-y-3">
                        <h4 className="font-bold text-xs text-slate-700 uppercase tracking-widest pl-1">
                          เอกสารประกอบแฟ้มประเด็นท้าทาย (Evidence list / Outcomes Documents)
                        </h4>
                        
                        {(!profileData.challenge?.evidenceLinks || profileData.challenge.evidenceLinks.length === 0) ? (
                          <p className="text-xs text-slate-400 italic pl-1 font-sans">ไม่มีการแนบไฟล์สำหรับประเด็นท้าทายนี้</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {profileData.challenge.evidenceLinks.map((link) => (
                              <button
                                key={link.id}
                                onClick={() => handleOpenEvidence(link)}
                                className="flex items-center justify-between p-4 bg-white border border-[#e2e8f0] hover:border-blue-500 text-slate-800 rounded-2xl hover:shadow-md transition-all text-sm group cursor-pointer text-left"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="p-2.5 rounded-xl bg-slate-50 group-hover:bg-blue-50 transition-colors">
                                    {getSmartIcon(link.url)}
                                  </div>
                                  <span className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">{link.name}</span>
                                </div>
                                <ChevronDown className="w-5 h-5 -rotate-90 text-slate-400 group-hover:text-blue-500" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

            </div>

          </div>
        )}

      </section>

      {/* Evaluation Committee Showcase - New Section */}
      <section className="max-w-5xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className={`${resolvedTheme.primaryBg} px-6 py-4 flex items-center gap-3`}>
            <User className="text-white w-5 h-5" />
            <h3 className="font-bold text-white text-sm">คณะกรรมการร่วมประเมินผลการพัฒนางานตามข้อตกลง (PA)</h3>
          </div>
          
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Director / Chairman */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[#1e3a8a] text-white rounded-full flex items-center justify-center mb-3 shadow-md">
                <Landmark className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter mb-1">ประธานกรรมการ</p>
              <h4 className="font-bold text-slate-900 text-sm">{schoolInfo?.directorName || "ผู้อำนวยการโรงเรียน"}</h4>
              <p className="text-[11px] text-slate-500 mt-1">ผู้อำนวยการโรงเรียน{teacher.school}</p>
            </div>

            {/* Committee Members from School Data */}
            {schoolInfo?.paCommitteeMembers && Array.isArray(schoolInfo.paCommitteeMembers) && schoolInfo.paCommitteeMembers.map((member: any, index: number) => (
              <div key={index} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mb-3">
                  <User className="w-6 h-6" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">กรรมการประเมิน</p>
                <h4 className="font-bold text-slate-900 text-sm">{typeof member === 'string' ? member : member.name}</h4>
                <p className="text-[11px] text-slate-500 mt-1">{typeof member === 'object' ? member.title || "ผู้ทรงคุณวุฒิ" : "ผู้ทรงคุณวุฒิ"}</p>
              </div>
            ))}

            {/* Placeholder if none */}
            {(!schoolInfo?.paCommitteeMembers || schoolInfo.paCommitteeMembers.length === 0) && (
              <div className="md:col-span-2 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-xl p-6 bg-slate-50/30">
                 <p className="text-xs text-slate-400 italic">ไม่ได้ระบุรายชื่อกรรมการร่วมประเมินเพิ่มเติมในระบบ</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Evaluator Footer signature panel */}
      <footer className="max-w-5xl mx-auto px-4 mt-12 text-center text-slate-400 text-xs">
        <div className="border-t border-slate-200/85 pt-6 space-y-1.5 font-sans pb-12">
          <p>&copy; ระบบแฟ้มสะสมรายงานข้อตกลงในการพัฒนางาน (PA) ข้าราชการครูและบุคลากรทางการศึกษา</p>
          <p className="text-[10px] text-slate-400 italic">พัฒนาขึ้นเพื่อยกระดับวิชาชีพครูสู่ยุคดิจิทัล &bull; จัดทำเพื่ออำนวยความสะดวกแก่คณะกรรมการประเมินวิทยฐานะ</p>
        </div>
      </footer>

      {/* Evidence Showcase Modal */}
      <AnimatePresence mode="wait">
        {showModal && selectedEvidence && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/95 backdrop-blur-md"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-5xl max-h-full bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/20"
            >
              {/* Modal Header */}
              <div className="px-6 md:px-8 py-5 md:py-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${
                    selectedEvidence.displayMode === 'activity' ? 'bg-blue-50 text-blue-600' :
                    selectedEvidence.displayMode === 'certificate' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {selectedEvidence.displayMode === 'activity' ? <ImageIcon className="w-6 h-6" /> :
                     selectedEvidence.displayMode === 'certificate' ? <Award className="w-6 h-6" /> :
                     <FileText className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-base md:text-xl font-extrabold text-slate-900 leading-tight pr-4">{selectedEvidence.name}</h3>
                    <p className="text-[10px] md:text-[11px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-1">
                      {selectedEvidence.displayMode === 'activity' ? '📁 ชุดร่องรอยกิจกรรมเชิงประจักษ์' : 
                       selectedEvidence.displayMode === 'certificate' ? '🏆 เกียรติบัตรและเครื่องยืนยันความสำเร็จ' : '📄 เอกสารและไฟล์ประกอบหลักฐาน'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2.5 hover:bg-slate-100 rounded-full transition-all border-none bg-transparent cursor-pointer text-slate-400 hover:text-rose-500"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>

              {/* Modal Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 bg-slate-50/50">
                
                {/* 1. Header Hero / Description Section */}
                {selectedEvidence.description && (
                  <div className="max-w-3xl mx-auto space-y-5">
                    <div className="flex items-center gap-3">
                       <div className="h-px flex-1 bg-blue-100"></div>
                       <div className="inline-block p-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-extrabold uppercase tracking-[0.15em] px-4 py-1.5 shadow-sm border border-blue-100">
                         รายละเอียดประกอบ
                       </div>
                       <div className="h-px flex-1 bg-blue-100"></div>
                    </div>
                    <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-blue-100 shadow-xl shadow-blue-950/5 relative group">
                      <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg rotate-[-15deg]">
                        <FileText className="w-6 h-6" />
                      </div>
                      <p className="text-base md:text-lg text-slate-700 leading-relaxed font-sans whitespace-pre-wrap text-left antialiased">
                        {selectedEvidence.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. Primary Showcase Section */}
                <div id="showcase-content" className="max-w-4xl mx-auto">
                  {selectedEvidence.displayMode === 'activity' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedEvidence.url && (
                        <div className="space-y-3">
                           <div className="bg-white p-2 rounded-[2rem] shadow-xl shadow-blue-900/5 ring-1 ring-slate-200/60 overflow-hidden">
                            <div className="bg-slate-950 rounded-[1.5rem] aspect-[4/3] overflow-hidden group relative">
                              <img src={selectedEvidence.url} alt="Activity Primary" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[9px] text-white font-bold border border-white/20">ภาพกิจกรรมหลัก</div>
                            </div>
                           </div>
                           <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">Image Focus 01</p>
                        </div>
                      )}
                      {selectedEvidence.secondaryUrl && (
                        <div className="space-y-3">
                          <div className="bg-white p-2 rounded-[2rem] shadow-xl shadow-blue-900/5 ring-1 ring-slate-200/60 overflow-hidden">
                            <div className="bg-slate-950 rounded-[1.5rem] aspect-[4/3] overflow-hidden group relative">
                              <img src={selectedEvidence.secondaryUrl} alt="Activity Secondary" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[9px] text-white font-bold border border-white/20">ภาพกิจกรรมเสริม</div>
                            </div>
                          </div>
                          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">Image Focus 02</p>
                        </div>
                      )}
                    </div>
                  ) : selectedEvidence.displayMode === 'certificate' ? (
                    <div className="max-w-3xl mx-auto">
                      <div className="bg-white p-2 sm:p-4 rounded-[2rem] shadow-2xl shadow-amber-900/10 ring-1 ring-amber-200/50 overflow-hidden group">
                        <img 
                          src={selectedEvidence.url} 
                          alt="Certificate Detail" 
                          className="w-full h-auto rounded-[1.5rem] group-hover:scale-[1.02] transition-transform duration-700" 
                        />
                      </div>
                      <div className="mt-6 flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 text-amber-600">
                          <Award className="w-5 h-5" />
                          <span className="text-sm font-bold uppercase tracking-tighter">Verified Achievement</span>
                        </div>
                        <p className="text-[10px] text-slate-400">เกียรติบัตรฉบับจริงถูกจัดเก็บในระบบคลังดิจิทัล สพฐ.</p>
                      </div>
                    </div>
                  ) : (
                    /* General or Document/PDF View */
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden min-h-[60vh] flex flex-col ring-1 ring-slate-200/50">
                      <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <FileText className="w-5 h-5 text-rose-500" />
                           <span className="text-xs font-bold text-white">เอกสารตรวจสอบ (Online Documentation)</span>
                        </div>
                        <a 
                          href={selectedEvidence.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[10px] px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all no-underline font-bold flex items-center gap-2"
                        >
                          <Download className="w-3.5 h-3.5" /> 🚀 เปิดดู/ดาวน์โหลดต้นฉบับ
                        </a>
                      </div>
                      
                      <div className="flex-1 bg-slate-100 relative min-h-[500px]">
                        {(selectedEvidence.url.toLowerCase().endsWith('.pdf') || 
                          (selectedEvidence.url.includes('drive.google.com') && selectedEvidence.displayMode === 'document')) ? (
                          <iframe 
                            src={`${selectedEvidence.url.replace('/view', '/preview')}#toolbar=0`} 
                            className="w-full h-full border-none absolute inset-0"
                            title="Evidence PDF Preview"
                          ></iframe>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-slate-50">
                            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
                              <ExternalLink className="w-10 h-10" />
                            </div>
                            <h4 className="text-xl font-extrabold text-slate-900 mb-2">ลิงก์เอกสารภายนอก</h4>
                            <p className="text-sm text-slate-500 max-w-sm mb-8">เนื่องจากเอกสารนี้ถูกเก็บไว้ใน Drive หรือเว็บภายนอก ระบบไม่สามารถแสดงตัวอย่างได้ในทันที โปรดคลิกที่ปุ่มด้านล่างเพื่อตรวจสอบ</p>
                            <a 
                              href={selectedEvidence.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-xl hover:bg-slate-800 transition-all no-underline flex items-center gap-3"
                            >
                              ตรวจสอบเอกสารหลักฐาน <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pb-10 max-w-3xl mx-auto text-center">
                   <p className="text-[10px] text-slate-400 font-medium">หมายเหตุ: ข้อมูลและหลักฐานทั้งหมดถูกรับรองโดยผู้ยื่นประเมินและสถานศึกษาต้นสังกัด</p>
                </div>
              </div>

              {/* Bottom Sticky Action */}
              <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">PA DIGITAL SHOWCASE v2.0</span>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto px-10 py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all border-none cursor-pointer shadow-lg active:scale-95"
                >
                  เสร็จสิ้นการตรวจสอบ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NEW: INDICATOR DETAILS POPUP MODAL (Request 6) */}
      <AnimatePresence>
        {showIndModal && selectedIndForModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200"
            >
              {/* Modal Banner Header */}
              <div className={`${resolvedTheme.primaryBg} px-8 py-6 text-white flex justify-between items-center relative overflow-hidden`}>
                <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-4 -translate-y-4">
                  <Award className="w-48 h-48" />
                </div>
                <div className="relative z-10 flex items-center gap-4">
                  <div className={`${resolvedTheme.accentBg} text-slate-900 p-3 rounded-2xl shadow-lg`}>
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">รายละเอียดตัวชี้วัด (Indicator Details)</h4>
                    <h2 className="text-lg md:text-xl font-extrabold leading-tight">ตัวชี้วัด {selectedIndForModal.id}: {selectedIndForModal.title}</h2>
                  </div>
                </div>
                <button 
                  onClick={() => setShowIndModal(false)}
                  className="p-3 hover:bg-white/10 rounded-full transition-all border-none bg-transparent cursor-pointer text-white relative z-10"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-10 space-y-8">
                {/* 1. Description Header */}
                <div className="bg-white p-8 md:p-10 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-sm">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">คำอธิบายแนวทางการปฏิบัติงาน</span>
                  </div>
                  <p className="text-base md:text-lg text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                    {selectedIndForModal.description || "คุณครูยังไม่ได้ระบุรายละเอียดประกอบตัวชี้วัดนี้"}
                  </p>
                </div>

                {/* 2. Evidence Showcase List */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3 px-4">
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">รายการหลักฐานที่พบ ({selectedIndForModal.evidenceLinks.length})</span>
                     <div className="h-px flex-1 bg-slate-200"></div>
                   </div>

                   {selectedIndForModal.evidenceLinks.length === 0 ? (
                     <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-slate-300">
                        <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm text-slate-400 italic">ไม่มีข้อมูลการแนบหลักฐานสำหรับตัวชี้วัดนี้</p>
                     </div>
                   ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedIndForModal.evidenceLinks.map(link => (
                          <div 
                            key={link.id}
                            className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full group"
                          >
                            <div className="flex items-center justify-between mb-4">
                               <div className="flex items-center gap-3">
                                  <div className={`p-2.5 rounded-2xl ${link.displayMode === 'activity' ? 'bg-blue-50 text-blue-600' : link.displayMode === 'certificate' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {link.displayMode === 'activity' ? <ImageIcon className="w-5 h-5" /> : link.displayMode === 'certificate' ? <Award className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                  </div>
                                  <div>
                                    <h5 className="font-extrabold text-slate-800 text-sm">{link.name}</h5>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{link.displayMode || 'เอกสาร'}</span>
                                  </div>
                               </div>
                               <button 
                                 onClick={() => {
                                   handleOpenEvidence(link);
                                 }}
                                 className="p-2.5 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-xl text-slate-400 transition-all cursor-pointer border-none"
                               >
                                 <PlayCircle className="w-5 h-5" />
                               </button>
                            </div>

                            {/* PREVIEW IMAGE/PDF INSIDE MODAL */}
                            <div className="flex-1 bg-slate-900 rounded-[1.5rem] overflow-hidden aspect-[16/9] relative mb-4">
                               {link.displayMode === 'activity' ? (
                                  <div className="grid grid-cols-2 h-full gap-0.5">
                                     <img src={link.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                     <img src={link.secondaryUrl || link.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                               ) : (
                                  <img src={link.url} className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                               )}
                               <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleOpenEvidence(link)} className="px-6 py-2 bg-white text-slate-900 rounded-full text-xs font-bold shadow-xl transform scale-90 group-hover:scale-100 transition-transform">คลิกเพื่อขยายดูพอร์ต</button>
                               </div>
                            </div>

                            {link.description && (
                              <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-2 px-2">"{link.description}"</p>
                            )}
                          </div>
                        ))}
                     </div>
                   )}
                </div>
              </div>

              <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setShowIndModal(false)}
                  className="px-10 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all border-none cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
