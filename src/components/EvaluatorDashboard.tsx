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
  const [part2Scores, setPart2Scores] = useState<number[]>(new Array(11).fill(0)); // 0-4: Method, 5-7: Quant, 8-10: Qual
  const [comment, setComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Indicator Labels mapping
  const part1Labels = [
    "1.1 สร้างและหรือพัฒนาหลักสูตร", "1.2 ออกแบบการจัดการเรียนรู้", "1.3 จัดกิจกรรมการเรียนรู้",
    "1.4 สร้างและหรือพัฒนาสื่อ นวัตกรรม", "1.5 วัดและประเมินผลการเรียนรู้", "1.6 ศึกษา วิเคราะห์ เพื่อแก้ปัญหา",
    "1.7 จัดบรรยากาศที่ส่งเสริมการเรียนรู้", "1.8 อบรมและพัฒนาคุณลักษณะที่ดี", "2.1 จัดทำข้อมูลสารสนเทศผู้เรียน",
    "2.2 ดำเนินการตามระบบดูแลช่วยเหลือ", "2.3 ปฏิบัติงานวิชาการและงานอื่นๆ", "2.4 ประสานความร่วมมือกับผู้ปกครอง",
    "3.1 พัฒนาตนเองอย่างเป็นระบบ", "3.2 มีส่วนร่วมในการแลกเปลี่ยนเรียนรู้ (PLC)", "3.3 นำความรู้มาใช้ในการพัฒนาการเรียนรู้"
  ];

  const part2MethodLabels = [
    "กระบวนการวางแผนและออกแบบแนวทางแก้ปัญหา",
    "การดำเนินการตามแผนงานในระยะเริ่มแรก",
    "การปรับปรุงและพัฒนาคุณภาพอย่างต่อเนื่อง",
    "การใช้เทคโนโลยีหรือนวัตกรรมสนับสนุนการทำงาน",
    "การทำงานร่วมกับเพื่อนครูและเครือข่ายวิชาชีพ"
  ];

  const part2QuantLabels = [
    "ผลสัมฤทธิ์ทางการเรียนของผู้เรียน (เชิงปริมาณ)",
    "ทักษะกระบวนการเรียนรู้ (เชิงปริมาณ)",
    "คุณลักษณะอันพึงประสงค์ (เชิงปริมาณ)"
  ];

  const part2QualLabels = [
    "ความลุ่มลึกของคุณภาพกระบวนการจัดการเรียนรู้",
    "การเปลี่ยนแปลงเชิงพฤติกรรมในเชิงคุณภาพ",
    "ความยั่งยืนของผลลัพธ์การเรียนรู้"
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
    setPart2Scores(teacher.evaluation?.part2Scores || new Array(11).fill(0));
    setComment(teacher.evaluation?.comment || "");
    setViewingPortfolio(false);
  };

  const handleSaveEvaluation = async () => {
    if (!selectedTeacher) return;
    if (part1Scores.includes(0) || part2Scores.includes(0)) {
      triggerToast("error", "กรุณาประเมินให้ครบทุกรายการ");
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

  // Scoring Logic based on weighted percentages
  const scoreP1_sum = part1Scores.reduce((a, b) => a + b, 0); // Max 60 (1:1 ratio)
  
  const scoreP2_Method_sum = part2Scores.slice(0, 5).reduce((a, b) => a + b, 0); // Max 20 (5 * 4 = 20)
  const scoreP2_Quant_sum = part2Scores.slice(5, 8).reduce((a, b) => a + b, 0);  // Max 12 (3 * 4 = 12) -> Weight to 10
  const scoreP2_Qual_sum = part2Scores.slice(8, 11).reduce((a, b) => a + b, 0);  // Max 12 (3 * 4 = 12) -> Weight to 10

  const p1Final = scoreP1_sum; 
  const p2MethodFinal = scoreP2_Method_sum;
  const p2QuantFinal = scoreP2_Quant_sum > 0 ? (scoreP2_Quant_sum / 12) * 10 : 0;
  const p2QualFinal = scoreP2_Qual_sum > 0 ? (scoreP2_Qual_sum / 12) * 10 : 0;
  
  const totalScore = Math.round(p1Final + p2MethodFinal + p2QuantFinal + p2QualFinal);

  const getGrade = (score: number) => {
    if (score >= 90) return { label: "ยอดเยี่ยม (ดีเด่น)", color: "text-emerald-600" };
    if (score >= 80) return { label: "ดีเลิศ", color: "text-blue-600" };
    if (score >= 70) return { label: "ดี (ผ่านเกณฑ์)", color: "text-amber-600" };
    if (score >= 60) return { label: "ปานกลาง", color: "text-orange-500" };
    return { label: "ต้องปรับปรุง", color: "text-rose-600" };
  };

  const renderIndicatorRow = (label: string, index: number, scores: number[], setter: (val: number[]) => void, offset: number = 0) => (
    <div key={index + offset} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors gap-4">
      <div className="flex-1">
        <p className="text-[12px] font-bold text-slate-800 leading-snug">{label}</p>
        <p className={`text-[10px] font-medium mt-1 ${scores[index + offset] > 0 ? "text-blue-600" : "text-slate-400"}`}>
          {scores[index + offset] > 0 ? getScoreLabel(scores[index + offset]) : "(รอดำเนินการให้คะแนน)"}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        {[1, 2, 3, 4].map((star) => (
          <button
            key={star}
            onClick={() => {
              const newScores = [...scores];
              newScores[index + offset] = star;
              setter(newScores);
            }}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border-2 transition-all ${
              scores[index + offset] === star 
                ? "bg-amber-100 border-amber-400 text-amber-600 shadow-sm" 
                : "bg-white border-slate-100 text-slate-300 hover:border-amber-200"
            }`}
          >
            <Star className={`w-6 h-6 ${scores[index + offset] >= star ? "fill-amber-400 text-amber-500" : "text-slate-200"}`} />
            <span className="text-[9px] font-black mt-0.5">{star}</span>
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
                {/* Score Summary Box */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sticky top-0 z-20 bg-white/95 backdrop-blur-md p-4 -m-4 mb-8 border-b border-slate-150 rounded-b-3xl shadow-sm">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">ส่วนที่ 1 (Max 60)</p>
                    <p className="text-2xl font-black text-slate-800">{p1Final}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">ส่วนที่ 2 (Max 40)</p>
                    <p className="text-2xl font-black text-slate-800">{Math.round(p2MethodFinal + p2QuantFinal + p2QualFinal)}</p>
                  </div>
                  <div className="bg-blue-600 p-4 rounded-2xl text-white text-center shadow-lg shadow-blue-200">
                    <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mb-1">คะแนนรวมสุทธิ</p>
                    <p className="text-2xl font-black">{totalScore}/100</p>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border-2 border-slate-100 text-center flex flex-col justify-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">ระดับคุณภาพ</p>
                    <p className={`text-sm font-black leading-tight ${getGrade(totalScore).color}`}>{getGrade(totalScore).label}</p>
                  </div>
                </div>

                {/* Section 1 */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4 pb-4 border-b-2 border-slate-100">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-100">1</div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">ส่วนที่ 1: มาตรฐานตำแหน่ง</h4>
                      <p className="text-xs text-slate-500">การปฏิบัติงานตาม 3 ด้าน 15 ตัวชี้วัด (60 คะแนน)</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {part1Labels.map((label, idx) => renderIndicatorRow(label, idx, part1Scores, setPart1Scores))}
                  </div>
                </div>

                {/* Section 2 */}
                <div className="space-y-10 pt-6">
                  <div className="flex items-center gap-4 pb-4 border-b-2 border-slate-100">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-100">2</div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">ส่วนที่ 2: ประเด็นท้าทาย (PA)</h4>
                      <p className="text-xs text-slate-500">การพัฒนาผลลัพธ์การเรียนรู้ของผู้เรียน (40 คะแนน)</p>
                    </div>
                  </div>

                  {/* 2.1 Method */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                       <span className="w-6 h-6 bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center text-[10px]">2.1</span>
                       วิธีดำเนินการ (20 คะแนน)
                    </h5>
                    <div className="grid grid-cols-1 gap-3">
                      {part2MethodLabels.map((label, idx) => renderIndicatorRow(label, idx, part2Scores, setPart2Scores, 0))}
                    </div>
                  </div>

                  {/* 2.2 Result A (Quant) */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                       <span className="w-6 h-6 bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center text-[10px]">2.2</span>
                       ผลลัพธ์เชิงปริมาณ (10 คะแนน)
                    </h5>
                    <div className="grid grid-cols-1 gap-3">
                      {part2QuantLabels.map((label, idx) => renderIndicatorRow(label, idx, part2Scores, setPart2Scores, 5))}
                    </div>
                  </div>

                  {/* 2.3 Result B (Qual) */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                       <span className="w-6 h-6 bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center text-[10px]">2.3</span>
                       ผลลัพธ์เชิงคุณภาพ (10 คะแนน)
                    </h5>
                    <div className="grid grid-cols-1 gap-3">
                      {part2QualLabels.map((label, idx) => renderIndicatorRow(label, idx, part2Scores, setPart2Scores, 8))}
                    </div>
                  </div>
                </div>

                {/* Table Final Summary */}
                <div className="p-10 bg-slate-900 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full"></div>
                  <div className="relative z-10">
                    <h4 className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-8 flex items-center gap-3">
                      <Trophy className="w-5 h-5" /> ตารางสรุปเกณฑ์มาตรฐานระดับคุณภาพ
                    </h4>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-2.5">
                        {[
                          { range: "90 - 100 คะแนน", label: "ยอดเยี่ยม (ดีเด่น)", color: "text-emerald-400" },
                          { range: "80 - 89 คะแนน", label: "ดีเลิศ", color: "text-blue-400" },
                          { range: "70 - 79 คะแนน", label: "ดี (ผ่านเกณฑ์ขั้นต่ำ)", color: "text-amber-400" },
                          { range: "60 - 69 คะแนน", label: "ปานกลาง", color: "text-slate-400" },
                          { range: "ต่ำกว่า 60 คะแนน", label: "ต้องปรับปรุง", color: "text-rose-400" },
                        ].map((g, i) => (
                          <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl border bg-white/5 border-white/5 transition-all">
                            <span className="text-xs font-medium text-slate-400">{g.range}</span>
                            <span className={`text-xs font-black ${g.color}`}>{g.label}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="bg-white/5 rounded-3xl p-8 border border-white/10 flex flex-col items-center justify-center text-center">
                        <p className="text-[10px] font-bold text-blue-200 uppercase tracking-[0.2em] mb-4">คะแนนสุทธิรวมทั้งสิ้น</p>
                        <div className="relative">
                          <p className="text-7xl font-black text-white">{totalScore}</p>
                        </div>
                        <div className="mt-8 px-6 py-3 bg-white/10 rounded-2xl border border-white/20">
                          <p className={`text-xl font-black ${getGrade(totalScore).color === "text-emerald-600" ? "text-emerald-400" : "text-white"}`}>
                            {getGrade(totalScore).label}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <MessageSquare className="w-5 h-5 text-blue-500" /> บันทึกข้อเสนอแนะเพิ่มเติมจากคณะกรรมการ
                  </label>
                  <textarea
                    rows={6}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="ระบุข้อเสนอแนะเชิงบวกและจุดที่ควรพัฒนา..."
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
