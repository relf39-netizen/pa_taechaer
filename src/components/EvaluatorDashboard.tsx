import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, BookOpen, Star, MessageSquare, LogOut, CheckCircle2, 
  ExternalLink, ArrowLeft, Trophy, Search, School, User, Shield
} from "lucide-react";
import { Teacher } from "../types";
import PublicProfile from "./PublicProfile";

interface EvaluatorDashboardProps {
  evaluator: any;
  onLogout: () => void;
}

export default function EvaluatorDashboard({ evaluator, onLogout }: EvaluatorDashboardProps) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [viewingPortfolio, setViewingPortfolio] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Evaluation form state
  const [part1Scores, setPart1Scores] = useState<number[]>(new Array(15).fill(0));
  const [part2Scores, setPart2Scores] = useState<number[]>(new Array(10).fill(0));
  const [comment, setComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Indicator Labels mapping
  const part1Labels = [
    "1.1 สร้างและหรือพัฒนาหลักสูตร",
    "1.2 ออกแบบการจัดการเรียนรู้",
    "1.3 จัดกิจกรรมการเรียนรู้",
    "1.4 สร้างและหรือพัฒนาสื่อ นวัตกรรม",
    "1.5 วัดและประเมินผลการเรียนรู้",
    "1.6 ศึกษา วิเคราะห์ เพื่อแก้ปัญหา",
    "1.7 จัดบรรยากาศที่ส่งเสริมการเรียนรู้",
    "1.8 อบรมและพัฒนาคุณลักษณะที่ดี",
    "2.1 จัดทำข้อมูลสารสนเทศผู้เรียน",
    "2.2 ดำเนินการตามระบบดูแลช่วยเหลือ",
    "2.3 ปฏิบัติงานวิชาการและงานอื่นๆ",
    "2.4 ประสานความร่วมมือกับผู้ปกครอง",
    "3.1 พัฒนาตนเองอย่างเป็นระบบ",
    "3.2 มีส่วนร่วมในการแลกเปลี่ยนเรียนรู้ (PLC)",
    "3.3 นำความรู้มาใช้ในการพัฒนาการเรียนรู้"
  ];

  const part2Labels = [
    "ประเด็นท้าทาย (เชิงปริมาณ) - ตัวชี้วัดที่ 1",
    "ประเด็นท้าทาย (เชิงปริมาณ) - ตัวชี้วัดที่ 2",
    "ประเด็นท้าทาย (เชิงปริมาณ) - ตัวชี้วัดที่ 3",
    "ประเด็นท้าทาย (เชิงปริมาณ) - ตัวชี้วัดที่ 4",
    "ประเด็นท้าทาย (เชิงปริมาณ) - ตัวชี้วัดที่ 5",
    "ประเด็นท้าทาย (เชิงคุณภาพ) - ตัวชี้วัดที่ 1",
    "ประเด็นท้าทาย (เชิงคุณภาพ) - ตัวชี้วัดที่ 2",
    "ประเด็นท้าทาย (เชิงคุณภาพ) - ตัวชี้วัดที่ 3",
    "ประเด็นท้าทาย (เชิงคุณภาพ) - ตัวชี้วัดที่ 4",
    "ประเด็นท้าทาย (เชิงคุณภาพ) - ตัวชี้วัดที่ 5"
  ];

  useEffect(() => {
    fetchTeachers();
  }, [evaluator.schoolSmissCode]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/evaluator/teachers?smissCode=${evaluator.schoolSmissCode}&evaluatorId=${evaluator.id}`);
      const data = await res.json();
      if (data.success) {
        setTeachers(data.teachers || []);
      }
    } catch (err) {
      console.error("Error fetching teachers for evaluation:", err);
    } finally {
      setLoading(false);
    }
  };

  const triggerToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSelectTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    setPart1Scores(teacher.evaluation?.part1Scores || new Array(15).fill(0));
    setPart2Scores(teacher.evaluation?.part2Scores || new Array(10).fill(0));
    setComment(teacher.evaluation?.comment || "");
    setViewingPortfolio(false);
  };

  const handleSaveEvaluation = async () => {
    if (!selectedTeacher) return;
    if (part1Scores.includes(0) || part2Scores.includes(0)) {
      triggerToast("error", "กรุณาให้คะแนนให้ครบทุกตัวชี้วัด");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/evaluator/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluatorId: evaluator.id,
          teacherId: selectedTeacher.id,
          part1Scores,
          part2Scores,
          comment
        })
      });
      if (res.ok) {
        triggerToast("success", "บันทึกผลการประเมินเรียบร้อยแล้ว");
        fetchTeachers(); // Refresh list
      } else {
        throw new Error("Failed to save evaluation");
      }
    } catch (err: any) {
      triggerToast("error", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getScoreLabel = (score: number) => {
    switch (score) {
      case 1: return "ต่ำกว่าระดับที่คาดหวังมาก";
      case 2: return "ต่ำกว่าระดับที่คาดหวัง";
      case 3: return "ตามระดับที่คาดหวัง";
      case 4: return "สูงกว่าระดับที่คาดหวัง";
      default: return "-";
    }
  };

  const scoreP1Total = part1Scores.reduce((a, b) => a + b, 0);
  const scoreP2Total = part2Scores.reduce((a, b) => a + b, 0);
  const totalScore = scoreP1Total + scoreP2Total;

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { label: "ยอดเยี่ยม (ดีเด่น)", color: "text-emerald-600" };
    if (percentage >= 80) return { label: "ดีเลิศ", color: "text-blue-600" };
    if (percentage >= 70) return { label: "ดี (ผ่านเกณฑ์)", color: "text-amber-600" };
    if (percentage >= 60) return { label: "ปานกลาง", color: "text-orange-500" };
    return { label: "ต้องปรับปรุง", color: "text-rose-600" };
  };

  const renderIndicatorRow = (label: string, index: number, scores: number[], setter: (val: number[]) => void) => (
    <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors gap-3">
      <div className="flex-1">
        <p className="text-[11px] font-bold text-slate-700">{label}</p>
        <p className={`text-[10px] font-medium mt-0.5 ${scores[index] > 0 ? "text-blue-600" : "text-slate-400"}`}>
          {scores[index] > 0 ? getScoreLabel(scores[index]) : "(ยังไม่ประเมิน)"}
        </p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        {[1, 2, 3, 4].map((star) => (
          <button
            key={star}
            onClick={() => {
              const newScores = [...scores];
              newScores[index] = star;
              setter(newScores);
            }}
            className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center border transition-all ${
              scores[index] === star 
                ? "bg-amber-100 border-amber-400 text-amber-600 shadow-sm" 
                : "bg-white border-slate-200 text-slate-300 hover:border-amber-200"
            }`}
          >
            <Star className={`w-5 h-5 ${scores[index] >= star ? "fill-amber-400 text-amber-500" : "text-slate-300"}`} />
            <span className="text-[8px] font-bold uppercase">{star}</span>
          </button>
        ))}
      </div>
    </div>
  );

  if (viewingPortfolio && selectedTeacher) {
    return (
      <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
        <PublicProfile 
          slug={selectedTeacher.slug} 
          onBackToSystem={() => setViewingPortfolio(false)} 
          isEvaluatorView={true}
        />
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110]">
          <button
            onClick={() => setViewingPortfolio(false)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full shadow-2xl hover:bg-slate-800 transition-all font-bold border-none cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            กลับไปหน้าให้คะแนน
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <header className="bg-[#1e3a8a] text-white py-4 px-6 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#facc15] text-[#1e3a8a] p-2 rounded-lg">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight uppercase tracking-tight">ระบบประเมินผล PA (Score Center)</h1>
              <p className="text-[10px] text-blue-100 flex items-center gap-1.5 mt-0.5">
                <School className="w-3 h-3" />
                โรงเรียน: {evaluator.schoolName} | กรรมการ: {evaluator.name}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border-none rounded-lg text-sm font-bold cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                รายชื่อผู้รับการประเมิน
              </h2>
            </div>
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-[10px] text-slate-500 font-sans">กำลังดึงรายชื่อ...</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[calc(100vh-250px)] overflow-y-auto">
                {teachers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 italic text-xs">ไม่พบรายชื่อคุณครูในสังกัด</div>
                ) : (
                  teachers.map((teacher) => (
                    <button
                      key={teacher.id}
                      onClick={() => handleSelectTeacher(teacher)}
                      className={`w-full text-left p-4 hover:bg-blue-50 transition-colors flex items-center justify-between border-none cursor-pointer ${
                        selectedTeacher?.id === teacher.id ? "bg-blue-50 border-r-4 border-blue-600" : "bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                            {teacher.avatarImage ? (
                              <img src={teacher.avatarImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User className="w-6 h-6 text-slate-400 m-2" />
                            )}
                          </div>
                          {teacher.evaluation && (
                            <div className="absolute -right-1 -bottom-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white shadow-sm">
                              <CheckCircle2 className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-800 truncate w-[100px]">{teacher.name}</p>
                          <p className="text-[9px] text-slate-500 truncate w-[100px]">{teacher.position}</p>
                        </div>
                      </div>
                      {teacher.evaluation && (
                        <div className="text-right">
                          <p className="text-[11px] font-black text-blue-700">
                            {teacher.evaluation.part1Scores.reduce((a:number,b:number)=>a+b, 0) + teacher.evaluation.part2Scores.reduce((a:number,b:number)=>a+b, 0)}%
                          </p>
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-9 h-full">
          {selectedTeacher ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              key={selectedTeacher.id}
              className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[800px]"
            >
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-md border border-slate-200">
                    <img 
                      src={selectedTeacher.avatarImage || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + selectedTeacher.id} 
                      className="w-full h-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">{selectedTeacher.name}</h3>
                    <p className="text-xs text-slate-600">{selectedTeacher.position}</p>
                    <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 bg-white/80 text-blue-800 rounded-lg text-[10px] font-bold border border-blue-100 shadow-sm">
                      <ExternalLink className="w-3 h-3" />
                      แฟ้มสะสมงาน {selectedTeacher.academicYear || "2566"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setViewingPortfolio(true)}
                  className="px-6 py-3 bg-[#1e3a8a] text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 border-none cursor-pointer"
                >
                  <BookOpen className="w-5 h-5" />
                  เปิดแฟ้มสะสมงาน (Portfolio)
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sticky top-0 z-20 bg-white/90 backdrop-blur-md p-4 -m-4 mb-8 border-b border-slate-150 rounded-b-2xl shadow-sm">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">ส่วนที่ 1 (Max 60)</p>
                    <p className="text-xl font-black text-slate-800">{scoreP1Total}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">ส่วนที่ 2 (Max 40)</p>
                    <p className="text-xl font-black text-slate-800">{scoreP2Total}</p>
                  </div>
                  <div className="bg-blue-600 p-3 rounded-2xl text-white text-center shadow-lg shadow-blue-100">
                    <p className="text-[10px] font-bold text-blue-100 uppercase tracking-tighter mb-1">คะแนนรวม (100%)</p>
                    <p className="text-xl font-black">{totalScore}</p>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 text-center shadow-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">ผลการประเมิน</p>
                    <p className={`text-sm font-extrabold ${getGrade(totalScore).color}`}>{getGrade(totalScore).label}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-100">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-md shadow-blue-100">1</div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">ส่วนที่ 1: มาตรฐานตำแหน่งและผลการปฏิบัติงาน</h4>
                      <p className="text-xs text-slate-500">ประเมินตามตัวชี้วัด 3 ด้าน จำนวน 15 รายการ (คะแนนเต็ม 60)</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 mt-4">
                    {part1Labels.map((label, idx) => renderIndicatorRow(label, idx, part1Scores, setPart1Scores))}
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-100">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-md shadow-indigo-100">2</div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">ส่วนที่ 2: ประเด็นท้าทายเพื่อพัฒนาผลลัพธ์</h4>
                      <p className="text-xs text-slate-500">ประเด็นท้าทาย จำนวน 10 ตัวชี้วัด (คะแนนเต็ม 40)</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 mt-4">
                    {part2Labels.map((label, idx) => renderIndicatorRow(label, idx, part2Scores, setPart2Scores))}
                  </div>
                </div>

                <div className="p-8 bg-slate-900 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                  <h4 className="text-sm font-bold text-blue-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Trophy className="w-5 h-5" /> สรุปเกณฑ์มาตรฐานระดับคุณภาพ
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-xs text-slate-400 font-medium">90 - 100 คะแนน</span>
                        <span className="text-xs font-bold text-white">ยอดเยี่ยม (ดีเด่น)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-xs text-slate-400 font-medium">80 - 89 คะแนน</span>
                        <span className="text-xs font-bold text-white">ดีเลิศ</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                        <span className="text-xs text-emerald-300 font-medium">70 - 79 คะแนน</span>
                        <span className="text-xs font-black text-emerald-400">ผ่านเกณฑ์เลื่อนวิทยฐานะ</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-xs text-slate-400 font-medium">60 - 69 คะแนน</span>
                        <span className="text-xs font-bold text-white">ปานกลาง</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                        <span className="text-xs text-rose-400 font-medium">ต่ำกว่า 60 คะแนน</span>
                        <span className="text-xs font-bold text-rose-400">ต้องปรับปรุง</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-white/10 rounded-2xl p-6 border border-white/20">
                      <p className="text-[10px] font-bold text-blue-200 uppercase mb-2 tracking-widest text-center">ระดับผลการประเมินสุทธิ</p>
                      <p className="text-5xl font-black text-[#facc15]">{totalScore}</p>
                      <p className={`mt-3 text-lg font-bold text-center`}>{getGrade(totalScore).label}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <MessageSquare className="w-5 h-5 text-blue-500" /> บันทึกข้อความเสนอแนะ
                  </label>
                  <textarea
                    rows={6}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="ระบุข้อเสนอแนะ..."
                    className="w-full p-5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-sans text-sm outline-none shadow-sm"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-[10px] text-slate-400 italic font-medium flex items-center gap-2 uppercase tracking-tighter">
                  <Shield className="w-3.5 h-3.5" /> ข้อมูลจะถูกจัดเก็บเข้าคลาวด์โรงเรียน
                </div>
                <button
                  onClick={handleSaveEvaluation}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-base font-black flex items-center justify-center gap-3 shadow-xl hover:-translate-y-0.5 disabled:opacity-50 transition-all border-none cursor-pointer"
                >
                  <CheckCircle2 className={`w-6 h-6 ${isSaving ? "animate-pulse" : ""}`} />
                  {isSaving ? "กำลังดำเนินการ..." : "บันทึกผลการประเมิน"}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-[40px] p-12 text-center space-y-6">
              <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-400 rotate-3"><Users className="w-12 h-12" /></div>
              <div className="max-w-sm">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">ศูนย์กลางการประเมิน (PA)</h3>
                <p className="text-sm text-slate-500 leading-relaxed mt-3">โปรดเลือกรายชื่อข้าราชการครูทางซ้ายเพื่อเข้าสู่ระบบการให้คะแนนรายตัวชี้วัด</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, x: "-50%" }}
            className={`fixed bottom-8 left-1/2 z-[200] px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 min-w-[360px] ${
              toast.type === "success" ? "bg-slate-900 text-emerald-400" : "bg-rose-900 text-rose-100"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="w-6 h-6" /> : <Star className="w-6 h-6" />}
            <span className="font-black text-sm uppercase tracking-wide">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <footer className="py-8 text-center text-[10px] text-slate-400 font-sans tracking-widest uppercase">Digital PA Evaluation System &bull; 2026</footer>
    </div>
  );
}
