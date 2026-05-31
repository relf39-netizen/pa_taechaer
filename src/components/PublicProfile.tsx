import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  User, School, Landmark, Phone, Globe, BookOpen, Clock, 
  CheckCircle2, FileText, ExternalLink, Sparkles, Award, 
  Check, AlertCircle, ChevronDown, ChevronUp, Download, PlayCircle
} from "lucide-react";
import { Teacher, TeacherData, PAIndicator, PACleaningChallenge, EvidenceLink } from "../types";

interface PublicProfileProps {
  slug: string;
  initialProvidedTeacherData?: {
    teacher: Teacher;
    data: TeacherData;
  } | null;
  onBackToSystem?: () => void;
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

export default function PublicProfile({ slug, initialProvidedTeacherData, onBackToSystem }: PublicProfileProps) {
  const [profileData, setProfileData] = useState<TeacherData | null>(
    initialProvidedTeacherData ? initialProvidedTeacherData.data : null
  );
  const [teacher, setTeacher] = useState<Teacher | null>(
    initialProvidedTeacherData ? initialProvidedTeacherData.teacher : null
  );
  
  const [isLoading, setIsLoading] = useState(!initialProvidedTeacherData);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"part1" | "part2">("part1");
  const [openIndicatorId, setOpenIndicatorId] = useState<string | null>("1.1");

  // Fetch teacher data by slug if not already provided
  useEffect(() => {
    if (initialProvidedTeacherData) {
      setTeacher(initialProvidedTeacherData.teacher);
      setProfileData(initialProvidedTeacherData.data);
      setIsLoading(false);
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
                        <div className="flex items-center gap-3 ml-2">
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
                                  <a
                                    key={link.id}
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-3 bg-white border border-slate-200 hover:border-amber-400 text-slate-800 rounded-xl hover:shadow-sm transition-all text-xs"
                                  >
                                    <div className="flex items-center gap-2 max-w-[85%]">
                                      {getSmartIcon(link.url)}
                                      <span className="font-semibold truncate">{link.name}</span>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                  </a>
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
                                  <a
                                    key={link.id}
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-3 bg-white border border-slate-200 hover:border-amber-400 text-slate-800 rounded-xl hover:shadow-sm transition-all text-xs"
                                  >
                                    <div className="flex items-center gap-2 max-w-[85%]">
                                      {getSmartIcon(link.url)}
                                      <span className="font-semibold truncate">{link.name}</span>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                  </a>
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
                                  <a
                                    key={link.id}
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-3 bg-white border border-slate-200 hover:border-amber-400 text-slate-800 rounded-xl hover:shadow-sm transition-all text-xs"
                                  >
                                    <div className="flex items-center gap-2 max-w-[85%]">
                                      {getSmartIcon(link.url)}
                                      <span className="font-semibold truncate">{link.name}</span>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                  </a>
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

              {/* Challenge Evidence links */}
              <div className="pt-3 space-y-3">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-widest pl-1">
                  เอกสารประกอบแฟ้มประเด็นท้าทาย (Evidence list / Outcomes Documents)
                </h4>
                
                {(!profileData.challenge?.evidenceLinks || profileData.challenge.evidenceLinks.length === 0) ? (
                  <p className="text-xs text-slate-400 italic pl-1 font-sans">ไม่มีการแนบไฟล์สำหรับประเด็นท้าทายนี้</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {profileData.challenge.evidenceLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3.5 bg-white border border-[#e2e8f0] hover:border-[#1e3a8a] text-slate-800 rounded-xl hover:shadow-sm transition-all text-xs"
                      >
                        <div className="flex items-center gap-2 max-w-[85%]">
                          {getSmartIcon(link.url)}
                          <span className="font-semibold truncate">{link.name}</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </section>

      {/* Evaluator Footer signature panel */}
      <footer className="max-w-5xl mx-auto px-4 mt-12 text-center text-slate-400 text-xs">
        <div className="border-t border-slate-200/85 pt-6 space-y-1.5 font-sans">
          <p>&copy; ระบบแฟ้มสะสมรายงานข้อตกลงในการพัฒนางาน (PA) ข้าราชการครูและบุคลากรทางการศึกษา</p>
          <p className="text-[10px] text-slate-400">พัฒนาถูกต้องตามหลักเกณฑ์ สพฐ. เพื่อนำเสนอคณะกรรมการการประเมินผล</p>
        </div>
      </footer>
    </div>
  );
}
