import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import { createServer as createViteServer } from "vite";
import { Teacher, TeacherData, PAIndicator, PACleaningChallenge, DBState } from "./src/types";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load environment variables from standard and absolute paths to support IIS/Plesk
dotenv.config();
try {
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
  dotenv.config({ path: path.resolve(__dirname, ".env") });
  dotenv.config({ path: path.resolve(__dirname, "../.env") });
} catch (e) {
  console.warn("Dotenv custom path parsing warning:", e);
}

// Determine a writeable path for teachers_db.json on restrictive servers like IIS/Plesk
function getWriteableDbPath(): string {
  const defaultPath = path.join(process.cwd(), "teachers_db.json");
  
  // Try writing to standard cwd path first
  try {
    fs.writeFileSync(defaultPath + ".test", "test", "utf-8");
    fs.unlinkSync(defaultPath + ".test");
    return defaultPath;
  } catch (e) {
    console.warn("process.cwd() is not writeable (EPERM/EACCES), trying alternative paths...");
  }
  
  // Try Plesk/IIS user's typical writeable directories like dist, parent tmp folder or temp directory
  const altPaths = [
    path.join(process.cwd(), "dist", "teachers_db.json"),
    path.resolve(process.cwd(), "..", "tmp", "teachers_db.json"),
    path.join(os.tmpdir(), "teachers_db.json")
  ];
  
  for (const altPath of altPaths) {
    try {
      const dir = path.dirname(altPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(altPath + ".test", "test", "utf-8");
      fs.unlinkSync(altPath + ".test");
      console.log(`Using writable database fallback path: ${altPath}`);
      return altPath;
    } catch (err) {
      console.warn(`Alternative path ${altPath} is not writable:`, (err as Error).message);
    }
  }
  
  console.error("CRITICAL WARNING: No persistent file paths are writable. Operating in IN-MEMORY database fallback mode.");
  return defaultPath;
}

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE_PATH = getWriteableDbPath();

app.use(express.json());

// Helper to generate the default indicators for standard OBEC PA Part 1
function createDefaultIndicators(): Record<string, PAIndicator> {
  const indicators: Record<string, PAIndicator> = {};
  
  const rawIndicators = [
    // ด้านที่ 1
    {
      id: "1.1",
      aspect: "ด้านการจัดการเรียนรู้" as const,
      title: "การสร้างและหรือพัฒนาหลักสูตร",
    },
    {
      id: "1.2",
      aspect: "ด้านการจัดการเรียนรู้" as const,
      title: "การออกแบบการจัดการเรียนรู้",
    },
    {
      id: "1.3",
      aspect: "ด้านการจัดการเรียนรู้" as const,
      title: "การจัดกิจกรรมการเรียนรู้",
    },
    {
      id: "1.4",
      aspect: "ด้านการจัดการเรียนรู้" as const,
      title: "การสร้างและหรือพัฒนาสื่อ นวัตกรรม เทคโนโลยี และแหล่งเรียนรู้",
    },
    {
      id: "1.5",
      aspect: "ด้านการจัดการเรียนรู้" as const,
      title: "การวัดและประเมินผลการเรียนรู้",
    },
    {
      id: "1.6",
      aspect: "ด้านการจัดการเรียนรู้" as const,
      title: "การศึกษา วิเคราะห์ และสังเคราะห์ เพื่อแก้ไขปัญหาหรือพัฒนาการเรียนรู้",
    },
    {
      id: "1.7",
      aspect: "ด้านการจัดการเรียนรู้" as const,
      title: "การจัดบรรยากาศที่ส่งเสริมและพัฒนาผู้เรียน",
    },
    {
      id: "1.8",
      aspect: "ด้านการจัดการเรียนรู้" as const,
      title: "การอบรมและพัฒนาคุณลักษณะที่ดีของผู้เรียน",
    },
    // ด้านที่ 2
    {
      id: "2.1",
      aspect: "ด้านการส่งเสริมและสนับสนุนการจัดการเรียนรู้" as const,
      title: "การจัดทำข้อมูลสารสนเทศของผู้เรียนและรายวิชา",
    },
    {
      id: "2.2",
      aspect: "ด้านการส่งเสริมและสนับสนุนการจัดการเรียนรู้" as const,
      title: "การดำเนินการตามระบบดูแลช่วยเหลือผู้เรียน",
    },
    {
      id: "2.3",
      aspect: "ด้านการส่งเสริมและสนับสนุนการจัดการเรียนรู้" as const,
      title: "การปฏิบัติงานวิชาการ และงานอื่นๆ ของสถานศึกษา",
    },
    {
      id: "2.4",
      aspect: "ด้านการส่งเสริมและสนับสนุนการจัดการเรียนรู้" as const,
      title: "การประสานความร่วมมือกับผู้ปกครอง ภาคีเครือข่าย และหรือสถานประกอบการ",
    },
    // ด้านที่ 3
    {
      id: "3.1",
      aspect: "ด้านการพัฒนาตนเองและวิชาชีพ" as const,
      title: "การพัฒนาตนเองอย่างเป็นระบบและต่อเนื่อง",
    },
    {
      id: "3.2",
      aspect: "ด้านการพัฒนาตนเองและวิชาชีพ" as const,
      title: "การมีส่วนร่วมในการแลกเปลี่ยนเรียนรู้ทางวิชาชีพเพื่อพัฒนาการจัดการเรียนรู้",
    },
    {
      id: "3.3",
      aspect: "ด้านการพัฒนาตนเองและวิชาชีพ" as const,
      title: "การนำความรู้ ความสามารถ ทักษะที่ได้จากการพัฒนาตนเองและวิชาชีพมาใช้ในการพัฒนาการจัดการเรียนรู้",
    }
  ];

  const nowString = new Date().toISOString();
  rawIndicators.forEach((ind) => {
    indicators[ind.id] = {
      id: ind.id,
      part: 1,
      aspect: ind.aspect,
      title: ind.title,
      description: "",
      evidenceLinks: [],
      status: "not_started",
      updatedAt: nowString,
    };
  });

  return indicators;
}

// Helper to create Part 2 (Challenge) default
function createDefaultChallenge(): PACleaningChallenge {
  return {
    part: 2,
    title: "",
    problemContext: "",
    process: "",
    quantitativeOutput: "",
    qualitativeOutput: "",
    status: "not_started",
    evidenceLinks: [],
    updatedAt: new Date().toISOString(),
  };
}

// Function to initialize default state in JSON DB if not exists
function getInitialState(): DBState {
  const manaId = "t1-mana";
  const pitiId = "t2-piti";

  const defaultTeachers: Record<string, Teacher> = {
    "mana@samsen.ac.th": {
      id: manaId,
      email: "mana@samsen.ac.th",
      name: "ครูมานะ รักการสอน",
      position: "ครูวิทยฐานะชำนาญการพิเศษ",
      school: "โรงเรียนบ้านหนองหว้า",
      affiliation: "สำนักงานเขตพื้นที่การศึกษาประถมศึกษาบุรีรัมย์ เขต 3",
      phone: "081-234-5678",
      slug: "mana-samsen",
      academicYear: "2569",
      status: "approved",
      dateCreated: new Date().toISOString(),
    },
    "piti@triamudom.ac.th": {
      id: pitiId,
      email: "piti@triamudom.ac.th",
      name: "ครูปิติ มีวิชา",
      position: "ครู ค.ศ. 1 (ไม่มีวิทยฐานะ)",
      school: "โรงเรียนบ้านหนองหว้า",
      affiliation: "สำนักงานเขตพื้นที่การศึกษาประถมศึกษาบุรีรัมย์ เขต 3",
      phone: "089-876-5432",
      slug: "piti-triam",
      academicYear: "2569",
      status: "approved",
      dateCreated: new Date().toISOString(),
    }
  };

  const dbState: DBState = {
    teachers: { ...defaultTeachers },
    teacherDataList: {},
    adminConfig: {
      username: "admin",
      passwordHash: "admin123" // Plain for the mock system demo, easily configurable
    }
  };

  // Populate Mana's indicators
  const manaIndicators = createDefaultIndicators();
  manaIndicators["1.1"].description = "วิเคราะห์หลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พุทธศักราช 2551 (ฉบับปรับปรุง พ.ศ. 2560) และหลักสูตรสถานศึกษาโรงเรียนบ้านหนองหว้า กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี รายวิชาฟิสิกส์ ม.4 นำมาจัดทำคำอธิบายรายวิชา โครงสร้างรายวิชา และหน่วยการเรียนรู้ที่เน้นผู้เรียนเป็นสำคัญ";
  manaIndicators["1.1"].status = "completed";
  manaIndicators["1.1"].evidenceLinks = [
    { id: "e1", name: "หลักสูตรกลุ่มสาระวิทยาศาสตร์ ม.4", url: "https://drive.google.com/drive/folders/test1" },
    { id: "e2", name: "เล่มโครงสร้างรายวิชาฟิสิกส์ ม.4", url: "https://samsen.ac.th/curriculum-physics" }
  ];

  manaIndicators["1.2"].description = "จัดทำแผนการจัดการเรียนรู้รายวิชาฟิสิกส์เพิ่มเติม ม.4 ที่เน้นกระบวนการสืบเสาะหาความรู้แบบ 5E และการคิดวิเคราะห์เชิงระบบ มีกิจกรรมการทดลองที่สอดคล้องกับเนื้อหา ส่งเสริมสมรรถนะการแก้ปัญหาทางวิทยาศาสตร์";
  manaIndicators["1.2"].status = "completed";
  manaIndicators["1.2"].evidenceLinks = [
    { id: "e3", name: "แผนการจัดการเรียนรู้บทที่ 1-3", url: "https://drive.google.com/file/d/test-plan-5e" }
  ];

  manaIndicators["1.3"].description = "ดำเนินกิจกรรมการเรียนรู้วิชาฟิสิกส์ เรื่อง แรงและกฎการเคลื่อนที่ โดยเน้นให้นักเรียนลงมือปฏิบัติกิจกรรมกลุ่มด้วยตัวเอง คอยกระตุ้นด้วยคำถามปลายเปิดเพื่อดึงดูดความสนใจและแก้ปัญหานักเรียนที่มีแนวคิดคลาดเคลื่อนทางฟิสิกส์";
  manaIndicators["1.3"].status = "completed";

  manaIndicators["1.4"].description = "จัดทำสื่อการทดลองเสมือนจริง (PhET Interactive Simulation) และนวัตกรรมสไลด์ประกอบภาพเคลื่อนไหว 3 มิติ เพื่อให้นักเรียนสามารถจำลองการสลายตัวของสารกัมมันตรังสีและสรุปความเข้าใจด้วยตนเอง";
  manaIndicators["1.4"].status = "completed";
  manaIndicators["1.4"].evidenceLinks = [
    { id: "e4", name: "สื่อเรียนการสอนทางไกลและสื่อฟิสิกส์เสมือนจริง", url: "https://phet.colorado.edu/th/" }
  ];

  manaIndicators["2.1"].description = "จัดทำระบบฐานข้อมูลสารสนเทศคะแนนสอบย่อย คะแนนเก็บรายจุดประสงค์ และบันทึกการส่งงานของนักเรียน ม.4/1 และ ม.4/3 ผ่านระบบ Google Sheets และสรุปแจ้งเตือนนักเรียนที่ติดค้างงานทุกสัปดาห์";
  manaIndicators["2.1"].status = "completed";
  manaIndicators["2.1"].evidenceLinks = [
    { id: "e5", name: "ตัวอย่างหน้าแดชบอร์ดติดตามงานนักเรียน", url: "https://docs.google.com/spreadsheets/d/test-sheet" }
  ];

  manaIndicators["2.2"].description = "ดำเนินการวิเคราะห์ผู้เรียนรายบุคคล คัดกรองความต้องการพิเศษ และออกเยี่ยมบ้านนักเรียนกลุ่มเสี่ยงคิดเป็นร้อยละ 100 เพื่อนำข้อมูลมาประสานดูแลช่วยเหลือร่วมกับครูแนะแนวและฝ่ายปกครอง";
  manaIndicators["2.2"].status = "completed";

  manaIndicators["3.1"].description = "เข้าร่วมการอบรมเชิงปฏิบัติการวิชาการส่งเสริมทักษะวิทยาศาสตร์ พัฒนาสื่อนวัตกรรมศตวรรษที่ 21 จัดโดย สสวท. และมหาวิทยาลัยมหิดล รวมชั่วโมงพัฒนาวิชาชีพมากกว่า 30 ชั่วโมงในปีงบประมาณนี้";
  manaIndicators["3.1"].status = "completed";
  manaIndicators["3.1"].evidenceLinks = [
    { id: "e6", name: "เกียรติบัตรการอบรมวิทยากรกระบวนการ สสวท.", url: "https://drive.google.com/file/d/certificate-sswt" }
  ];

  manaIndicators["3.2"].description = "ริเริ่มและเป็นผู้นำกลุ่มกิจกรรมการแลกเปลี่ยนเรียนรู้ทางวิชาชีพ (PLC) ของครูผู้สอนกลุ่มวิชาฟิสิกส์ มัธยมศึกษาตอนปลาย เพื่อแก้ปัญหาทักษะการคำนวณเวกเตอร์วิชาฟิสิกส์ ม.4 สัปดาห์ละ 1 ครั้ง";
  manaIndicators["3.2"].status = "completed";

  const manaChallenge: PACleaningChallenge = {
    part: 2,
    title: "การแก้ปัญหาผลสัมฤทธิ์ทางการเรียนและการคิดแก้ปัญหาเรื่องแรงและกฎการเคลื่อนที่ของนักเรียน ม.4 โรงเรียนบ้านหนองหว้า โดยการสอนด้วยรูปแบบ Active Learning สอดแทรกเกมจำลองสถานการณ์",
    problemContext: "นักเรียนสายวิทย์-คณิต ชั้น ม.4 มักพบปัญหาว่าวิชาฟิสิกส์เป็นวิชาที่เข้าใจยาก ซับซ้อนและเน้นการจำสูตร โดยเฉพาะเรื่องแรงและกฎการเคลื่อนที่ ซึ่งส่งผลให้คะแนนผลสัมฤทธิ์ทางการเรียนเฉลี่ยและทักษะการคิดวิเคราะห์ไม่ผ่านเกณฑ์ร้อยละ 70 ของกลุ่มสาระการเรียนรู้",
    process: "1. ศึกษาทฤษฎี Active Learning และสืบเสาะหาความรู้แบบ 5E\n2. ออกแบบแผนบริหารจัดการเรียนรู้สอดแทรกบอร์ดเกมฟิสิกส์และแบบจำลอง PhET\n3. จัดกิจกรรมในชั้นเรียนวิจัยเชิงทดลอง\n4. วัดผลสัมฤทธิ์ทางการเรียนโดยใช้ข้อสอบวิเคราะห์แบบอิงเกณฑ์ และทดสอบความพึงพอใจของนักเรียน",
    quantitativeOutput: "นักเรียนชั้น ม.4/1 โรงเรียนบ้านหนองหว้า จำนวน 40 คน เข้าเรียนในรายวิชาฟิสิกส์ มีผลสัมฤทธิ์ทางการเรียนเฉลี่ยเพิ่มขึ้นอย่างน้อยร้อยละ 15 และมากกว่าร้อยละ 80 ของผู้เรียนมีคะแนนผ่านเกณฑ์ที่กำหนด (ร้อยละ 75)",
    qualitativeOutput: "นักเรียนมีความรู้ความเข้าใจในหลักการฟิสิกส์เชิงสืบเสาะและคิดวิเคราะห์ได้อย่างสมเหตุสมผล สามารถเชื่อมโยงกับการแก้ปัญหาในชีวิตจริงได้อย่างเหมาะสม",
    status: "completed",
    evidenceLinks: [
      { id: "ce1", name: "รายงานบทคัดย่อวิจัยในชั้นเรียน", url: "https://drive.google.com/file/d/test-research-abstract" }
    ],
    updatedAt: new Date().toISOString()
  };

  dbState.teacherDataList[manaId] = {
    teacher: dbState.teachers["mana@samsen.ac.th"],
    indicators: manaIndicators,
    challenge: manaChallenge,
  };

  // Populate Piti's indicators
  const pitiIndicators = createDefaultIndicators();
  pitiIndicators["1.1"].description = "วิเคราะห์ตัวชี้วัดรายวิชาคณิตศาสตร์พื้นฐาน ม.5 เรื่อง ลำดับและอนุกรม เพื่อจัดทำแผนการจัดกิจกรรมการเรียนเรียนรู้สอดคล้องกับวัยผู้เรียน สะท้อนความแตกต่างระหว่างบุคคล";
  pitiIndicators["1.1"].status = "in_progress";

  pitiIndicators["1.3"].description = "จัดกิจกรรมการเรียนรู้แบบใช้วิจัยร่วมในคณิตศาสตร์ (PBL) เน้นการแบ่งกลุ่มสร้างโครงงานคณิตศาสตร์เชิงปฏิบัติการในชีวิตประจำวันเพื่อความเข้าใจอย่างเป็นธรรมชาติ";
  pitiIndicators["1.3"].status = "in_progress";
  
  const pitiChallenge = createDefaultChallenge();
  pitiChallenge.title = "การยกผลสัมฤทธิ์ทางการคํานวณวิชาคณิตศาสตร์พื้นฐาน เรื่องลําดับอนุกรม ของนักเรียนชั้น ม.5";
  pitiChallenge.status = "in_progress";

  dbState.teacherDataList[pitiId] = {
    teacher: dbState.teachers["piti@triamudom.ac.th"],
    indicators: pitiIndicators,
    challenge: pitiChallenge,
  };

  return dbState;
}

// Read database file
function loadDatabase(): DBState {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const data = fs.readFileSync(DB_FILE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading database file, using fallback:", error);
  }
  
  // Safe write initial state
  const initialState = getInitialState();
  saveDatabase(initialState);
  return initialState;
}

// Write database file
function saveDatabase(state: DBState) {
  // If the server should connect to MySQL, skip writing local JSON file to prevent EPERM errors on restricted hosting servers like IIS/Plesk.
  if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
    // MySQL is the active source of truth. We only sync to MySQL if the connection is active.
    if (mysqlPool) {
      syncStateToMySQL(state).catch(err => {
        console.error("Error in background MySQL sync:", err);
      });
    }
    return;
  }

  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database file:", error);
  }

  // Backup sync to MySQL in background if connected
  if (mysqlPool) {
    syncStateToMySQL(state).catch(err => {
      console.error("Error in background MySQL sync:", err);
    });
  }
}

