import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  User, Shield, Landmark, School, Trash2, CheckCircle2, 
  ExternalLink, Code, Download, Copy, Check, Terminal, FileCode, AlertCircle
} from "lucide-react";
import { Teacher } from "../types";

interface AdminPanelProps {
  onLogout: () => void;
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"teachers" | "schools" | "mysql">("teachers");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // SQL & Windows setup instructions states
  const [sqlSchema, setSqlSchema] = useState("");
  const [windowsScript, setWindowsScript] = useState("");
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/teachers");
      const resData = await res.json();
      if (resData.success) {
        setTeachers(resData.teachers);
      }
    } catch (err) {
      console.error("Error fetching teachers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const res = await fetch("/api/schools");
      const resData = await res.json();
      if (resData.success) {
        setSchools(resData.schools || []);
      }
    } catch (err) {
      console.error("Error fetching schools List:", err);
    }
  };

  const fetchSqlExporterData = async () => {
    try {
      const res = await fetch("/api/db/export-sql");
      const resData = await res.json();
      if (resData.success) {
        setSqlSchema(resData.sql);
        setWindowsScript(resData.windows_script);
      }
    } catch (err) {
      console.error("Error fetching schema exporter:", err);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchSchools();
    fetchSqlExporterData();
  }, []);

  const handleApproveSchool = async (smissCode: string, currentStatus: string) => {
    setMessage(null);
    try {
      const newStatus = currentStatus === "approved" ? "pending" : "approved";
      const res = await fetch("/api/admin/schools/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smissCode, status: newStatus }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || "เกิดข้อผิดพลาดในการปรับเปลี่ยนสถานะ");

      setMessage({ type: "success", text: resData.message });
      fetchSchools();
      fetchTeachers(); // Refresh list to get linked teacher updates
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleApprove = async (teacherId: string, currentStatus: string) => {
    setMessage(null);
    try {
      const newStatus = currentStatus === "approved" ? "pending" : "approved";
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, status: newStatus }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || "เกิดข้อผิดพลาดในการอนุมัติ");

      setMessage({ type: "success", text: resData.message });
      fetchTeachers(); // Refresh list
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleDelete = async (teacherId: string) => {
    if (!window.confirm("คุณมั่นใจหรือไม่ว่าต้องการลบบัญชีและข้อตกลง PA ของครูคนนี้ออกจากระบบอย่างถาวร?")) return;
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/teachers/${teacherId}/delete`, {
        method: "POST",
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || "เกิดข้อผิดพลาดในการลบข้อมูล");

      setMessage({ type: "success", text: resData.message });
      fetchTeachers(); // Refresh list
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(windowsScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* Admin Central Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white shadow-md py-4 px-6 sticky top-0 z-45">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-500 text-slate-900 p-2 rounded-xl font-bold font-sans">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-base leading-tight">ระบบแผ่งงานผู้ดูแลระบบ (Admin)</h1>
              <p className="text-xs text-slate-400">ควบคุม ตรวจสอบ และอนุญาตสิทธิ์การแสดงลิงก์ประเมินของคุณครู</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="text-xs font-semibold px-4 py-1.5 border border-slate-700 hover:text-rose-400 hover:border-rose-900 rounded-lg transition-colors cursor-pointer"
            id="admin-logout-btn"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      {/* Stats and Navigation controls */}
      <section className="bg-white border-b border-slate-200 py-3 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveSubTab("teachers")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border-none cursor-pointer transition-colors ${activeSubTab === "teachers" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              id="subtab-teachers"
            >
              ควบคุมสิทธิ์รายชื่อคุณครู ({teachers.length})
            </button>
            <button
              onClick={() => setActiveSubTab("schools")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border-none cursor-pointer transition-colors ${activeSubTab === "schools" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              id="subtab-schools"
            >
              อนุมัติสิทธิ์จัดตั้งโรงเรียน ({schools.length})
            </button>
            <button
              onClick={() => setActiveSubTab("mysql")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border-none cursor-pointer transition-colors ${activeSubTab === "mysql" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              id="subtab-mysql"
            >
              คู่มือและสคริปต์ MySQL / Windows Setup
            </button>
          </div>

          <div className="text-xs text-slate-400 bg-slate-100/60 border border-slate-150 px-3 py-1.5 rounded-lg font-mono">
            DB TYPE: Memory with Local File Fallback (.json)
          </div>
        </div>
      </section>

      {/* Main Panel View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {message && (
          <div 
            className={`p-4 rounded-xl text-sm border font-sans ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}
            id="admin-alert-banner"
          >
            {message.text}
          </div>
        )}

        {/* TAB 1: TEACHERS CONTROL TABLE */}
        {activeSubTab === "teachers" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-250 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">รายชื่อการขอเพิ่มสิทธิ์ยื่นข้อตกลง PA และลิงก์ออนไลน์</h3>
                <p className="text-xs text-slate-500">อนุมัติคำขอส่งข้อมูลจากคุณครูเพื่อให้แสดงเป็นพอร์ตโฟลิโอแก่คณะกรรมการได้ทันที</p>
              </div>
              <button
                onClick={fetchTeachers}
                className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 cursor-pointer"
              >
                รีเฟรชข้อมูล
              </button>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-slate-400 italic">กำลังกระดานรายชื่อ...</div>
            ) : teachers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 italic">ไม่พบบันทึกการสมัครและอัปโหลดของครูในระบบ</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-4 px-5">ชื่อ-นามสกุลคุณครู</th>
                      <th className="py-4 px-5">สังกัดโรงเรียน/ตำแหน่ง</th>
                      <th className="py-4 px-5">ปีงบประมาณ</th>
                      <th className="py-4 px-5">ลิงก์ประเมินผล (Slug)</th>
                      <th className="py-4 px-5 text-center">สิทธิ์การออนไลน์</th>
                      <th className="py-4 px-5 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {teachers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-5">
                          <span className="font-bold text-slate-800 text-sm block">{t.name}</span>
                          <span className="text-slate-400 text-[10px] break-all">{t.email}</span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="font-semibold block">{t.school}</span>
                          <span className="text-slate-500">{t.position}</span>
                        </td>
                        <td className="py-4 px-5 font-mono text-slate-600">พ.ศ. {t.academicYear}</td>
                        <td className="py-4 px-5">
                          <a 
                            href={`/?p=${t.slug}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-amber-600 font-semibold inline-flex items-center gap-1 hover:underline font-mono"
                          >
                            /{t.slug}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="py-4 px-5 text-center">
                          {t.status === "approved" ? (
                            <span className="inline-block bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-150">
                              ออนไลน์สำร็จ
                            </span>
                          ) : (
                            <span className="inline-block bg-amber-50 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-150">
                              รอผู้ตรวจอนุมัติ
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleApprove(t.id, t.status)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-none transition-colors ${
                              t.status === "approved"
                                ? "bg-slate-100 text-slate-600 hover:bg-slate-250"
                                : "bg-emerald-500 text-white hover:bg-emerald-600"
                            }`}
                          >
                            {t.status === "approved" ? "ระงับชั่วคราว" : "อนุมัติใช้งาน"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id)}
                            className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg border-none cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SCHOOLS SYSTEM CONTROL PANEL */}
        {activeSubTab === "schools" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-250 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">รายชื่อคำขอจองจัดตั้งและเปิดใช้สิทธิ์ระดับเครือข่ายโรงเรียน</h3>
                <p className="text-xs text-slate-500">อนุมัติและคัดกรองใบสมัครโรงเรียน เพื่อมอบสิทธิ์การเป็น Admin โรงเรียนในการควบคุมครูเครือข่ายสังกัดเดียวกัน</p>
              </div>
              <button
                onClick={fetchSchools}
                className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 cursor-pointer"
              >
                รีเฟรชรหัสโรงเรียน
              </button>
            </div>

            {schools.length === 0 ? (
              <div className="p-12 text-center text-slate-400 italic">ไม่พบบันทึกการขอจัดตั้งโรงเรียนภายในเซิร์ฟเวอร์</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3.5 px-5">รหัสโรงเรียน (SMISS)</th>
                      <th className="py-3.5 px-5">ชื่อสถานศึกษา</th>
                      <th className="py-3.5 px-5">สังกัด / เครือข่ายเขตพื้นที่</th>
                      <th className="py-3.5 px-5">ผู้ดูแลระบบสิทธิ์ครูใหญ่</th>
                      <th className="py-3.5 px-5">สถานะ</th>
                      <th className="py-3.5 px-5 text-right">จัดการระบบสิทธิ์</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {schools.map((sch) => {
                      // Find registered school admin teacher email
                      const leadTeacher = teachers.find(t => t.id === sch.adminTeacherId);
                      return (
                        <tr key={sch.smissCode} className="hover:bg-slate-50">
                          <td className="py-4 px-5 font-mono font-semibold text-slate-900">
                            {sch.smissCode}
                          </td>
                          <td className="py-4 px-5 font-semibold text-slate-800">
                            {sch.name}
                          </td>
                          <td className="py-4 px-5 text-slate-600">
                            {sch.affiliation || "-"}
                          </td>
                          <td className="py-4 px-5">
                            {leadTeacher ? (
                              <div>
                                <p className="font-semibold text-slate-800">{leadTeacher.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{leadTeacher.email}</p>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">ไม่ได้กำหนดแอดมินหลัก</span>
                            )}
                          </td>
                          <td className="py-4 px-5">
                            {sch.status === "approved" ? (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-250">
                                เปิดสิทธิ์และอนุมัติแล้ว
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                รอการอนุมัติติดตั้ง
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-5 text-right">
                            {sch.status !== "approved" ? (
                              <button
                                onClick={() => handleApproveSchool(sch.smissCode, sch.status)}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg border-none cursor-pointer transition-colors"
                              >
                                อนุมัติสิทธิ์ก่อตั้ง
                              </button>
                            ) : (
                              <button
                                onClick={() => handleApproveSchool(sch.smissCode, sch.status)}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg cursor-pointer transition-colors"
                              >
                                ระงับการใช้งานโรงเรียน
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SQL SCHEMA & WINDOWS INSTALLATION GUIDE */}
        {activeSubTab === "mysql" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Steps explanations */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col space-y-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">คู่มือนักวิชาการ/ฝ่าย IT</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  การนำระบบบันทึก PA นี้ไปติดตั้งจริงบน Windows Server หรือสถาบันภายในโรงเรียน ให้เปิดใช้งาน MySQL และรันตามระบบสคริปต์นี้
                </p>
              </div>

              <div className="space-y-4.5 text-xs">
                <div className="flex border-l-4 border-amber-500 pl-3.5">
                  <div>
                    <strong className="block text-slate-800">ขั้นตอนที่ ๑: ติดตั้งฐานข้อมูล MySQL</strong>
                    <span className="text-slate-500 text-[11px]">เปิด Server MySQL เช่น ใน XAMPP หรือ AppServ แล้ว Copy และวางประโยค SQL ด้านขวาเพื่อสารองสร้างตาราง</span>
                  </div>
                </div>

                <div className="flex border-l-4 border-amber-500 pl-3.5">
                  <div>
                    <strong className="block text-slate-800">ขั้นตอนที่ ๒: Windows Action Script</strong>
                    <span className="text-slate-500 text-[11px]">ดาวน์โหลดรันไฟล์นามสกุล .bat หรือ .cmd จากสคริปต์ที่แถบเพื่อเตรียมสร้างระบบขับเคลื่อน Node.js</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-100 rounded-xl space-y-1 font-sans">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">โครงสร้างสัญญาวิชาการ:</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    ระบบพัฒนาด้วย Node Express มีความยืดหยุ่นสูง เพื่อต่อเข้ากับระบบ MySQL ได้ทันทีโดยการติดตั้งโมดูล <code className="font-mono bg-white px-1 py-0.5 rounded border">mysql2</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Script details */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* MySQL Script Block */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-250 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-sans text-slate-700 flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-amber-500" />
                    โครงสร้างเทเบิล MySQL (mysql_setup.sql)
                  </span>
                  <button
                    onClick={handleCopySql}
                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border-none cursor-pointer"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        คัดลอกแล้ว!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        คัดลอก SQL
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <pre className="p-4 bg-slate-900 text-slate-300 font-mono text-[10.5px] leading-relaxed rounded-xl overflow-x-auto max-h-[220px]">
                    {sqlSchema || "-- กำลังดึงสคริปต์ SQL จากฐานระบบ..."}
                  </pre>
                </div>
              </div>

              {/* Windows Script Block */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-250 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-sans text-slate-700 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-slate-700" />
                    สคริปต์ชุดคำสั่งรันระบบแบบอัตโนมัติ (windows_setup.bat)
                  </span>
                  <button
                    onClick={handleCopyScript}
                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border-none cursor-pointer"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        คัดลอกแล้ว!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        คัดลอก Script
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-slate-300 font-mono text-[10.5px] leading-relaxed rounded-xl overflow-x-auto max-h-[160px]">
                  {windowsScript || ":: กำลังรักษารูปแบบไฟล์..."}
                </pre>
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}
