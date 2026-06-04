import React from 'react';
import { 
  ArrowRight, 
  LogIn, 
  Bookmark,
  Sparkles,
  ChevronRight,
  Users,
  FileText,
  Monitor
} from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      {/* Hero Section */}
      <div className="relative bg-[#1e3a8a] overflow-hidden">
        {/* Decorative Circle */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 opacity-10">
          <div className="w-[800px] h-[800px] bg-white rounded-full" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Text & Buttons */}
            <div className="lg:col-span-7">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FFDB00]/10 border border-[#FFDB00]/30 rounded-full mb-10">
                <Sparkles size={16} className="text-[#FFDB00]" />
                <span className="text-xs font-bold text-[#FFDB00] uppercase tracking-widest">
                  สพฐ. PERFORMANCE AGREEMENT (PA)
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-white leading-tight mb-8">
                ระบบบันทึกผลการประเมิน<br />
                <span className="text-[#FFDB00]">ข้อตกลงในการพัฒนางาน (PA)</span><br />
                ของข้าราชการครู
              </h1>
              
              <p className="text-lg md:text-xl text-blue-100/80 leading-relaxed mb-12 max-w-2xl font-medium">
                เครื่องมือบันทึกความก้าวหน้าตามเกณฑ์ตัวชี้วัด 3 ด้าน (15 ตัวชี้วัดมาตรฐานและแบบประเมินประเด็นท้าทาย) 
                สำหรับข้าราชการครูกระทรวงศึกษาธิการ เพื่อสร้างพอร์ตสะสมผลงานอิงอัตโนมัติจัดส่งแก่คณะกรรมการประเมิน
              </p>
              
              <div className="flex flex-wrap gap-5">
                <button className="px-8 py-5 bg-[#FFDB00] hover:bg-[#ffe533] text-slate-900 rounded-xl font-black flex items-center gap-3 shadow-2xl shadow-yellow-500/20 transition-all transform hover:-translate-y-1">
                  สมัครขอลิงก์ใช้งานใหม่ 
                  <ArrowRight size={20} />
                </button>
                <button className="px-8 py-5 bg-transparent border-2 border-white/20 hover:border-white/50 text-white rounded-xl font-black flex items-center gap-3 transition-all backdrop-blur-sm">
                  <LogIn size={20} />
                  เข้าสู่ระบบบันทึก (แก้ไขข้อมูล)
                </button>
              </div>
            </div>

            {/* Right Column: Teacher Directory Card */}
            <div className="lg:col-span-5">
              <div className="bg-[#0f172a]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[100px] opacity-20" />
                
                <div className="relative z-10">
                  <div className="flex items-start gap-5 mb-10">
                    <div className="w-14 h-14 rounded-2xl bg-[#FFDB00]/10 flex items-center justify-center flex-shrink-0">
                      <Users className="text-[#FFDB00]" size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">รายชื่อคุณครูที่พร้อมรับการตรวจประเมิน</h3>
                      <p className="text-sm text-slate-400 font-medium leading-relaxed">คณกรรมการของสพฐ.หรือโรงเรียน สามารถคลิกอ้างอิงชื่อเพื่อเข้าตรวจสอบข้อมูลและหลักฐานตัวชี้วัดได้ทันที</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-12">
                    <TeacherEntry 
                      name="ครูมานะ รักการสอน" 
                      school="โรงเรียนบ้านหนองหว้า" 
                      slug="/mana-samsen" 
                    />
                    <div className="h-px bg-white/5 mx-2" />
                    <TeacherEntry 
                      name="นายสยาม เชียงเครือ" 
                      school="โรงเรียนบ้านหนองหว้า" 
                      slug="/siam" 
                    />
                  </div>

                  <div className="pt-8 border-t border-white/10 flex items-center justify-between">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">ผู้จัดทำ:</span>
                       <span className="text-xs font-bold text-white/90">คณะทำงานโรงเรียนข้าราชการยืดสมรรถนะ</span>
                    </div>
                    <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
                      <Bookmark className="text-[#FFDB00]" size={18} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Components Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
           <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">องค์ประกอบระบบบันทึกข้อตกลง PA</h2>
                <p className="text-slate-500 font-medium max-w-xl">รวบรวมทุกขั้นตอนการพัฒนางานตามมาตรฐานตำแหน่งและวิทยฐานะไว้ในที่เดียว</p>
              </div>
              <div className="h-1 flex-1 bg-slate-100 rounded-full hidden md:block mb-4 ml-12" />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureBox 
                 title="มาตรฐานตำแหน่ง" 
                 description="บันทึกผลการปฏิบัติงานตาม 3 ด้าน 15 ตัวชี้วัดมาตรฐานครู ครอบคลุมการจัดการเรียนรู้ การส่งเสริม และการพัฒนาตนเอง" 
                 icon={<FileText className="text-blue-600" size={32} />}
              />
              <FeatureBox 
                 title="ประเด็นท้าทาย" 
                 description="กำหนดเป้าหมายและผลลัพธ์การเรียนรู้ของผู้เรียน (KPI) ตามระดับวิทยฐานะที่คาดหวัง สอดคล้องกับบริบทห้องเรียน" 
                 icon={<Sparkles className="text-blue-600" size={32} />}
              />
              <FeatureBox 
                 title="แฟ้มสะสมงานดิจิทัล" 
                 description="ระบบอ้างอิงหลักฐาน ร่องรอย และคลิปวิดีโอการสอนอัตโนมัติ เพื่อความสะดวกในการตรวจประเมินแบบออนไลน์" 
                 icon={<Monitor className="text-blue-600" size={32} />}
              />
           </div>
        </div>
      </div>
    </div>
  );
}

function TeacherEntry({ name, school, slug }: { name: string, school: string, slug: string }) {
  return (
    <div className="flex items-center justify-between group cursor-pointer p-2 hover:bg-white/5 rounded-2xl transition-all">
      <div>
        <div className="text-base font-bold text-white group-hover:text-[#FFDB00] transition-colors">{name}</div>
        <div className="text-xs text-slate-500 font-medium mt-0.5">{school}</div>
      </div>
      <div className="flex items-center gap-1 text-[11px] font-bold text-[#FFDB00]/60 group-hover:text-[#FFDB00] transition-all">
        {slug}
        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}

function FeatureBox({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) {
  return (
    <div className="p-10 bg-slate-50 border border-slate-100 rounded-[2.5rem] hover:bg-white hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-500 group">
      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-8 border border-slate-100 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
        {icon}
      </div>
      <h4 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">{title}</h4>
      <p className="text-slate-500 text-base leading-relaxed font-medium">{description}</p>
    </div>
  );
}