// MySQL Connection Pool & State Managers
let mysqlPool: mysql.Pool | null = null;

const dbHostRaw = process.env.DB_HOST || "";
// Strip port if included in the host name like "localhost:3306"
const dbHost = dbHostRaw.split(":")[0];
const dbPort = parseInt(process.env.DB_PORT || (dbHostRaw.split(":")[1] || "3306"), 10);
const dbUser = process.env.DB_USER || "";
const dbPassword = process.env.DB_PASSWORD || process.env.DB_PASS || "";
const dbName = process.env.DB_NAME || "";

async function initMySQL() {
  if (!dbHost || !dbUser || !dbName) {
    console.log("MySQL Database details not configure yet in env. Running in Local JSON file mode.");
    return false;
  }

  try {
    console.log(`Connecting to MySQL database at ${dbHost}:${dbPort} for db: ${dbName}...`);
    mysqlPool = mysql.createPool({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      charset: "utf8mb4",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Test connection
    const conn = await mysqlPool.getConnection();
    console.log("Successfully connected to MySQL Database!");
    conn.release();

    // Setup SQL tables if they're missing
    await createMySQLTables();

    // Hydrate localDB memory
    await loadDataFromMySQL();

    return true;
  } catch (error) {
    console.error("Could not complete MySQL initialization. Falling back to local JSON database storage.", error);
    mysqlPool = null;
    return false;
  }
}

async function createMySQLTables() {
  if (!mysqlPool) return;

  console.log("Verifying MySQL database tables existence...");

  // 1. Teachers table
  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS \`pa_teachers\` (
      \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
      \`email\` VARCHAR(100) NOT NULL UNIQUE,
      \`name\` VARCHAR(100) NOT NULL,
      \`position\` VARCHAR(100) NOT NULL,
      \`school\` VARCHAR(100) NOT NULL,
      \`affiliation\` VARCHAR(100) NOT NULL,
      \`phone\` VARCHAR(20) DEFAULT NULL,
      \`slug\` VARCHAR(50) NOT NULL UNIQUE,
      \`academic_year\` VARCHAR(10) NOT NULL,
      \`status\` VARCHAR(20) NOT NULL DEFAULT 'pending',
      \`date_created\` VARCHAR(50) NOT NULL,
      \`header_image\` LONGTEXT DEFAULT NULL,
      \`avatar_image\` LONGTEXT DEFAULT NULL,
      \`theme_color\` VARCHAR(30) DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 2. PA Teacher Data table
  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS \`pa_teacher_data\` (
      \`teacher_id\` VARCHAR(50) NOT NULL PRIMARY KEY,
      \`indicators_json\` LONGTEXT NOT NULL,
      \`challenge_json\` LONGTEXT NOT NULL,
      \`updated_at\` VARCHAR(50) NOT NULL,
      FOREIGN KEY (\`teacher_id\`) REFERENCES \`pa_teachers\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 3. Admin Config table
  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS \`pa_admin_config\` (
      \`username\` VARCHAR(50) NOT NULL PRIMARY KEY,
      \`password_hash\` VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

async function loadDataFromMySQL() {
  if (!mysqlPool) return;

  console.log("Hydrating application state from MySQL...");

  // 1. Sync check admin credentials 
  const [adminRows] = await mysqlPool.query<any[]>("SELECT * FROM \`pa_admin_config\`");
  if (adminRows.length > 0) {
    localDB.adminConfig = {
      username: adminRows[0].username,
      passwordHash: adminRows[0].password_hash,
    };
  } else {
    await mysqlPool.query(
      "INSERT INTO \`pa_admin_config\` (username, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = ?",
      [localDB.adminConfig.username, localDB.adminConfig.passwordHash, localDB.adminConfig.passwordHash]
    );
  }

  // 2. Load teachers list
  const [teacherRows] = await mysqlPool.query<any[]>("SELECT * FROM \`pa_teachers\`");
  if (teacherRows.length > 0) {
    const loadedTeachers: Record<string, Teacher> = {};
    const loadedTeacherDataList: Record<string, TeacherData> = {};

    for (const row of teacherRows) {
      const teacher: Teacher = {
        id: row.id,
        email: row.email,
        name: row.name,
        position: row.position,
        school: row.school,
        affiliation: row.affiliation,
        phone: row.phone || "",
        slug: row.slug,
        academicYear: row.academic_year,
        status: row.status as 'pending' | 'approved',
        dateCreated: row.date_created,
        headerImage: row.header_image || undefined,
        avatarImage: row.avatar_image || undefined,
        themeColor: row.theme_color || undefined,
      };
      loadedTeachers[teacher.email] = teacher;

      // Seed with default layouts
      loadedTeacherDataList[teacher.id] = {
        teacher: teacher,
        indicators: createDefaultIndicators(),
        challenge: createDefaultChallenge(),
      };
    }

    // 3. Load indicators and challenges JSON chunks
    const [dataRows] = await mysqlPool.query<any[]>("SELECT * FROM \`pa_teacher_data\`");
    for (const dRow of dataRows) {
      const tId = dRow.teacher_id;
      if (loadedTeacherDataList[tId]) {
        try {
          const indicators = JSON.parse(dRow.indicators_json);
          const challenge = JSON.parse(dRow.challenge_json);
          loadedTeacherDataList[tId].indicators = indicators;
          loadedTeacherDataList[tId].challenge = challenge;
        } catch (parseError) {
          console.error(`Skip JSON parse error for teacher ID ${tId} on MySQL load:`, parseError);
        }
      }
    }

    localDB.teachers = loadedTeachers;
    localDB.teacherDataList = loadedTeacherDataList;
    console.log(`Success: Loaded ${teacherRows.length} teachers and data portfolios from MySQL.`);
  } else {
    console.log("No teacher accounts found in MySQL. Initializing MySQL tables with the local demo state...");
    await syncStateToMySQL(localDB);
  }
}

async function syncStateToMySQL(state: DBState) {
  if (!mysqlPool) return;

  try {
    // Sync admin config
    await mysqlPool.query(
      "INSERT INTO \`pa_admin_config\` (username, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = ?",
      [state.adminConfig.username, state.adminConfig.passwordHash, state.adminConfig.passwordHash]
    );

    // Sync deletion
    const [existingTeachers] = await mysqlPool.query<any[]>("SELECT id FROM \`pa_teachers\`");
    const currentIds = new Set(Object.values(state.teachers).map(t => t.id));

    for (const ext of existingTeachers) {
      if (!currentIds.has(ext.id)) {
        await mysqlPool.query("DELETE FROM \`pa_teachers\` WHERE id = ?", [ext.id]);
        console.log(`Synced deleted teacher ID ${ext.id} to MySQL.`);
      }
    }

    // Insert or update
    for (const email of Object.keys(state.teachers)) {
      const t = state.teachers[email];
      await mysqlPool.query(
        `INSERT INTO \`pa_teachers\` (
          id, email, name, position, school, affiliation, phone, slug, academic_year, status, date_created, header_image, avatar_image, theme_color
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          position = VALUES(position),
          school = VALUES(school),
          affiliation = VALUES(affiliation),
          phone = VALUES(phone),
          slug = VALUES(slug),
          academic_year = VALUES(academic_year),
          status = VALUES(status),
          header_image = VALUES(header_image),
          avatar_image = VALUES(avatar_image),
          theme_color = VALUES(theme_color)`,
        [
          t.id,
          t.email,
          t.name,
          t.position,
          t.school,
          t.affiliation,
          t.phone || "",
          t.slug,
          t.academicYear,
          t.status,
          t.dateCreated,
          t.headerImage || null,
          t.avatarImage || null,
          t.themeColor || null
        ]
      );

      const tData = state.teacherDataList[t.id];
      if (tData) {
        await mysqlPool.query(
          `INSERT INTO \`pa_teacher_data\` (
            teacher_id, indicators_json, challenge_json, updated_at
          ) VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            indicators_json = VALUES(indicators_json),
            challenge_json = VALUES(challenge_json),
            updated_at = VALUES(updated_at)`,
          [t.id, JSON.stringify(tData.indicators), JSON.stringify(tData.challenge), new Date().toISOString()]
        );
      }
    }
  } catch (syncErr) {
    console.error("Background syncStateToMySQL execution error:", syncErr);
  }
}

