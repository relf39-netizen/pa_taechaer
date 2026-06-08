import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, BookOpen, Star, MessageSquare, LogOut, CheckCircle2, 
  ExternalLink, ArrowLeft, Trophy, Search, School, User
} from "lucide-react";
import { Teacher, EvaluationResult } from "../types";
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
  const [part1Score, setPart1Score] = useState<number>(0);
  const [part2Score, setPart2Score] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

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
    setPart1Score(teacher.evaluation?.part1Score || 0);
    setPart2Score(teacher.evaluation?.part2Score || 0);
    setComment(teacher.evaluation?.comment || "");
    setViewingPortfolio(false);
  };

  const handleSaveEvaluation = async () => {
    if (!selectedTeacher) return;
    if (part1Score === 0 || part2Score === 0) {
      triggerToast("error", "กรุณาให้คะแนนให้ครบทั้ง 2 ส่วน");
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
          part1Score,
          part2Score,
          comment
        })
      });
      if (res.ok) {
        triggerToast("success", "บันทึกผลการประเมินเรียบร้อยแล้ว");
        fetchTeachers(); // Refresh list to update scores
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
      default: return "";
    }
  };

  const renderStars = (currentScore: number, setter: (val: number) => void) => (
    <div className="flex gap-2">
      {[1, 2, 3, 4].map((star) => (
        <button
          key={star}
          onClick={() => setter(star)}
          className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 group cursor-pointer ${
            currentScore >= star 
              ? "bg-amber-50 border-amber-400 text-amber-600" 
              : "bg-white border-slate-200 text-slate-300 hover:border-amber-200"
          }`}
        >
          <Star className={`w-8 h-8 ${currentScore >= star ? "fill-amber-400" : "group-hover:text-amber-200"}`} />
          <span className="text-[10px] font-bold">ระดับ {star}</span>
        </button>
      ))}
      <div className="ml-4 flex flex-col justify-center">
        <span className="text-sm font-bold text-slate-700">{currentScore > 0 ? getScoreLabel(currentScore) : "ยังไม่ได้ระบุคะแนน"}</span>
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
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full shadow-2xl hover:bg-slate-800 transition-all font-bold"
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
      {/* Top Header */}
      <header className="bg-[#1e3a8a] text-white py-4 px-6 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#facc15] text-[#1e3a8a] p-2 rounded-lg">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight uppercase tracking-tight">ระบบประเมินผล PA (คณะกรรมการ)</h1>
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
        {/* Left Column: Teacher List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                รายชื่อคุณครูที่รับการประเมิน
              </h2>
            </div>
            
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs text-slate-500 font-sans">กำลังดึงรายชื่อคุณครู...</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[calc(100vh-250px)] overflow-y-auto">
                {teachers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 italic text-xs">
                    ไม่พบรายชื่อคุณครูในสังกัด
                  </div>
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
                          <p className="text-xs font-bold text-slate-800">{teacher.name}</p>
                          <p className="text-[10px] text-slate-500">{teacher.position}</p>
                        </div>
                      </div>
                      {teacher.evaluation && (
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {(teacher.evaluation.part1Score + teacher.evaluation.part2Score) / 2}
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

        {/* Right Column: Evaluation Panel */}
        <div className="lg:col-span-8">
          {selectedTeacher ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px]"
            >
              {/* Teacher Summary Header */}
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
                    <h3 className="text-lg font-bold text-slate-900">{selectedTeacher.name}</h3>
                    <p className="text-sm text-slate-600">{selectedTeacher.position}</p>
                    <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold border border-blue-200 uppercase tracking-wider">
                      {selectedTeacher.school} | ปีงบ {selectedTeacher.academicYear || "-"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setViewingPortfolio(true)}
                  className="px-6 py-3 bg-[#1e3a8a] text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 border-none cursor-pointer"
                >
                  <BookOpen className="w-5 h-5" />
                  เปิดดูแฟ้มสะสมผลงาน (Portfolio)
                </button>
              </div>

              {/* Evaluation Body */}
              <div className="p-8 space-y-10 flex-1">
                {/* Part 1 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                    <div className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">1</div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">ส่วนที่ 1: ข้อตกลงในการพัฒนางานตามมาตรฐานตำแหน่ง</h4>
                      <p className="text-xs text-slate-500">ภาระงาน 3 ด้าน (15 ตัวชี้วัด) และหน้าที่รับผิดชอบตามเกณฑ์ ก.ค.ศ.</p>
                    </div>
                  </div>
                  {renderStars(part1Score, setPart1Score)}
                </div>

                {/* Part 2 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                    <div className="bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">2</div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">ส่วนที่ 2: ข้อตกลงในการพัฒนางานที่เป็นประเด็นท้าทาย</h4>
                      <p className="text-xs text-slate-500">การพัฒนาผลลัพธ์การเรียนรู้ของผู้เรียนตามเป้าหมายเชิงปริมาณและคุณภาพ</p>
                    </div>
                  </div>
                  {renderStars(part2Score, setPart2Score)}
                </div>

                {/* Combined Calculation */}
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">สรุปภาพรวมการประเมิน (PA Result)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                      <span className="text-sm text-slate-600">คะแนนเฉลี่ยสุทธิ</span>
                      <span className="text-2xl font-black text-blue-700">
                        {part1Score > 0 && part2Score > 0 ? ((part1Score + part2Score) / 2).toFixed(2) : "-"}
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                      <span className="text-sm text-slate-600">สถานะสรุป</span>
                      <span className={`text-sm font-bold ${part1Score > 0 && part2Score > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                        {part1Score > 0 && part2Score > 0 ? "ประเมินครบถ้วน" : "รอประเมินให้ครบถ้วน"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comments */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    ข้อความเสนอแนะหรือจุดเด่นเพิ่มเติมจากคณะกรรมการ
                  </label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="กรอกรายละเอียดความเห็นเพิ่มเติมเพื่อให้คุณครูนำไปพัฒนาต่อยอดงานในวิชาชีพ..."
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-sans text-sm outline-none"
                  />
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 italic">
                  * ข้อมูลการประเมินจะถูกบันทึกเข้าระบบโรงเรียนทันทีและไม่สามารถดูย้อนหลังข้ามโรงเรียนได้
                </div>
                <button
                  onClick={handleSaveEvaluation}
                  disabled={isSaving}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-base font-extrabold flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all border-none cursor-pointer"
                >
                  <Save className={`w-5 h-5 ${isSaving ? "animate-pulse" : ""}`} />
                  {isSaving ? "กำลังบันทึก..." : "ยืนยันผลการประเมิน"}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                <Search className="w-10 h-10" />
              </div>
              <div className="max-w-xs">
                <h3 className="text-xl font-bold text-slate-800">เลือกคุณครูเพื่อประเมินผล</h3>
                <p className="text-sm text-slate-400 leading-relaxed mt-2">โปรดเลือกรายชื่อข้าราชการครูที่สังกัดโรงเรียนของท่านจากรายการทางด้านซ้ายเพื่อดำเนินการประเมินข้อตกลง PA</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, x: "-50%" }}
            className={`fixed bottom-8 left-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[320px] ${
              toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <Star className="w-5 h-5" />}
            <span className="font-bold text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="py-6 text-center text-[10px] text-slate-400 font-sans">
        © 2026 ระบบบันทึกผลการประเมิน PA - พัฒนาขึ้นเพื่อข้าราชการครูไทย
      </footer>
    </div>
  );
}

const Save = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
