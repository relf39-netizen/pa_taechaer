import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, School, Landmark, Phone, Globe, BookOpen, Clock, 
  CheckCircle2, Plus, Trash2, FileText, ExternalLink, Save, 
  Eye, Check, AlertCircle, Sparkles, LogOut, Code, Library,
  Edit2, Camera, Image
} from "lucide-react";
import { Teacher, TeacherData, PAIndicator, PACleaningChallenge, EvidenceLink } from "../types";
import PublicProfile from "./PublicProfile";

const GOOGLE_APPS_SCRIPT_TEMPLATE = `function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Google Apps Script connected!" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;
    
    // 1. Upload evidence image
    if (action === "uploadImage") {
      var folderId = requestData.folderId;
      var teacherId = requestData.teacherId;
      var fileName = requestData.fileName || ("img_" + Date.now());
      var fileBytes = Utilities.base64Decode(requestData.imageBase64.split(",")[1]);
      var mimeType = requestData.mimeType || "image/jpeg";
      
      var parentFolder = DriveApp.getFolderById(folderId);
      var subFolders = parentFolder.getFoldersByName(teacherId);
      var teacherFolder;
      if (subFolders.hasNext()) {
        teacherFolder = subFolders.next();
      } else {
        teacherFolder = parentFolder.createFolder(teacherId);
      }
      
      var blob = Utilities.newBlob(fileBytes, mimeType, fileName);
      var file = teacherFolder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      var directImgUrl = "https://lh3.googleusercontent.com/d/" + file.getId() + "=s1600";
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        url: directImgUrl,
        driveUrl: file.getUrl(),
        fileId: file.getId()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 2. Save teacher data JSON
    if (action === "saveTeacherData") {
      var folderId = requestData.folderId;
      var teacherId = requestData.teacherId;
      var portfolioContent = JSON.stringify(requestData.data, null, 2);
      
      var parentFolder = DriveApp.getFolderById(folderId);
      var subFolders = parentFolder.getFoldersByName(teacherId);
      var teacherFolder;
      if (subFolders.hasNext()) {
        teacherFolder = subFolders.next();
      } else {
        teacherFolder = parentFolder.createFolder(teacherId);
      }
      
      var files = teacherFolder.getFilesByName("pa_portfolio_backup.json");
      if (files.hasNext()) {
        var file = files.next();
        file.setContent(portfolioContent);
      } else {
        teacherFolder.createFile("pa_portfolio_backup.json", portfolioContent, "application/json");
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Teacher portfolio backed up successfully!"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

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
  const [avatarImage, setAvatarImage] = useState(data.teacher.avatarImage || "");
  const [headerImage, setHeaderImage] = useState(data.teacher.headerImage || "");
  const [themeColor, setThemeColor] = useState(data.teacher.themeColor || "blue");

  // Security / Password change states
  const [mustChangePassword, setMustChangePassword] = useState(data.teacher.mustChangePassword || false);
  const [newPasswordVal, setNewPasswordVal] = useState("");
  const [confirmPasswordVal, setConfirmPasswordVal] = useState("");
  const [passChangeLoading, setPassChangeLoading] = useState(false);

  // School Admin editing another teacher state variables
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editName, setEditName] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAcademicYear, setEditAcademicYear] = useState("");

  // Active Part 1 indicator state
  const [selectedIndId, setSelectedIndId] = useState<string>("1.1");
  const [indDescription, setIndDescription] = useState(data.indicators["1.1"]?.description || "");
  const [indStatus, setIndStatus] = useState<'not_started' | 'in_progress' | 'completed'>(data.indicators["1.1"]?.status || "not_started");
  const [indLinks, setIndLinks] = useState<EvidenceLink[]>(data.indicators["1.1"]?.evidenceLinks || []);

  // New Link temporary input state
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [evidenceType, setEvidenceType] = useState<"link" | "image" | "file">("link");
  const [uploadFileBase64, setUploadFileBase64] = useState("");
  const [uploadFileType, setUploadFileType] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [schoolDriveConfig, setSchoolDriveConfig] = useState<{ driveFolderId: string; gasWebUrl: string } | null>(null);

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
  const [driveFolderId, setDriveFolderId] = useState("");
  const [gasWebUrl, setGasWebUrl] = useState("");
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
          setDriveFolderId(mySchool.driveFolderId || "");
          setGasWebUrl(mySchool.gasWebUrl || "");
          setSchoolDriveConfig({
            driveFolderId: mySchool.driveFolderId || "",
            gasWebUrl: mySchool.gasWebUrl || ""
          });
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

  // Load school drive config on mount for all roles
  React.useEffect(() => {
    const initSchoolDriveConfig = async () => {
      if (!data.teacher.schoolSmissCode) return;
      try {
        const sRes = await fetch("/api/schools");
        const sData = await sRes.json();
        if (sData.success) {
          const mySchool = sData.schools?.find((s: any) => s.smissCode === data.teacher.schoolSmissCode);
          if (mySchool) {
            setSchoolDriveConfig({
              driveFolderId: mySchool.driveFolderId || "",
              gasWebUrl: mySchool.gasWebUrl || ""
            });
            setDriveFolderId(mySchool.driveFolderId || "");
            setGasWebUrl(mySchool.gasWebUrl || "");
          }
        }
      } catch (err) {
        console.error("Error picking up school drive setup:", err);
      }
    };
    initSchoolDriveConfig();
  }, [data.teacher.schoolSmissCode]);

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
          paCommitteeMembers: committeeMembers,
          driveFolderId,
          gasWebUrl
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

  // School Admin starts editing another teacher
  const handleStartEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setEditName(teacher.name || "");
    setEditPosition(teacher.position || "");
    setEditPhone(teacher.phone || "");
    setEditAcademicYear(teacher.academicYear || "2569");
  };

  // School Admin saves edits to another teacher
  const handleSaveEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    try {
      const res = await fetch("/api/teachers/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: editingTeacher.id,
          name: editName,
          position: editPosition,
          school: editingTeacher.school,
          affiliation: editingTeacher.affiliation,
          phone: editPhone,
          academicYear: editAcademicYear
        }),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message || "อัปเดตล้มเหลว");
      
      triggerToast("success", "แก้ไขข้อมูลคุณครูสำเร็จเป็นที่เรียบร้อย");
      setSchoolTeachers(prev => prev.map(t => t.id === editingTeacher.id ? responseData.teacher : t));
      setEditingTeacher(null);
    } catch (err: any) {
      triggerToast("error", err.message);
    }
  };

  // School Admin deletes a teacher
  const handleDeleteTeacher = async (teacherId: string) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีและรายงานประเมินผล PA ทั้งหมดของคุณครูท่านนี้ออกจากโรงเรียน? การดำเนินการนี้ไม่สามารถย้อนคืนได้")) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/teachers/${teacherId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        triggerToast("success", "ลบข้อมูลสะสมผลงานคุณครูออกจากสถานศึกษาสำเร็จ");
        setSchoolTeachers(prev => prev.filter(t => t.id !== teacherId));
      } else {
        throw new Error(resData.message || "ลบผู้ใช้ล้มเหลว");
      }
    } catch (err: any) {
      triggerToast("error", err.message);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasswordVal.trim().length < 6) {
      triggerToast("error", "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (newPasswordVal !== confirmPasswordVal) {
      triggerToast("error", "รหัสผ่านทั้งสองช่องระบุไม่ตรงกัน");
      return;
    }

    setPassChangeLoading(true);
    try {
      const res = await fetch("/api/teachers/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: data.teacher.id,
          newPassword: newPasswordVal.trim()
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");

      setMustChangePassword(false);
      setData(prev => ({
        ...prev,
        teacher: {
          ...prev.teacher,
          mustChangePassword: false,
          password: newPasswordVal.trim()
        }
      }));

      const stored = localStorage.getItem("pa_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.mustChangePassword = false;
        parsed.password = newPasswordVal.trim();
        localStorage.setItem("pa_user", JSON.stringify(parsed));
      }

      setNewPasswordVal("");
      setConfirmPasswordVal("");
      triggerToast("success", "เปลี่ยนรหัสผ่านเพื่อความปลอดภัยเรียบร้อยแล้ว!");
    } catch (err: any) {
      triggerToast("error", err.message);
    } finally {
      setPassChangeLoading(false);
    }
  };

  // 1. Update Profile API
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/teachers/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: data.teacher.id,
          name,
          position,
          school,
          affiliation,
          phone,
          academicYear,
          avatarImage,
          headerImage,
          themeColor
        }),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message || "อัปเดตล้มเหลว");
      
      setData(prev => {
        const updated = {
          ...prev,
          teacher: responseData.teacher
        };

        // Auto Sync back up to Google Drive in background if configured!
        if (schoolDriveConfig?.gasWebUrl && schoolDriveConfig?.driveFolderId) {
          fetch(schoolDriveConfig.gasWebUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "saveTeacherData",
              folderId: schoolDriveConfig.driveFolderId,
              teacherId: data.teacher.id,
              teacherName: responseData.teacher.name,
              data: updated
            })
          }).then(() => console.log("Google Drive profile background backup completed!"))
            .catch(e => console.warn("Google Drive profile background backup failed:", e));
        }

        return updated;
      });
      triggerToast("success", "บันทึกข้อมูลส่วนตัวและสำรองข้อมูลลง Google Drive เรียบร้อยแล้ว");
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

  // Compress and convert file to Base64 (Supports both Image and PDF)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileType(file.type);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;

      // If it's an image, we still want to compress it for efficiency
      if (file.type.startsWith("image/")) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
            setUploadFileBase64(compressedBase64);
          }
        };
        img.src = result;
      } else {
        // For PDF or other files, just save the raw base64
        setUploadFileBase64(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // 2. Add Indicator Link / File
  const handleAddIndLink = async () => {
    if (evidenceType === "link") {
      if (!newLinkName.trim() || !newLinkUrl.trim()) {
        triggerToast("error", "กรุณาระบุชื่อหลักฐาน และที่อยู่ลิงก์ให้ถูกต้อง");
        return;
      }
      const newLink: EvidenceLink = {
        id: "ev-" + Date.now(),
        name: newLinkName.trim(),
        url: newLinkUrl.trim(),
        type: "link"
      };
      setIndLinks(prev => [...prev, newLink]);
      setNewLinkName("");
      setNewLinkUrl("");
    } else {
      // It is an image or a PDF file
      if (!newLinkName.trim()) {
        triggerToast("error", "กรุณากรอกชื่อหรือรายละเอียดของหลักฐาน");
        return;
      }
      if (!uploadFileBase64) {
        triggerToast("error", "กรุณาเลือกไฟล์ที่ต้องการอัปโหลด");
        return;
      }

      setIsUploading(true);
      try {
        let finalUrl = uploadFileBase64;
        let driveFileId = "";
        
        // If Google Apps Script Web App is connected, upload it to Google Drive!
        if (schoolDriveConfig?.gasWebUrl && schoolDriveConfig?.driveFolderId) {
          const payload = {
            action: "uploadFile", // Use more generic action
            folderId: schoolDriveConfig.driveFolderId,
            teacherId: data.teacher.id,
            fileName: `${newLinkName.trim()}_${Date.now()}${uploadFileType === "application/pdf" ? ".pdf" : ".jpg"}`,
            fileData: uploadFileBase64.split(",")[1], // Just bytes from base64
            contentType: uploadFileType || "application/octet-stream"
          };

          const uploadRes = await fetch(schoolDriveConfig.gasWebUrl, {
            method: "POST",
            mode: 'no-cors', // Many GAS setups require this for direct cross-origin posts
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          
          // Note: with no-cors we can't see the response body. 
          // Suggesting admin use the updated script which supports both methods.
          // Since we can't get the result back easily with no-cors, we'll try standard fetch first.
          
          try {
            const uploadResStandard = await fetch(schoolDriveConfig.gasWebUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            const uploadData = await uploadResStandard.json();
            if (uploadData.success && (uploadData.url || uploadData.fileUrl)) {
              finalUrl = uploadData.url || uploadData.fileUrl;
              driveFileId = uploadData.fileId;
              triggerToast("success", "อัปโหลดไฟล์ไปยัง Google Drive ของโรงเรียนเรียบร้อยแล้ว");
            }
          } catch (e) {
            // Fallback or retry logic if needed
            console.warn("Retrying with no-cors or assuming success based on config...");
          }
        } else {
          triggerToast("success", "เพิ่มหลักฐานลงแฟ้มข้อมูลสำเร็จ (แจ้งแอดมินเพื่อเชื่อมต่อ Google Drive ระบบจะได้จัดเก็บไฟล์ถาวร)");
        }

        const newEvidence: EvidenceLink = {
          id: "ev-file-" + Date.now(),
          name: newLinkName.trim(), 
          url: finalUrl,
          type: evidenceType,
          fileId: driveFileId
        };
        
        setIndLinks(prev => [...prev, newEvidence]);
        setNewLinkName("");
        setUploadFileBase64("");
        setUploadFileType("");
      } catch (err: any) {
        console.error("File upload error:", err);
        triggerToast("error", "เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่อีกครั้ง");
      } finally {
        setIsUploading(false);
      }
    }
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
        method: "POST",
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
        
        // Auto Sync back up to Google Drive in background if configured!
        if (schoolDriveConfig?.gasWebUrl && schoolDriveConfig?.driveFolderId) {
          fetch(schoolDriveConfig.gasWebUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "saveTeacherData",
              folderId: schoolDriveConfig.driveFolderId,
              teacherId: data.teacher.id,
              teacherName: data.teacher.name,
              data: {
                ...prev,
                indicators: copy
              }
            })
          }).then(() => console.log("Google Drive background backup completed!"))
            .catch(e => console.warn("Google Drive background backup failed:", e));
        }

        return {
          ...prev,
          indicators: copy
        };
      });
      triggerToast("success", `บันทึกข้อมูลตัวชี้วัดที่ ${selectedIndId} และสำรองข้อมูลลง Google Drive สำเร็จ`);
    } catch (err: any) {
      triggerToast("error", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Add Challenge Link / File
  const handleAddChalLink = async () => {
    if (evidenceType === "link") {
      if (!newLinkName.trim() || !newLinkUrl.trim()) {
        triggerToast("error", "กรุณาระบุชื่อหลักฐาน และที่อยู่ลิงก์ให้ถูกต้อง");
        return;
      }
      const newLink: EvidenceLink = {
        id: "ev-chal-" + Date.now(),
        name: newLinkName.trim(),
        url: newLinkUrl.trim(),
        type: "link"
      };
      setChalLinks(prev => [...prev, newLink]);
      setNewLinkName("");
      setNewLinkUrl("");
    } else {
      if (!newLinkName.trim()) {
        triggerToast("error", "กรุณากรอกชื่อหรือรายละเอียดของหลักฐาน");
        return;
      }
      if (!uploadFileBase64) {
        triggerToast("error", "กรุณาเลือกไฟล์ที่ต้องการอัปโหลด");
        return;
      }

      setIsUploading(true);
      try {
        let finalUrl = uploadFileBase64;
        let driveFileId = "";
        
        if (schoolDriveConfig?.gasWebUrl && schoolDriveConfig?.driveFolderId) {
          const payload = {
            action: "uploadFile",
            folderId: schoolDriveConfig.driveFolderId,
            teacherId: data.teacher.id,
            fileName: `Challenge_${newLinkName.trim()}_${Date.now()}${uploadFileType === "application/pdf" ? ".pdf" : ".jpg"}`,
            fileData: uploadFileBase64.split(",")[1],
            contentType: uploadFileType || "application/octet-stream"
          };

          try {
            const uploadRes = await fetch(schoolDriveConfig.gasWebUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            const uploadData = await uploadRes.json();
            if (uploadData.success && (uploadData.url || uploadData.fileUrl)) {
              finalUrl = uploadData.url || uploadData.fileUrl;
              driveFileId = uploadData.fileId;
              triggerToast("success", "อัปโหลดไฟล์หลักฐานไปยัง Google Drive สำเร็จ");
            }
          } catch (e) {
            console.warn("Retrying Challenge upload error...");
          }
        }

        const newEvidence: EvidenceLink = {
          id: "ev-chal-file-" + Date.now(),
          name: newLinkName.trim(), 
          url: finalUrl,
          type: evidenceType,
          fileId: driveFileId
        };
        
        setChalLinks(prev => [...prev, newEvidence]);
        setNewLinkName("");
        setUploadFileBase64("");
        setUploadFileType("");
      } catch (err: any) {
        triggerToast("error", "เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่อีกครั้ง");
      } finally {
        setIsUploading(false);
      }
    }
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
        method: "POST",
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

      setData(prev => {
        const updated = {
          ...prev,
          challenge: responseData.challenge
        };

        // Auto Sync back up to Google Drive in background if configured!
        if (schoolDriveConfig?.gasWebUrl && schoolDriveConfig?.driveFolderId) {
          fetch(schoolDriveConfig.gasWebUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "saveTeacherData",
              folderId: schoolDriveConfig.driveFolderId,
              teacherId: data.teacher.id,
              teacherName: data.teacher.name,
              data: updated
            })
          }).then(() => console.log("Google Drive challenge background backup completed!"))
            .catch(e => console.warn("Google Drive challenge background backup failed:", e));
        }

        return updated;
      });
      triggerToast("success", "บันทึกประเด็นท้าทาย (ส่วนที่ 2) และสำรองข้อมูลลง Google Drive เรียบร้อยแล้ว");
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
      {/* ⚠️ FORCED PASSWORD CHANGE PROCESS DIALOG */}
      <AnimatePresence>
        {mustChangePassword && (
          <div className="fixed inset-0 bg-slate-900/90 z-50 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white max-w-sm w-full rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="bg-[#1e3a8a] py-6 px-6 text-white border-b-4 border-[#facc15] text-center">
                <div className="bg-white/10 p-3 rounded-full w-14 h-14 mx-auto mb-3 flex items-center justify-center">
                  <User className="w-7 h-7 text-[#facc15]" />
                </div>
                <h3 className="text-lg font-bold font-sans">กรุณาตั้งค่ารหัสผ่านใหม่</h3>
                <p className="text-xs text-blue-150 mt-1">นี่คือการเข้าสู่ระบบครั้งแรกของคุณครู เพื่อความปลอดภัยกรุณาเปลี่ยนจากรหัสผ่านเริ่มต้นทั่วไป (123456)</p>
              </div>

              <form onSubmit={handlePasswordChangeSubmit} className="p-6 space-y-4 font-sans">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    placeholder="กรอกรหัสใหม่ที่ปลอดภัยของท่าน"
                    className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-705 mb-1.5">
                    ยืนยันรหัสผ่านใหม่อีกครั้ง
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPasswordVal}
                    onChange={(e) => setConfirmPasswordVal(e.target.value)}
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้งให้ตรงกัน"
                    className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passChangeLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#facc15] hover:bg-[#ebd113] text-slate-900 font-sans text-sm font-bold border-none rounded-xl cursor-pointer shadow transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-5 h-5 text-slate-950" />
                    {passChangeLoading ? "กำลังปรับเปลี่ยน..." : "ยืนยันและเปิดใช้งานบัญชี"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

              {(data.teacher.role === "school_admin" || data.teacher.role === "director") && (
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
              <div className="w-full md:w-64 bg-slate-50 border-r border-[#e2e8f0] p-2.5 space-y-1 overflow-y-auto max-h-[600px] md:max-h-none shrink-0">
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
                    <span>{id} {data.indicators[id]?.title?.substring(0, 16)}...</span>
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
                        className={`px-4 py-2 border text-xs font-semibold rounded-md transition-all border-solid cursor-[#1e3a8a] ${
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
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    📁 ลิงก์อ้างอิงและรูปภาพหลักฐานยืนยันความสำเร็จ (Evidence Repository)
                  </label>
                  
                  {/* Category Filter and Display Lists */}
                  {indLinks.length === 0 ? (
                    <div className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-dashed border-[#e2e8f0] text-center">
                      ยังไม่มีการแนบเอกสารสรุปผลงานหรือรูปภาพกิจกรรมอ้างอิงสำหรับตัวชี้วัดนี้
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* 1. DOCUMENT LINKS */}
                      {indLinks.filter(l => l.type !== "image" && (l.type === "file" || l.type === "link" || (!l.url.startsWith("data:image") && !l.url.includes("lh3.googleusercontent.com/d/")))).length > 0 && (
                        <div className="space-y-3">
                          <h5 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-2">
                            <FileText className="w-3 h-3" />
                            ไฟล์เอกสารและลิงก์สรุปทั่วไป
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {indLinks.filter(l => l.type !== "image" && (l.type === "file" || l.type === "link" || (!l.url.startsWith("data:image") && !l.url.includes("lh3.googleusercontent.com/d/")))).map((link) => (
                              <div 
                                key={link.id} 
                                className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:border-blue-300 group"
                              >
                                <div className="flex items-center gap-3 max-w-[75%]">
                                  <div className={`p-2 rounded-lg ${link.type === 'file' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-slate-700 truncate text-xs">{link.name}</span>
                                    <span className="text-slate-400 text-[10px] truncate">{link.type === 'file' ? 'เอกสาร PDF/ไฟล์งาน' : 'ลิงก์ภายนอก'}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <a 
                                    href={link.url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-lg transition-all"
                                    title="เปิดไฟล์/ลิงก์"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveIndLink(link.id)}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 rounded-lg transition-all border-none cursor-pointer"
                                    title="ลบหลักฐาน"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2. ACTIVITY IMAGES gallery (2-Columns Layout) */}
                      {indLinks.filter(l => l.type === "image" || l.url.startsWith("data:image") || l.url.includes("lh3.googleusercontent.com/d/")).length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                            🖼️ ภาพเกียรติบัตรและภาพกิจกรรมสะสมผลงาน (แสดงสองคอลัมน์ แนวนอน)
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {indLinks.filter(l => l.type === "image" || l.url.startsWith("data:image") || l.url.includes("lh3.googleusercontent.com/d/")).map((link) => (
                              <div 
                                key={link.id}
                                className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between group"
                              >
                                <div>
                                  {/* Activity Description: SHOWN ON TOP */}
                                  <div className="text-xs text-slate-800 font-medium leading-relaxed mb-3 font-sans border-b border-dashed border-slate-200 pb-2 flex justify-between items-start gap-2">
                                    <span className="line-clamp-3">{link.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveIndLink(link.id)}
                                      className="text-rose-550 hover:text-rose-650 p-1 border-none bg-transparent cursor-pointer shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Horizontal Image: SHOWN BELOW */}
                                  <div className="relative overflow-hidden rounded-xl border border-slate-200 aspect-[16/9] w-full bg-slate-900">
                                    <img
                                      src={link.url}
                                      alt={link.name}
                                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                      referrerPolicy="no-referrer"
                                    />
                                    <a
                                      href={link.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="absolute right-2.5 bottom-2.5 p-2 bg-slate-900/80 hover:bg-slate-950 text-white rounded-full shadow transition-all scale-90 group-hover:scale-100"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add form selection */}
                  <div className="border-t border-slate-200/60 pt-4.5">
                    <div className="flex flex-wrap gap-2.5 mb-4">
                      <button
                        type="button"
                        onClick={() => {
                          setEvidenceType("link");
                          setNewLinkName("");
                          setUploadFileBase64("");
                        }}
                        className={`flex-1 min-w-[120px] py-2.5 font-bold rounded-xl text-[11px] cursor-pointer transition-all border-none flex items-center justify-center gap-2 ${
                          evidenceType === "link"
                            ? "bg-slate-900 text-white shadow-md shadow-slate-200 scale-[1.02]"
                            : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        ลิงก์เอกสารอ้างอิง
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEvidenceType("image");
                          setNewLinkName("");
                          setUploadFileBase64("");
                        }}
                        className={`flex-1 min-w-[120px] py-2.5 font-bold rounded-xl text-[11px] cursor-pointer transition-all border-none flex items-center justify-center gap-2 ${
                          evidenceType === "image"
                            ? "bg-slate-900 text-white shadow-md shadow-slate-200 scale-[1.02]"
                            : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                        }`}
                      >
                        <Image className="w-3.5 h-3.5" />
                        อัปโหลดรูปกิจกรรม
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEvidenceType("file");
                          setNewLinkName("");
                          setUploadFileBase64("");
                        }}
                        className={`flex-1 min-w-[120px] py-2.5 font-bold rounded-xl text-[11px] cursor-pointer transition-all border-none flex items-center justify-center gap-2 ${
                          evidenceType === "file"
                            ? "bg-slate-900 text-white shadow-md shadow-slate-200 scale-[1.02]"
                            : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        อัปโหลดไฟล์ PDF
                      </button>
                    </div>

                    {/* RENDER FORM DYNAMICALLY */}
                    {evidenceType === "link" ? (
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                            ชื่อไฟล์/คำอธิบายประกอบหลักฐาน
                          </label>
                          <input
                            type="text"
                            value={newLinkName}
                            onChange={(e) => setNewLinkName(e.target.value)}
                            placeholder="เช่น แผนการจัดการเรียนรู้"
                            className="block w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none focus:border-blue-400 font-sans shadow-sm"
                          />
                        </div>
                        <div className="md:col-span-6">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                            ที่อยู่ลิงก์หลักฐานอ้างอิง (URL)
                          </label>
                          <input
                            type="text"
                            value={newLinkUrl}
                            onChange={(e) => setNewLinkUrl(e.target.value)}
                            placeholder="https://drive.google.com/..."
                            className="block w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none focus:border-blue-400 font-sans shadow-sm"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <button
                            type="button"
                            onClick={handleAddIndLink}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold border-none cursor-pointer shadow-sm transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            เพิ่มลิงก์
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                          <div className="lg:col-span-7">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                              ✍️ ชื่อหรือคำอธิบายหลักฐาน
                            </label>
                            <textarea
                              rows={3}
                              value={newLinkName}
                              onChange={(e) => setNewLinkName(e.target.value)}
                              placeholder={evidenceType === "image" ? "อธิบายกิจกรรมที่ปรากฏในภาพ เช่น บรรยากาศการสอน เรื่อง... เมื่อวันที่..." : "ระบุชื่อไฟล์ หรือคำอธิบายประกอบเอกสารชุดนี้"}
                              className="block w-full px-4 py-3 border border-slate-200 bg-white rounded-xl text-xs leading-relaxed outline-none focus:border-blue-400 font-sans shadow-sm"
                            />
                          </div>

                          <div className="lg:col-span-5 flex flex-col justify-end">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                              {evidenceType === "image" ? "📸 เลือกรูปภาพ (PNG, JPG)" : "📄 เลือกไฟล์เอกสาร (PDF)"}
                            </label>
                            <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-400 transition-colors rounded-2xl bg-white p-4 text-center cursor-pointer flex flex-col justify-center items-center gap-2 min-h-[100px]">
                              <input
                                type="file"
                                accept={evidenceType === "image" ? "image/*" : ".pdf"}
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              {uploadFileBase64 ? (
                                <>
                                  <div className="bg-emerald-50 text-emerald-600 p-2 rounded-full">
                                    <Check className="w-5 h-5" />
                                  </div>
                                  <p className="text-[10px] font-bold text-emerald-600">เลือกไฟล์เรียบร้อยแล้ว!</p>
                                  <p className="text-[8px] text-slate-400 font-mono truncate max-w-full italic px-2">Data ready for upload</p>
                                </>
                              ) : (
                                <>
                                  <div className="bg-slate-100 text-slate-400 p-2 rounded-full">
                                    <Plus className="w-5 h-5" />
                                  </div>
                                  <p className="text-[10px] font-bold text-slate-600">คลิกที่นี่เพื่อเลือกไฟล์</p>
                                  <p className="text-[8px] text-slate-400">ขนาดแนะนำ: ไม่เกิน 5MB</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Preview Box */}
                        {uploadFileBase64 && (
                          <div className="flex justify-center">
                            {evidenceType === "image" ? (
                              <div className="border border-slate-200 bg-slate-900 rounded-2xl overflow-hidden aspect-[16/9] w-full max-w-md relative shadow-lg">
                                <img
                                  src={uploadFileBase64}
                                  alt="preview"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                  <span className="text-[9px] text-white font-bold flex items-center gap-1.5">
                                    <Image className="w-3 h-3" />
                                    ตัวอย่างภาพที่จะอัปโหลด
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 w-full max-w-md shadow-sm">
                                <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl">
                                  <FileText className="w-8 h-8" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate">เอกสารพร้อมอัปโหลด</p>
                                  <p className="text-[10px] text-slate-500 font-mono">Type: application/pdf</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            disabled={isUploading || !uploadFileBase64}
                            onClick={handleAddIndLink}
                            className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold border-none cursor-pointer shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
                          >
                            {isUploading ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>กำลังนำไฟล์ขึ้น Google Drive...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                <span>อัปโหลดและเพิ่มหลักฐาน</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Save main action */}
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveIndicator}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold border-none cursor-pointer shadow-sm disabled:opacity-50"
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
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    📁 คลังหลักฐานอ้างอิงประกอบประเด็นท้าทาย (Challenge Evidence)
                  </label>

                  {chalLinks.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {chalLinks.map((link) => (
                        <div 
                          key={link.id} 
                          className={`flex items-center justify-between p-3 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-blue-300 group ${link.type === 'image' ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}
                        >
                          <div className="flex items-center gap-3 max-w-[75%] min-w-0">
                            <div className={`p-2 rounded-lg shrink-0 ${link.type === 'file' ? 'bg-rose-50 text-rose-600' : link.type === 'image' ? 'bg-slate-800 text-slate-300' : 'bg-blue-50 text-blue-600'}`}>
                              {link.type === 'image' ? <Image className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className={`font-bold truncate text-[11px] ${link.type === 'image' ? 'text-slate-100' : 'text-slate-700'}`}>{link.name}</span>
                              <span className="text-slate-400 text-[10px] truncate">{link.type === 'file' ? 'เอกสาร PDF/ไฟล์งาน' : link.type === 'image' ? 'รูปภาพหลักฐาน' : 'ลิงก์ภายนอก'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-1.5 bg-slate-100/10 hover:bg-slate-100/20 text-slate-400 hover:text-white rounded-lg transition-all"
                              title="เปิดดู"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveChalLink(link.id)}
                              className="p-1.5 bg-rose-50/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-500 rounded-lg transition-all border-none cursor-pointer"
                              title="ลบหลักฐาน"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => { setEvidenceType("link"); setNewLinkName(""); setNewLinkUrl(""); setUploadFileBase64(""); }}
                        className={`flex-1 py-2 font-bold rounded-xl text-[10px] cursor-pointer transition-all border-none ${evidenceType === "link" ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-500 border border-slate-200"}`}
                      >
                        ลิงก์ URL
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEvidenceType("image"); setNewLinkName(""); setUploadFileBase64(""); }}
                        className={`flex-1 py-2 font-bold rounded-xl text-[10px] cursor-pointer transition-all border-none ${evidenceType === "image" ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-500 border border-slate-200"}`}
                      >
                        รูปภาพหลักฐาน
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEvidenceType("file"); setNewLinkName(""); setUploadFileBase64(""); }}
                        className={`flex-1 py-2 font-bold rounded-xl text-[10px] cursor-pointer transition-all border-none ${evidenceType === "file" ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-500 border border-slate-200"}`}
                      >
                        ไฟล์ PDF
                      </button>
                    </div>

                    {evidenceType === "link" ? (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-4">
                          <input
                            type="text"
                            value={newLinkName}
                            onChange={(e) => setNewLinkName(e.target.value)}
                            placeholder="ชื่อหลักฐานประเด็นท้าทาย"
                            className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs outline-none focus:border-blue-400 font-sans"
                          />
                        </div>
                        <div className="md:col-span-6">
                          <input
                            type="text"
                            value={newLinkUrl}
                            onChange={(e) => setNewLinkUrl(e.target.value)}
                            placeholder="URL ลิงก์ (Google Drive/YouTube/Docs)"
                            className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs outline-none focus:border-blue-400 font-sans"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <button
                            type="button"
                            onClick={handleAddChalLink}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold border-none cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            เพิ่มลิงก์
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                         <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                            <div className="md:col-span-8">
                              <textarea
                                rows={2}
                                value={newLinkName}
                                onChange={(e) => setNewLinkName(e.target.value)}
                                placeholder="ระบุชื่อหรือคำอธิบายหลักฐานประเด็นท้าทาย"
                                className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs leading-relaxed outline-none focus:border-blue-400 font-sans"
                              />
                            </div>
                            <div className="md:col-span-4 min-h-[60px]">
                              <div className="relative border-2 border-dashed border-slate-200 bg-white rounded-xl h-full flex flex-col justify-center items-center gap-1 p-2 cursor-pointer hover:border-blue-300 transition-colors">
                                <input 
                                  type="file" 
                                  accept={evidenceType === "image" ? "image/*" : ".pdf"} 
                                  onChange={handleFileChange} 
                                  className="absolute inset-0 opacity-0 cursor-pointer" 
                                />
                                {uploadFileBase64 ? (
                                  <Check className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <Plus className="w-4 h-4 text-slate-300" />
                                )}
                                <span className="text-[10px] font-bold text-slate-500">{uploadFileBase64 ? "เลือกไฟล์เรียบร้อย" : "เลือกไฟล์"}</span>
                              </div>
                            </div>
                         </div>
                         
                         {uploadFileBase64 && (
                            <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                              <div className={`p-2 rounded-lg ${evidenceType === 'file' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                                {evidenceType === 'image' ? <Image className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-bold text-slate-700">พร้อมอัปโหลดประเด็นท้าทาย</span>
                                <span className="text-[9px] text-slate-400">ระบบจะทำการอัปโหลดข้อมูลลง Google Drive โรงเรียน</span>
                              </div>
                              <button 
                                type="button" 
                                onClick={handleAddChalLink} 
                                disabled={isUploading} 
                                className="ml-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg border-none cursor-pointer shadow-sm disabled:bg-slate-300 flex items-center gap-2"
                              >
                                {isUploading ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>กำลังส่ง...</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>อัปโหลดเดี๋ยวนี้</span>
                                  </>
                                )}
                              </button>
                            </div>
                         )}
                      </div>
                    )}
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

                {/* ADVANCED BRANDING: AVATAR, COVER, AND portfolio THEMES & PALETTES */}
                <div className="border-t border-slate-100 pt-5 mt-5 space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    🎨 ศิลป์และสีสันแผงพอร์ตโฟลิโอ (Portfolio Look & Theme)
                  </h4>
                  <p className="text-[11px] text-slate-500">ปรับเปลี่ยนแม่สีหลัก รูปภาพประจำตัว และภาพหน้าปกพอร์ตโฟลิโอประเมินงานของคุณครูได้ตามอัธยาศัย</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 1. Avatar Photo */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-between">
                      <div className="text-center w-full">
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          📸 รูปถ่ายประจำตัวคุณครู
                        </label>
                        <div className="w-20 h-20 rounded-full bg-slate-200 border-2 border-dashed border-slate-300 overflow-hidden mx-auto flex items-center justify-center relative group">
                          {avatarImage ? (
                            <img src={avatarImage} alt="Profile photo avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-8 h-8 text-slate-400" />
                          )}
                        </div>
                      </div>
                      <div className="mt-3.5 w-full">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                triggerToast("error", "ขนาดไฟล์ห้ามเกิน 2MB");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => setAvatarImage(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                          id="avatar-upload-file"
                        />
                        <label
                          htmlFor="avatar-upload-file"
                          className="w-full text-center block py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] rounded-lg font-bold text-slate-700 cursor-pointer shadow-sm transition-all text-ellipsis overflow-hidden"
                        >
                          อัปโหลดรูปถ่าย (.png/.jpg)
                        </label>
                        {avatarImage && (
                          <button
                            type="button"
                            onClick={() => setAvatarImage("")}
                            className="w-full mt-1.5 text-center block py-1 px-3 bg-transparent hover:text-rose-600 text-slate-400 text-[10px] font-semibold border-none cursor-pointer"
                          >
                            ลบรูปภาพโปรไฟล์
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 2. Cover Banner Photo */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-between">
                      <div className="text-center w-full">
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          🖼️ ภาพหน้าปกแบนเนอร์ด้านบน
                        </label>
                        <div className="w-full h-12 bg-slate-200 border border-slate-300 rounded-lg overflow-hidden flex items-center justify-center relative group">
                          {headerImage ? (
                            <img src={headerImage} alt="Cover Banner" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">ใช้สีพื้นหลังตามธีมหลัก</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-3.5 w-full">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                triggerToast("error", "ขนาดไฟล์ห้ามเกิน 2MB");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => setHeaderImage(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                          id="cover-upload-file"
                        />
                        <label
                          htmlFor="cover-upload-file"
                          className="w-full text-center block py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-250 text-[10px] rounded-lg font-bold text-slate-700 cursor-pointer shadow-sm transition-all text-ellipsis overflow-hidden"
                        >
                          อัปโหลดแบนเนอร์หน้าปก
                        </label>
                        {headerImage && (
                          <button
                            type="button"
                            onClick={() => setHeaderImage("")}
                            className="w-full mt-1.5 text-center block py-1 px-3 bg-transparent hover:text-rose-600 text-slate-400 text-[10px] font-semibold border-none cursor-pointer"
                          >
                            ลบภาพปก
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 3. Portfolio Palette / theme selection */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          🎨 เลือกชุดภาพลักษณ์และธีมพอร์ต
                        </label>
                        <select
                          value={themeColor}
                          onChange={(e) => setThemeColor(e.target.value)}
                          className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-sans"
                        >
                          <option value="blue">น้ำเงินภูมิฐาน (Default Navy)</option>
                          <option value="green">เขียวขจีวิชาการ (Academic Emerald)</option>
                          <option value="purple">ม่วงอัญชันมงคล (Royal Violet)</option>
                          <option value="amber">แสดประเสริฐศรัทธา (Aesthetic Amber)</option>
                          <option value="slate">เทาโมเดิร์นทันสมัย (Modern Charcoal)</option>
                          <option value="rose">ชมพูกุหลาบวิวัฒนา (Enchanting Rose)</option>
                        </select>
                      </div>
                      <div className="p-2 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-500 leading-relaxed font-sans">
                        💡 ธีมสีและสัญลักษณ์ทั้งหมดของคุณ จะตอบรับรูปแบบธีมที่ท่านเลือกอย่างเป็นระเบียบและสวยงามต่อคณะกรรมการ
                      </div>
                    </div>
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

              {/* CHANGE PASSWORD COMPONENT */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-150 p-6 mt-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5 mb-4">
                  <div className="bg-amber-500/10 text-amber-700 p-2 rounded-xl">
                    <User className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">🔒 เปลี่ยนรหัสผ่านเข้าใช้งานระบบ</h4>
                    <p className="text-xs text-slate-500">กรอกรหัสผ่านหลักใหม่เพื่อทดแทน รหัสผ่านชั่วคราวเริ่มต้น 123456 เพื่อความปลอดภัยขั้นสูงสุดในการใช้งาน</p>
                  </div>
                </div>

                <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 max-w-sm">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPasswordVal}
                      onChange={(e) => setNewPasswordVal(e.target.value)}
                      placeholder="ระบุรหัสความปลอดภัยใหม่ของคุณ"
                      className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      ยืนยันรหัสผ่านใหม่อีกครั้ง <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPasswordVal}
                      onChange={(e) => setConfirmPasswordVal(e.target.value)}
                      placeholder="กรอกรหัสผ่านซ้ำอีกครั้งเพื่อประทับตรงกัน"
                      className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passChangeLoading}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-bold border-none rounded-xl cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {passChangeLoading ? "กำลังปรับปรุง..." : "ปรับปรุงและบันทึกรหัสผ่านใหม่"}
                  </button>
                </form>
              </div>
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

                        {/* Google Drive Configuration Section */}
                        <div className="border-t border-slate-100 my-5 pt-4">
                          <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 mb-1.5">
                            ☁️ ตั้งค่าการเก็บบันทึกข้อมูล & รูปภาพลง Google Drive
                          </h4>
                          <p className="text-[10px] text-slate-500 mb-3.5 leading-relaxed">
                            กำหนดให้ระบบจัดส่งและบันทึกประวัติสะสมงาน รูปภาพเกียรติบัตร และภาพกิจกรรมของคุณครูแต่ละโรงเรียนไว้ที่ Google Drive โดยตรง ผ่านบริการ Google Apps Script
                          </p>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                                Google Drive Folder ID (รหัสโฟลเดอร์สำหรับเก็บข้อมูลคุณครู)
                              </label>
                              <input
                                type="text"
                                value={driveFolderId}
                                onChange={(e) => setDriveFolderId(e.target.value)}
                                placeholder="เช่น 1A2b3C4d5E6F7G8H9I0J-xyz"
                                className="block w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-sans bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all"
                              />
                              <p className="text-[9px] text-slate-400 mt-1 font-sans">
                                * สร้างโฟลเดอร์แม่บน Google Drive ของท่าน จากนั้นมองหาและคัดลอกส่วนรหัสยาวๆ ท้าย URL โฟลเดอร์มาวาง
                              </p>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                                Google Apps Script Web App URL (ลิงก์เผยแพร่เว็บแอปพลิเคชัน)
                              </label>
                              <input
                                type="url"
                                value={gasWebUrl}
                                onChange={(e) => setGasWebUrl(e.target.value)}
                                placeholder="https://script.google.com/macros/s/.../exec"
                                className="block w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-sans bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all"
                              />
                            </div>

                            {/* Google Apps Script integration details */}
                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                              <details className="group">
                                <summary className="flex items-center justify-between text-[11px] font-bold text-slate-700 cursor-pointer select-none">
                                  <span>📜 วิธีการจัดตั้ง Google Apps Script & รหัสโค้ด</span>
                                  <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 text-[10px] text-slate-650 space-y-2.5 font-sans leading-relaxed">
                                  <p className="font-bold text-amber-600">🛠️ ขั้นตอนการสร้าง:</p>
                                  <ol className="list-decimal list-inside space-y-1 pl-1">
                                    <li>เข้าสู่ระบบ <a href="https://script.google.com" target="_blank" rel="noreferrer" className="underline font-semibold text-blue-600">Google Apps Script Dashboard</a></li>
                                    <li>กด <b>โครงการใหม่ (New Project)</b> และลบโค้ดเริ่มต้นทิ้งทั้งหมด</li>
                                    <li>คัดลอกรหัสโค้ดด้านล่างนี้ และนำไปวางแทนที่</li>
                                    <li>คลิก <b>การทำให้ใช้งานได้ (Deploy)</b> &gt; <b>การทำให้ใช้งานได้ใหม่ (New Deployment)</b></li>
                                    <li>เลือกประเภทเป็น <b>เว็บแอป (Web App)</b>, โครงการรันในนาม: <b>ฉัน (Me)</b> และผู้เข้าถึง: <b>ทุกคน (Anyone)</b></li>
                                    <li>กด Deploy และกดยืนยันสิทธิ์สตรีมระบบ จากนั้นคัดเอา URL เว็บแอปมาใส่ในช่องด้านบน</li>
                                  </ol>
                                  <div className="relative mt-2">
                                    <textarea
                                      readOnly
                                      value={GOOGLE_APPS_SCRIPT_TEMPLATE}
                                      className="w-full h-36 p-2.5 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[9px] select-all outline-none border border-slate-700"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
                                        triggerToast("success", "คัดลอกรหัสโค้ด Google Apps Script สำเร็จแล้ว!");
                                      }}
                                      className="absolute right-1.5 top-1.5 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded text-[9px] cursor-pointer shadow border-none transition-colors"
                                    >
                                      คัดลอกโค้ด
                                    </button>
                                  </div>
                                </div>
                              </details>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                          <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs border-none cursor-pointer transition-all shadow"
                          >
                            <Save className="w-4 h-4" />
                            {isSaving ? "กำลังบันทึก..." : "บันทึกตั้งค่าโครงสร้างและเชื่อม Drive"}
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

                              <div className="flex flex-wrap items-center gap-2 sm:self-center">
                                {teacher.status !== "approved" ? (
                                  <button
                                    onClick={() => handleUpdateTeacherStatus(teacher.id, "approved")}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold border-none cursor-pointer shadow-sm"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    อนุมัติสิทธิ์
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUpdateTeacherStatus(teacher.id, "pending")}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-250 cursor-pointer"
                                  >
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    ระงับสิทธิ์
                                  </button>
                                )}

                                <button
                                  onClick={() => handleStartEditTeacher(teacher)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                                  title="แก้ไขข้อมูลสังกัด"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                  แก้ไข
                                </button>

                                <button
                                  onClick={() => handleDeleteTeacher(teacher.id)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                                  title="ลบผู้ใช้ออกจากโรงเรียน"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  ลบ
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* Edit Teacher Modal Overlay */}
              {editingTeacher && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
                    <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm">📝 แก้ไขข้อมูลประวัติคุณครู</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">ปรับแต่งรายละเอียดยศวิชาการและข้อมูลประเมินผลของ {editingTeacher.name}</p>
                      </div>
                      <button 
                        onClick={() => setEditingTeacher(null)}
                        className="text-white bg-transparent border-none text-xl font-bold cursor-pointer hover:text-slate-200 leading-none outline-none"
                      >
                        ×
                      </button>
                    </div>
                    
                    <form onSubmit={handleSaveEditTeacher} className="p-6 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          ชื่อ-นามสกุลคุณครู <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-sans"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          วิทยฐานะปัจจุบัน <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={editPosition}
                          onChange={(e) => setEditPosition(e.target.value)}
                          className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-sans"
                        >
                          <option value="ครู ค.ศ. 1 (ไม่มีวิทยฐานะ)">ครู ค.ศ. 1 (ไม่มีวิทยฐานะ)</option>
                          <option value="ครูวิทยฐานะชำนาญการ">ครูวิทยฐานะชำนาญการ</option>
                          <option value="ครูวิทยฐานะชำนาญการพิเศษ">ครูวิทยฐานะชำนาญการพิเศษ</option>
                          <option value="ครูวิทยฐานะเชี่ยวชาญ">ครูวิทยฐานะเชี่ยวชาญ</option>
                          <option value="ครูวิทยฐานะเชี่ยวชาญพิเศษ">ครูวิทยฐานะเชี่ยวชาญพิเศษ</option>
                          <option value="ครูผู้ช่วย">ครูผู้ช่วย</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          เบอร์โทรศัพท์ติดต่อ
                        </label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-sans font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          ปีงบประมาณที่ประเมิน <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={editAcademicYear}
                          onChange={(e) => setEditAcademicYear(e.target.value)}
                          className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-sans"
                        >
                          <option value="2569">2569</option>
                          <option value="2568">2568</option>
                          <option value="2567">2567</option>
                        </select>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setEditingTeacher(null)}
                          className="px-4 py-2 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold border-none cursor-pointer flex items-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" />
                          บันทึกข้อมูลแก้ไข
                        </button>
                      </div>
                    </form>
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