// Initialize active database
let localDB = loadDatabase();

// --- API ROTUES ---

// 1. Authenticate / Login API
app.post("/api/auth/login", (req, res) => {
  const { email, password, role } = req.body;

  if (role === "admin") {
    if (email === localDB.adminConfig.username && password === localDB.adminConfig.passwordHash) {
      return res.json({
        success: true,
        message: "เข้าสู่ระบบในฐานะผู้ดูแลระบบสำเร็จ",
        user: { role: "admin", username: "admin", name: "ผู้ดูแลระบบกลาง" }
      });
    }
    return res.status(401).json({ success: false, message: "ชื่อผู้ใช้หรือรหัสผ่าน Admin ไม่ถูกต้อง" });
  }

  // Teacher login (In this prototype system, password matches email prefix for demo, but we allow signup with a password. Let's look up by email)
  const teacher = localDB.teachers[email];
  if (teacher) {
    // Check approval
    if (teacher.status === "pending") {
      return res.status(403).json({ success: false, message: "บัญชีของคุณอยู่ระหว่างรอผู้ดูแลระบบตรวจสอบอนุมัติลิงก์ขอใช้งาน" });
    }

    // Return teacher data
    const data = localDB.teacherDataList[teacher.id];
    return res.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      user: { role: "teacher", ...teacher },
      data: data
    });
  }

  return res.status(401).json({ success: false, message: "ไม่พบข้อมูลอีเมลผู้ใช้งานครูในระบบ กรุณาสมัครเป็นสมาชิกเข้าใช้งานก่อน" });
});

