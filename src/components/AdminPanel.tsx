import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  User, Shield, Landmark, School, Trash2, CheckCircle2, 
  ExternalLink, Code, Download, Copy, Check, Terminal, FileCode, AlertCircle, Cloud, LayoutGrid
} from "lucide-react";
import { Teacher } from "../types";

interface AdminPanelProps {
  onLogout: () => void;
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"teachers" | "schools" | "mysql" | "gas">("teachers");
  const [selectedSchoolCode, setSelectedSchoolCode] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // SQL & Windows setup instructions states
  const [sqlSchema, setSqlSchema] = useState("");
  const [windowsScript, setWindowsScript] = useState("");
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedGas, setCopiedGas] = useState(false);
  const [isTestingGas, setIsTestingGas] = useState(false);

  const testGasConnection = async (gasUrl: string, folderId: string) => {
    if (!gasUrl || !folderId) {
      setMessage({ type: "error", text: "กรุณาระบุ Web App URL และ Folder ID ก่อนทำการทดสอบ" });
      return;
    }

    setIsTestingGas(true);
    try {
      const response = await fetch("/api/proxy-gas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gasUrl: gasUrl,
          payload: { action: "testConnection", folderId: folderId }
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: "success", text: "เชื่อมต่อสำเร็จ! ระบบสามารถติดต่อ Google Drive ได้ปกติ" });
      } else {
        setMessage({ type: "error", text: "การทดสอบล้มเหลว: " + (data.error || "ไม่ทราบสาเหตุ") });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "ข้อผิดพลาดระบบการเชื่อมต่อ: " + err.message });
    } finally {
      setIsTestingGas(false);
    }
  };

  const gasCode = `/**
 * Google Apps Script for School File Storage Integration (VERSION 3.0 - STABLE)
 * รองรับ: อัปโหลดหลักฐาน (PDF/รูปภาพ/ไฟล์อื่นๆ) และสำรองข้อมูลคุณครู (JSON)
 * อัปเดตล่าสุด: ${new Date().toLocaleDateString('th-TH')}
 */

function doPost(e) {
  var JSON_RESPONSE = function(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  };

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return JSON_RESPONSE({ success: false, error: "No post data received" });
    }

    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;
    var folderId = requestData.folderId;
    
    if (!folderId) throw new Error("ไม่พบรหัสโฟลเดอร์ Google Drive (folderId)");
    
    var parentFolder;
    try {
      parentFolder = DriveApp.getFolderById(folderId);
    } catch(fErr) {
      throw new Error("ไม่สามารถเข้าถึงโฟลเดอร์ได้: เช็ค Folder ID หรือลืมแชร์โฟลเดอร์ให้เป็น 'Anyone with the link' หรือยัง?");
    }

    // 1. ACTION: UPLOAD FILE (Generic) 
    if (action === "uploadFile" || action === "uploadImage") {
      var teacherId = requestData.teacherId || "General";
      var fileName = requestData.fileName || ("file_" + Date.now());
      var rawData = requestData.fileData || requestData.imageBase64 || "";
      
      if (rawData.indexOf(",") > -1) {
        rawData = rawData.split(",")[1];
      }
      
      if (!rawData) throw new Error("ไม่พบข้อมูลไฟล์ (Base64) ในคำร้องขอ");
      
      var fileBytes;
      try {
        fileBytes = Utilities.base64Decode(rawData);
      } catch(bErr) {
        throw new Error("ไม่สามารถถอดรหัสไฟล์ได้ (Base64 Decode Failed)");
      }

      var contentType = requestData.contentType || "application/octet-stream";
      var teacherFolder = getOrCreateSubFolder(parentFolder, teacherId);
      
      var blob = Utilities.newBlob(fileBytes, contentType, fileName);
      var file = teacherFolder.createFile(blob);
      
      // ตั้งค่าแชร์ไฟล์อัตโนมัติ (Anyone with the link can view)
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      return JSON_RESPONSE({
        success: true,
        fileId: file.getId(),
        fileUrl: "https://lh3.googleusercontent.com/d/" + file.getId(),
        url: "https://lh3.googleusercontent.com/d/" + file.getId() // สำหรับความเข้ากันได้
      });
    }
    
    // 2. ACTION: SAVE TEACHER DATA (JSON BACKUP)
    if (action === "saveTeacherData") {
      var teacherId = requestData.teacherId;
      var teacherName = requestData.teacherName || "Teacher";
      if (!teacherId) throw new Error("Missing teacherId for backup");
      
      var portfolioContent = JSON.stringify(requestData.data, null, 2);
      var teacherFolder = getOrCreateSubFolder(parentFolder, teacherId);
      var backupFileName = "pa_portfolio_backup_" + teacherId + ".json";
      
      var files = teacherFolder.getFilesByName(backupFileName);
      if (files.hasNext()) {
        files.next().setContent(portfolioContent);
      } else {
        teacherFolder.createFile(backupFileName, portfolioContent, "application/json");
      }
      
      return JSON_RESPONSE({ 
        success: true, 
        message: "สำรองข้อมูลสำเร็จสำหรับ " + teacherName 
      });
    }

    // 3. ACTION: TEST CONNECTION
    if (action === "testConnection") {
      return JSON_RESPONSE({ 
        success: true, 
        message: "เชื่อมต่อกับ Google Apps Script สำเร็จ (Tested Folder: " + parentFolder.getName() + ")" 
      });
    }

    return JSON_RESPONSE({ success: false, error: "ไม่พบคำสั่ง (Action) '" + action + "' ในระบบสคริปต์" });

  } catch (error) {
    return JSON_RESPONSE({ success: false, error: "GAS Error: " + error.toString() });
  }
}

function getOrCreateSubFolder(parent, name) {
  var subFolders = parent.getFoldersByName(name);
  if (subFolders.hasNext()) return subFolders.next();
  return parent.createFolder(name);
}

function doGet(e) {
  return ContentService.createTextOutput("School Drive Connectivity v3.0 - Operational")
    .setMimeType(ContentService.MimeType.TEXT);
}`;

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

  const handleToggleSchoolAdmin = async (teacherId: string, smissCode: string, isCurrentlyAdminVisible: boolean) => {
    setMessage(null);
    try {
      const res = await fetch("/api/admin/teachers/set-school-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          smissCode,
          makeAdmin: !isCurrentlyAdminVisible
        })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || "เกิดข้อผิดพลาดในการกำหนดบทบาทแอดมิน");
      setMessage({ type: "success", text: resData.message });
      fetchTeachers();
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
              onClick={() => {
                setActiveSubTab("teachers");
                setSelectedSchoolCode(null);
              }}
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
            <button
              onClick={() => setActiveSubTab("gas")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border-none cursor-pointer transition-colors ${activeSubTab === "gas" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              id="subtab-gas"
            >
              ตั้งค่า Google Drive (School Storage)
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

        {/* TAB 1: TEACHERS CONTROL WITH SCHOOL CARDS */}
        {activeSubTab === "teachers" && (
          <div className="space-y-6">
            {!selectedSchoolCode ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">จัดการข้อมูลคุณครูแยกตามสถานศึกษา</h2>
                    <p className="text-sm text-slate-500">เลือกโรงเรียนเพื่อตรวจสอบรายชื่อและอนุมัติสิทธิ์การเข้าใช้งาน</p>
                  </div>
                  <button
                    onClick={fetchTeachers}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    รีเฟรชข้อมูลทั้งหมด
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Card for each school */}
                  {schools.map((sch) => {
                    const schoolTeachers = teachers.filter(t => t.schoolSmissCode === sch.smissCode);
                    const pendingCount = schoolTeachers.filter(t => t.status === "pending").length;
                    
                    return (
                      <motion.div
                        key={sch.smissCode}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group cursor-pointer ${pendingCount > 0 ? "border-amber-200 bg-amber-50/20" : ""}`}
                        onClick={() => setSelectedSchoolCode(sch.smissCode)}
                      >
                        {pendingCount > 0 && (
                          <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 animate-pulse">
                            <AlertCircle className="w-3 h-3" />
                            มี {pendingCount} รายชื่อรอดำเนินการ
                          </div>
                        )}
                        
                        <div className="flex items-start gap-4 mb-4">
                          <div className="bg-slate-100 text-slate-600 p-3 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                            <School className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate leading-tight mb-1">{sch.name}</h4>
                            <p className="text-[10px] text-slate-400 font-mono">SMISS: {sch.smissCode}</p>
                            <p className="text-[10px] text-slate-500 mt-1 truncate">{sch.affiliation}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-medium">สมาชิกคุณครู</span>
                            <span className="text-lg font-bold text-slate-800">{schoolTeachers.length} <span className="text-xs font-normal text-slate-400">ท่าน</span></span>
                          </div>
                          <button className="px-4 py-2 bg-slate-900 border-none text-white text-[11px] font-bold rounded-xl flex items-center gap-2 group-hover:bg-amber-600 transition-colors cursor-pointer">
                            ดูรายชื่อ <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Unassigned Teachers Card */}
                  {teachers.filter(t => !t.schoolSmissCode).length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl p-5 border border-slate-200 border-dashed shadow-sm hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setSelectedSchoolCode("unassigned")}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="bg-slate-100 text-slate-600 p-3 rounded-2xl">
                          <User className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm leading-tight mb-1">คุณครูที่ยังไม่ระบุสังกัด</h4>
                          <p className="text-[10px] text-slate-400">บัญชีที่ลงทะเบียนเข้ามารอยืนยันสังกัด</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-medium">รอการยืนยัน</span>
                          <span className="text-lg font-bold text-slate-800">{teachers.filter(t => !t.schoolSmissCode).length} <span className="text-xs font-normal text-slate-400">ท่าน</span></span>
                        </div>
                        <button className="px-4 py-2 bg-slate-700 text-white text-[11px] font-bold rounded-xl flex items-center gap-2 cursor-pointer border-none">
                          ตรวจสอบ <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </>
            ) : (
              /* DETAILED TEACHER TABLE VIEW */
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-250 overflow-hidden"
              >
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSelectedSchoolCode(null)}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-white text-slate-600 cursor-pointer"
                    >
                      <CheckCircle2 className="w-5 h-5 rotate-180" />
                    </button>
                    <div>
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        {selectedSchoolCode === "unassigned" 
                          ? "รายชื่อคุณครูยังไม่ระบุสังกัด" 
                          : schools.find(s => s.smissCode === selectedSchoolCode)?.name || "ไม่บชื่อโรงเรียน"}
                        <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-full">
                          {selectedSchoolCode === "unassigned" 
                            ? teachers.filter(t => !t.schoolSmissCode).length 
                            : teachers.filter(t => t.schoolSmissCode === selectedSchoolCode).length} ท่าน
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500">จัดการสิทธิ์การออนไลน์และอนุมัติคุณครูภายในสถานศึกษานี้</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchTeachers}
                      className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 hover:bg-white cursor-pointer bg-slate-50"
                    >
                      รีเฟรชรายชื่อ
                    </button>
                    <button
                      onClick={() => setSelectedSchoolCode(null)}
                      className="text-xs font-bold bg-slate-900 border-none text-white rounded-lg px-4 py-2 hover:bg-slate-800 cursor-pointer"
                    >
                      กลับไปหน้ารวม
                    </button>
                  </div>
                </div>

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
                      {teachers
                        .filter(t => selectedSchoolCode === "unassigned" ? !t.schoolSmissCode : t.schoolSmissCode === selectedSchoolCode)
                        .map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-5">
                            <span className="font-bold text-slate-800 text-sm block">{t.name}</span>
                            <span className="text-slate-400 text-[10px] break-all">{t.email}</span>
                            {t.idCard && (
                              <span className="text-slate-500 text-[10px] block font-mono">ID: {t.idCard}</span>
                            )}
                          </td>
                          <td className="py-4 px-5">
                            <span className="font-semibold block text-slate-700">{t.school}</span>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-slate-500 font-medium">{t.position}</span>
                              {t.role === "school_admin" && (
                                <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded">👑 School Admin</span>
                              )}
                              {t.role === "director" && (
                                <span className="bg-indigo-100 text-indigo-900 border border-indigo-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded">💼 ผู้อำนวยการ</span>
                              )}
                              {(!t.role || t.role === "teacher") && (
                                <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[9px] font-medium px-1.5 py-0.5 rounded">📝 ครูทั่วไป</span>
                              )}
                            </div>
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
                                ออนไลน์สำเร็จ
                              </span>
                            ) : (
                              <span className="inline-block bg-amber-50 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-150 animate-pulse">
                                รอผู้ตรวจอนุมัติ
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                            {t.schoolSmissCode && (
                              <button
                                type="button"
                                onClick={() => handleToggleSchoolAdmin(t.id, t.schoolSmissCode!, t.role === "school_admin")}
                                className={`px-2 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border transition-colors ${
                                  t.role === "school_admin"
                                    ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                    : "bg-slate-50 text-slate-750 border-slate-200 hover:bg-slate-150"
                                }`}
                                title="กำหนดบทบาทผู้บริหารแอดมินสำหรับการอนุมัติครูภายในสถาบัน"
                              >
                                {t.role === "school_admin" ? "👑 ปลดแอดมิน" : "👑 ตั้งเป็นแอดมิน"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleApprove(t.id, t.status)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-none transition-colors ${
                                t.status === "approved"
                                  ? "bg-slate-100 text-slate-600 hover:bg-slate-250"
                                  : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
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
              </motion.div>
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

        {/* TAB 4: GOOGLE APPS SCRIPT FOR GOOGLE DRIVE */}
        {activeSubTab === "gas" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col space-y-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">การเชื่อมต่อ Google Drive</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  โค้ดนี้จะช่วยให้ระบบของแต่ละโรงเรียนสามารถเก็บไฟล์งาน (PDF/รูปภาพ/คลิป) ลงใน Google Drive ของโรงเรียนได้โดยตรง
                </p>
              </div>

              <div className="space-y-4.5 text-xs">
                <div className="flex border-l-4 border-sky-500 pl-3.5">
                  <div>
                    <strong className="block text-slate-800">๑. สร้างโครงการใน Google Apps Script</strong>
                    <span className="text-slate-500 text-[11px]">เข้าสู่ระบบด้วย Gmail โรงเรียน แล้วสร้างโครงการใหม่ที่ <a href="https://script.google.com" target="_blank" className="text-sky-600 underline">script.google.com</a></span>
                  </div>
                </div>

                <div className="flex border-l-4 border-sky-500 pl-3.5">
                  <div>
                    <strong className="block text-slate-800">๒. วางโค้ดและเผยแพร่ (Deploy)</strong>
                    <span className="text-slate-500 text-[11px]">คัดลอกโค้ดด้านขวาไปวาง แล้วเลือก Deploy &gt; New Deployment เป็น "Web App" โดยตั้งค่าการเข้าถึงเป็น "Anyone"</span>
                  </div>
                </div>

                <div className="flex border-l-4 border-sky-500 pl-3.5">
                  <div>
                    <strong className="block text-slate-800">๓. นำ URL มากำหนดค่า</strong>
                    <span className="text-slate-500 text-[11px]">นำ Web App URL ที่ได้ไปตั้งค่าในระบบของ Admin โรงเรียน เพื่อให้ระบบเริ่มส่งไฟล์ไปยัง Drive ทันที</span>
                  </div>
                </div>

                <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span className="font-bold text-rose-900">ข้อควรระวังสำคัญ (สำคัญมาก):</span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    ๑. เมื่อคุณแก้ไขโค้ดต้องกด <strong>"Deploy &gt; New Deployment"</strong> เท่านั้น (การแก้ไขในจุดเดิมจะไม่ทำงาน)<br />
                    ๒. การตั้งค่าสิทธิ์ <strong>"Who has access"</strong> ต้องเลือกเป็น <strong>"Anyone"</strong> เท่านั้น<br />
                    ๓. หากหน้าจอค้างโค้ดเดิม ให้กด <strong>Ctrl + F5</strong> เพื่อรีเฟรชเบราว์เซอร์
                  </p>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 space-y-3 mt-4">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-white text-xs">เครื่องมือทดสอบการเชื่อมต่อ (Test Tool)</span>
                  </div>
                  <div className="space-y-2.5">
                    <input 
                      type="text" 
                      id="test-gas-url"
                      placeholder="วาง GAS Web App URL ของท่านที่นี่"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-[10px] text-emerald-400 font-mono outline-none focus:border-emerald-500"
                    />
                    <input 
                      type="text" 
                      id="test-folder-id"
                      placeholder="วาง Google Drive Folder ID ของท่านที่นี่"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-[10px] text-emerald-400 font-mono outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={() => {
                        const url = (document.getElementById("test-gas-url") as HTMLInputElement)?.value;
                        const id = (document.getElementById("test-folder-id") as HTMLInputElement)?.value;
                        testGasConnection(url, id);
                      }}
                      disabled={isTestingGas}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] cursor-pointer border-none transition-colors disabled:opacity-50"
                    >
                      {isTestingGas ? "กำลังทดสอบ..." : "ทดสอบส่งข้อมูล (Test Connection)"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-250 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-sans text-slate-700 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-sky-500" />
                    Google Apps Script (Code.gs)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(gasCode);
                      setCopiedGas(true);
                      setTimeout(() => setCopiedGas(false), 2000);
                    }}
                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border-none cursor-pointer"
                  >
                    {copiedGas ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        คัดลอกแล้ว!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        คัดลอกโค้ด
                      </>
                    )}
                  </button>
                </div>
                <div className="relative group">
                  <pre className="p-5 bg-slate-900 text-slate-300 font-mono text-[10.5px] leading-relaxed rounded-xl overflow-x-auto max-h-[450px]">
                    {gasCode}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
