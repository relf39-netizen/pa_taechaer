/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Teacher {
  id: string;
  email: string;
  name: string;
  position: string; // วิทยฐานะ (ครูผู้ช่วย, ครู, ครูชำนาญการ, ครูชำนาญการพิเศษ, ครูเชี่ยวชาญ, ครูเชี่ยวชาญพิเศษ)
  school: string; // โรงเรียน
  affiliation: string; // สังกัด (เช่น สพม., สพป.)
  phone: string;
  slug: string; // ลิงก์สาธารณะสำหรับคณะกรรมการประเมิน
  academicYear: string; // ปีงบประมาณ (เช่น 2569)
  status: 'pending' | 'approved'; // สถานะอนุมัติใช้งาน
  dateCreated: string;
  headerImage?: string; // base64 / URL สำหรับแบนเนอร์เฮดเดอร์
  avatarImage?: string; // base64 / URL สำหรับรูปประจำตัวผู้ยื่นประเมิน
  themeColor?: string; // ธีมสี ตกแต่งอย่างสวยงาม (เช่น blue, green, violet, gold, slate, rose)
  role?: 'teacher' | 'school_admin' | 'director'; // บทบาท (ครูทั่วไป, แอดมินโรงเรียน, หรือผู้อำนวยการโรงเรียน)
  schoolSmissCode?: string; // รหัส SMISS 8 หลัก ของโรงเรียนที่สังกัด
  idCard?: string; // หมายเลขประจำตัวประชาชน 13 หลัก
  username?: string; // ชื่อผู้ใช้งาน (ใช้หมายเลขประจำตัวประชาชน)
  password?: string; // รหัสผ่าน (สมัครครั้งแรกเป็น 1-6)
  mustChangePassword?: boolean; // บังคับเปลี่ยนรหัสผ่านในการเข้าใช้งานครั้งแรก
}

export interface School {
  smissCode: string; // รหัส SMISS 8 หลัก
  name: string; // ชื่อโรงเรียน
  affiliation: string; // สังกัด
  status: 'pending' | 'approved'; // สถานะอนุมัติจาก Super Admin
  adminTeacherId?: string; // ครูแอดมินหลักของโรงเรียน
  directorName?: string; // ชื่อประธานกรรมการประเมิน (ผู้อำนวยการโรงเรียน)
  paCommitteeMembers?: string[]; // รายชื่อคณะกรรมการประเมินท่านอื่น
  dateCreated: string;
  driveFolderId?: string; // โฟลเดอร์ Google Drive แม่ของโรงเรียน
  gasWebUrl?: string; // ลิงก์ Google Apps Script Web App สำหรับเชื่อมข้อมูล Drive
}

export interface EvidenceLink {
  id: string;
  name: string; // ชื่อหลักฐาน
  url: string; // URL ลิงก์หลัก (ภาพที่ 1 หรือไฟล์)
  type?: 'link' | 'image' | 'file';
  fileId?: string; 
  description?: string; // คำบรรยายเพิ่มเติมด้านบน
  secondaryUrl?: string; // ภาพที่ 2 (สำหรับโหมดกิจกรรม)
  secondaryFileId?: string;
  displayMode?: 'activity' | 'certificate' | 'document' | 'general'; // รูปแบบการแสดงผล
}

export interface PAIndicator {
  id: string; // 1.1, 1.2 ... ถึง 3.3
  part: 1;
  aspect: 'ด้านการจัดการเรียนรู้' | 'ด้านการส่งเสริมและสนับสนุนการจัดการเรียนรู้' | 'ด้านการพัฒนาตนเองและวิชาชีพ';
  title: string;
  description: string; // รายละเอียดการดำเนินงานที่คุณครูระบุ
  evidenceLinks: EvidenceLink[]; // ลิงก์หลักฐานอ้างอิง
  status: 'not_started' | 'in_progress' | 'completed';
  updatedAt: string;
}

export interface PACleaningChallenge {
  part: 2;
  title: string; // ประเด็นท้าทาย เรื่อง ...
  problemContext: string; // สภาพปัญหาการจัดการเรียนรู้และคุณภาพการเรียนรู้ของผู้เรียน
  process: string; // วิธีการดำเนินงานให้บรรลุผล
  quantitativeOutput: string; // ผลลัพธ์เชิงปริมาณ
  qualitativeOutput: string; // ผลลัพธ์เชิงคุณภาพ
  status: 'not_started' | 'in_progress' | 'completed';
  evidenceLinks: EvidenceLink[];
  updatedAt: string;
}

export interface TeacherData {
  teacher: Teacher;
  indicators: Record<string, PAIndicator>;
  challenge: PACleaningChallenge;
}

export interface Evaluator {
  id: string;
  username: string;
  password?: string;
  name: string;
  position: string;
  schoolSmissCode: string;
  role: 'evaluator';
}

export interface EvaluationResult {
  teacherId: string;
  evaluatorId: string;
  part1Scores: number[]; // Array of 15 scores (1-4 each) -> Max 60
  part2Scores: number[]; // Array of 10 scores (1-4 each) -> Max 40
  comment?: string;
  updatedAt: string;
}

export interface DBState {
  teachers: Record<string, Teacher>; // teacherId or email as key
  schools: Record<string, School>; // smissCode as key
  teacherDataList: Record<string, TeacherData>; // teacherId as key
  evaluators: Record<string, Evaluator>; // id or username as key
  evaluations: EvaluationResult[];
  adminConfig: {
    username: string;
    passwordHash: string;
  };
}