// 2. Register Teacher API
app.post("/api/auth/register", (req, res) => {
  const { name, email, position, school, affiliation, phone, slug, academicYear } = req.body;

  if (!name || !email || !slug || !school) {
    return res.status(400).json({ success: false, message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" });
  }

  // Check if email already registered
  if (localDB.teachers[email]) {
    return res.status(400).json({ success: false, message: "อีเมลนี้ลงทะเบียนเข้าใช้งานในระบบแล้ว" });
  }

  // Check if public slug is unique
  const slugExists = Object.values(localDB.teachers).some(t => t.slug === slug);
  if (slugExists) {
    return res.status(400).json({ success: false, message: "คุณลักษณะชื่อลิงก์ URL อ้างอิงลิงก์นี้ถูกใช้ไปแล้ว กรุณาระบุชื่ออื่น" });
  }

  const newTeacherId = "teacher-" + Date.now();
  const newTeacher: Teacher = {
    id: newTeacherId,
    email,
    name,
    position: position || "ครู ค.ศ. 1 (ไม่มีวิทยฐานะ)",
    school,
    affiliation: affiliation || "สำนักงานเขตพื้นที่การศึกษาประถมศึกษา",
    phone: phone || "",
    slug,
    academicYear: academicYear || "2569",
    status: "pending", // New registration needs admin approval
    dateCreated: new Date().toISOString(),
  };

  // Save teacher
  localDB.teachers[email] = newTeacher;

  // Initialize empty teacher data structures
  localDB.teacherDataList[newTeacherId] = {
    teacher: newTeacher,
    indicators: createDefaultIndicators(),
    challenge: createDefaultChallenge(),
  };

  saveDatabase(localDB);

  return res.json({
    success: true,
    message: "สมัครขอใช้งานระบบเรียบร้อยแล้ว! กรุณารอผู้ดูแลระบบประเมินอนุมัติสิทธิ์ (สามารถใช้สิทธิ์ทดลองเข้าใช้งานจำลองได้ผ่านหน้าระบบแอดมิน)",
    teacher: newTeacher
  });
});

// 3. Get Public / Full lists of teachers (Admin endpoint)
app.get("/api/teachers", (req, res) => {
  // Return list of all teachers with metadata
  return res.json({
    success: true,
    teachers: Object.values(localDB.teachers)
  });
});

// 4. Get Public profile of a teacher by public slug
app.get("/api/teachers/slug/:slug", (req, res) => {
  const { slug } = req.params;
  const teacher = Object.values(localDB.teachers).find(t => t.slug === slug);

  if (!teacher) {
    return res.status(444).json({ success: false, message: "ไม่พบหน้าผู้ปฏิบัติงานครูด้วย ลิงก์ URL สาธารณะที่ระบุ" });
  }

  // Retrieve complete PA profile
  const data = localDB.teacherDataList[teacher.id];
  if (!data) {
    return res.status(444).json({ success: false, message: "ไม่พบโครงสร้างข้อมูลบันทึกข้อตกลงในการพัฒนางาน" });
  }

  return res.json({
    success: true,
    teacher: teacher,
    data: data
  });
});

// 5. Update Teacher Profile
app.put("/api/teachers/me", (req, res) => {
  const { teacherId, name, position, school, affiliation, phone, academicYear, headerImage, avatarImage, themeColor } = req.body;

  const teacherRef = Object.values(localDB.teachers).find(t => t.id === teacherId);
  if (!teacherRef) {
    return res.status(404).json({ success: false, message: "ไม่พบรายชื่อครูในระบบ" });
  }

  teacherRef.name = name;
  teacherRef.position = position;
  teacherRef.school = school;
  teacherRef.affiliation = affiliation;
  teacherRef.phone = phone;
  teacherRef.academicYear = academicYear;
  
  if (headerImage !== undefined) {
    teacherRef.headerImage = headerImage;
  }
  if (avatarImage !== undefined) {
    teacherRef.avatarImage = avatarImage;
  }
  if (themeColor !== undefined) {
    teacherRef.themeColor = themeColor;
  }

  // Sync back to teacherDataList
  if (localDB.teacherDataList[teacherId]) {
    localDB.teacherDataList[teacherId].teacher = teacherRef;
  }

  saveDatabase(localDB);

  return res.json({
    success: true,
    message: "อัปเดตข้อมูลประวัติตนเองเรียบร้อยแล้ว",
    teacher: teacherRef
  });
});

// 6. Update Indicator
app.put("/api/indicators/:id", (req, res) => {
  const { id } = req.params; // indicator ID (1.1, etc.)
  const { teacherId, description, status, evidenceLinks } = req.body;

  const data = localDB.teacherDataList[teacherId];
  if (!data) {
    return res.status(404).json({ success: false, message: "ไม่พบข้อมูลครู" });
  }

  const indicator = data.indicators[id];
  if (!indicator) {
    return res.status(404).json({ success: false, message: "ไม่พบตัวชี้วัดที่ระบุ" });
  }

  indicator.description = description;
  indicator.status = status;
  indicator.evidenceLinks = evidenceLinks || [];
  indicator.updatedAt = new Date().toISOString();

  saveDatabase(localDB);

  return res.json({
    success: true,
    message: `อัปเดตตัวชี้วัดที่ ${id} สำเร็จแล้ว`,
    indicator: indicator
  });
});

// 7. Update Part 2 (Challenge)
app.put("/api/challenge", (req, res) => {
  const { teacherId, title, problemContext, process, quantitativeOutput, qualitativeOutput, status, evidenceLinks } = req.body;

  const data = localDB.teacherDataList[teacherId];
  if (!data) {
    return res.status(404).json({ success: false, message: "ไม่พบข้อมูลครู" });
  }

  const challenge = data.challenge;
  challenge.title = title || "";
  challenge.problemContext = problemContext || "";
  challenge.process = process || "";
  challenge.quantitativeOutput = quantitativeOutput || "";
  challenge.qualitativeOutput = qualitativeOutput || "";
  challenge.status = status || "not_started";
  challenge.evidenceLinks = evidenceLinks || [];
  challenge.updatedAt = new Date().toISOString();

  saveDatabase(localDB);

  return res.json({
    success: true,
    message: "บันทึกข้อมูลส่วนประเด็นท้าทาย (ส่วนที่ 2) สำเร็จเรียบร้อยแล้ว",
    challenge: challenge
  });
});

// 8. Admin operations: Approve status
app.post("/api/admin/approve", (req, res) => {
  const { teacherId, status } = req.body;

  const teacher = Object.values(localDB.teachers).find(t => t.id === teacherId);
  if (!teacher) {
    return res.status(404).json({ success: false, message: "ไม่พบคุณครูที่เลือกในระบบ" });
  }

  teacher.status = status; // "approved" or "pending"
  saveDatabase(localDB);

  return res.json({
    success: true,
    message: `เปลี่ยนสถานะเป็น '${status === 'approved' ? 'อนุมัติการใช้งานแล้ว' : 'ปิดสิทธิ์การใช้งานชั่วคราว'}' เรียบร้อย`,
    teacher: teacher
  });
});

// 9. Admin operations: Delete teacher
app.delete("/api/admin/teachers/:id", (req, res) => {
  const { id } = req.params;

  const teacher = Object.values(localDB.teachers).find(t => t.id === id);
  if (!teacher) {
    return res.status(404).json({ success: false, message: "ไม่พบข้อมูลที่ต้องการลบในฐานข้อมูล" });
  }

  // Remove records
  delete localDB.teachers[teacher.email];
  delete localDB.teacherDataList[id];

  saveDatabase(localDB);

  return res.json({
    success: true,
    message: "ลบบัญชีและรายงานประเมินผล PA ของผู้ใช้ครูเสร้จสิ้นแล้ว"
  });
});

// 10. Database SQL / Scripts Downloader Exporter
app.get("/api/db/export-sql", (req, res) => {
  const sqlSchema = `-- Schema สำเนาข้อมูลฐานข้อมูล MySQL - ระบบบันทึกผลการประเมิน PA ของข้าราชการครู สพฐ.
-- ตัวขับเคลื่อนระบบ PHP/Node.js Windows Script

CREATE DATABASE IF NOT EXISTS \`obec_pa_db\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`obec_pa_db\`;

-- 1. ตารางครูผู้ปฏิบัติงาน (teachers)
CREATE TABLE IF NOT EXISTS \`teachers\` (
  \`id\` varchar(50) NOT NULL PRIMARY KEY,
  \`email\` varchar(100) NOT NULL UNIQUE,
  \`name\` varchar(100) NOT NULL,
  \`position\` varchar(100) NOT NULL,
  \`school\` varchar(100) NOT NULL,
  \`affiliation\` varchar(100) NOT NULL,
  \`phone\` varchar(20) DEFAULT NULL,
  \`slug\` varchar(50) NOT NULL UNIQUE,
  \`academic_year\` varchar(10) NOT NULL,
  \`status\` varchar(20) NOT NULL DEFAULT 'pending',
  \`date_created\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. ตารางตัวชี้วัดการประเมิน ส่วนที่ 1 (pa_indicators)
CREATE TABLE IF NOT EXISTS \`pa_indicators\` (
  \`id\` int AUTO_INCREMENT PRIMARY KEY,
  \`teacher_id\` varchar(50) NOT NULL,
  \`indicator_key\` varchar(10) NOT NULL, -- เช่น '1.1', '1.2'...'3.3'
  \`aspect\` varchar(100) NOT NULL, -- เช่น 'ด้านการจัดการเรียนรู้'
  \`title\` varchar(255) NOT NULL,
  \`description\` text DEFAULT NULL,
  \`status\` varchar(25-6) NOT NULL DEFAULT 'not_started',
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`teacher_id\`) REFERENCES \`teachers\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. ตารางลิงก์หลักฐานอ้างอิงรายตัวชี้วัด (evidence_links)
CREATE TABLE IF NOT EXISTS \`evidence_links\` (
  \`id\` varchar(50) NOT NULL PRIMARY KEY,
  \`teacher_id\` varchar(50) NOT NULL,
  \`target_type\` varchar(20) NOT NULL, -- 'indicator' หรือ 'challenge'
  \`target_key\` varchar(20) NOT NULL, -- คีย์ข้อชี้วัด เช่น '1.1' 
  \`name\` varchar(255) NOT NULL, -- เช่น 'แผนการสอนพิกัดขับเคลื่อน 5E'
  \`url\` text NOT NULL,
  FOREIGN KEY (\`teacher_id\`) REFERENCES \`teachers\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. ตารางประเด็นท้าทาย ส่วนที่ 2 (pa_challenges)
CREATE TABLE IF NOT EXISTS \`pa_challenges\` (
  \`id\` int AUTO_INCREMENT PRIMARY KEY,
  \`teacher_id\` varchar(50) NOT NULL UNIQUE,
  \`title\` varchar(255) DEFAULT '',
  \`problem_context\` text DEFAULT NULL,
  \`process\` text DEFAULT NULL,
  \`quantitative_output\` text DEFAULT NULL,
  \`qualitative_output\` text DEFAULT NULL,
  \`status\` varchar(20) NOT NULL DEFAULT 'not_started',
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`teacher_id\`) REFERENCES \`teachers\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- สคริปต์สาทธิตเพิ่มข้อมูลเริ่มต้นสำหรับดูแล Admin
INSERT INTO \`teachers\` (id, email, name, position, school, affiliation, phone, slug, academic_year, status)
VALUES ('t1-mana', 'mana@samsen.ac.th', 'ครูมานะ รักการสอน', 'ครูวิทยฐานะชำนาญการพิเศษ', 'โรงเรียนบ้านหนองหว้า', 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษาบุรีรัมย์ เขต 3', '081-234-5678', 'mana-samsen', '2569', 'approved')
ON DUPLICATE KEY UPDATE status='approved';
`;

  const windowsScript = `@echo off
:: Windows Setup script for hosting Node.js and mounting MySQL
:: ระบบบันทึกความตกลงการปฏิบัตงานครู (OBEC PA)
title OBEC PA System Setup - windows-installer
echo =======================================================
echo     OBEC PA Performance Agreement Windows Script Setup
echo =======================================================
echo.
echo ขั้นตอนการติดตั้งบนเครื่องเซิร์ฟเวอร์ Windows:
echo 1. ติดตั้ง Node.js v18 ขึ้นไป
echo 2. ติดตั้ง MySQL v8.0 หรือ XAMPP / AppServ เพื่อรันฐานข้อมูล
echo 3. หลังจากนั้นเปิดโปรแกรม MySQL Command-Line Client
echo 4. สร้างฐานข้อมูลด้วยไฟล์ SQL Schema: mysql_setup.sql
echo 5. คัดลอกการติดตั้งชุด Dependencies: "npm install express mysql2 cors dotenv"
echo 6. สร้างไฟล์ .env กำหนดค่าเชื่อมต่อ MySQL:
echo    DB_HOST=localhost
echo    DB_USER=root
echo    DB_PASS=123456
echo    DB_NAME=obec_pa_db
echo.
echo รันคำสั่งเปิดระบบ:
echo node server.js
echo.
pause
`;

  return res.json({
    success: true,
    sql: sqlSchema,
    windows_script: windowsScript
  });
});


// Serve static or client files via Vite
async function startServer() {
  // Let's connect to MySQL if environment keys are in place
  await initMySQL();

  const distPath = path.join(process.cwd(), "dist");
  const hasDist = fs.existsSync(distPath) && fs.existsSync(path.join(distPath, "index.html"));

  if (hasDist) {
    console.log("Serving static production files from dist directory...");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else if (process.env.NODE_ENV !== "production") {
    console.log("No built static files found. Initializing Vite development server...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.get("*", (req, res) => {
      res.status(500).send("No static web build files found in 'dist' directory. Please run 'npm run build' first.");
    });
  }

  const isPipe = typeof PORT === "string" && (PORT.startsWith("\\\\") || PORT.indexOf("\\pipe\\") !== -1 || PORT.indexOf(".pipe") !== -1);
  if (isPipe) {
    app.listen(PORT, () => {
      console.log(`Server is running on IIS named pipe: ${PORT}`);
    });
  } else {
    const numericPort = typeof PORT === "string" ? parseInt(PORT, 10) : PORT;
    app.listen(numericPort, "0.0.0.0", () => {
      console.log(`Server is running at http://localhost:${numericPort}`);
    });
  }
}

startServer();
