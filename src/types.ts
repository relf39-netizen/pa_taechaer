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
  role?: 'teacher' | 'school_admin'; // บทบาท (ครูทั่วไป หรือ แอดมินโรงเรียน)
  schoolSmissCode?: string; // รหัส SMISS 8 หลัก ของโรงเรียนที่สังกัด
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
}

export interface EvidenceLink {
  id: string;
  name: string; // ชื่อหลักฐาน (เช่น แผนการจัดการเรียนรู้, ภาพกิจกรรม, เกียรติบัตร)
  url: string; // URL ลิงก์ (เช่น Google Drive, YouTube, Slideshare)
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

export interface DBState {
  teachers: Record<string, Teacher>; // teacherId or email as key
  schools: Record<string, School>; // smissCode as key
  teacherDataList: Record<string, TeacherData>; // teacherId as key
  adminConfig: {
    username: string;
    passwordHash: string;
  };
}
