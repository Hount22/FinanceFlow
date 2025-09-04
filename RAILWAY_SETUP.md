# การตั้งค่าฐานข้อมูล Railway สำหรับแอปพลิเคชันการจัดการการเงินส่วนบุคคล

## ขั้นตอนการตั้งค่า Railway Database

### 1. สร้างฐานข้อมูล PostgreSQL ใน Railway
1. เข้าไปที่ [Railway.app](https://railway.app)
2. สร้างโปรเจ็กต์ใหม่
3. เพิ่ม PostgreSQL database service
4. คัดลอก connection string จากแท็บ "Connect"

### 2. เพิ่ม DATABASE_URL ใน Replit Secrets
1. ใน Replit ไปที่แท็บ "Secrets" (🔒)
2. เพิ่ม Secret ใหม่:
   - Key: `DATABASE_URL`
   - Value: Railway connection string (รูปแบบ: `postgresql://username:password@host:port/database`)

### 3. รัน Database Migration
เมื่อเพิ่ม DATABASE_URL แล้ว ให้รันคำสั่งเหล่านี้:

```bash
# รัน migration เพื่อสร้างตาราง
npx drizzle-kit migrate

# รีสตาร์ทแอปพลิเคชัน
npm run dev
```

## ไฟล์ที่เกี่ยวข้อง

- `migrations/0000_free_lifeguard.sql` - SQL migration file
- `server/storage.ts` - ระบบจัดการข้อมูลที่รองรับทั้ง PostgreSQL และ in-memory storage
- `shared/schema.ts` - Drizzle schema สำหรับตาราง
- `drizzle.config.ts` - การกำหนดค่า Drizzle

## การทำงานของระบบ

### Automatic Fallback
- หาก `DATABASE_URL` มีการตั้งค่า: ใช้ PostgreSQL database
- หาก `DATABASE_URL` ไม่มี: ใช้ in-memory storage (สำหรับ development)

### ตารางฐานข้อมูล
1. **transactions** - รายการธุรกรรม
2. **categories** - หมวดหมู่รายรับ/รายจ่าย (เริ่มต้นด้วยหมวดหมู่ภาษาไทย)
3. **budgets** - งบประมาณรายเดือน
4. **goals** - เป้าหมายทางการเงิน

## คุณสมบัติพิเศษ

- **Thai Localization**: อินเทอร์เฟซภาษาไทยพร้อมหมวดหมู่เริ่มต้น
- **Thai Tax Calculation**: คำนวณภาษีเงินได้บุคคลธรรมดาตามกฎหมายไทย
- **Currency Format**: แสดงผลเป็นบาท (฿) พร้อมรูปแบบตัวเลขไทย
- **Auto Migration**: สร้างตารางและข้อมูลเริ่มต้นอัตโนมัติ

## การแก้ไขปัญหา

### หากการเชื่อมต่อล้มเหลว
1. ตรวจสอบ DATABASE_URL ใน Secrets
2. ตรวจสอบสถานะ Railway database
3. ลองรีสตาร์ทแอปพลิเคชัน
4. หากยังมีปัญหา SSL certificate ให้ลบ DATABASE_URL ชั่วคราวเพื่อใช้ in-memory storage

### SSL Certificate Issues
หาก Railway connection มีปัญหา SSL ("self-signed certificate in certificate chain"):
- แอปพลิเคชันจะ fallback ไปใช้ in-memory storage อัตโนมัติ
- ข้อมูลจะหายไปเมื่อรีสตาร์ท แต่ระบบจะยังคงทำงาน
- ติดต่อ Railway support หรือตรวจสอบการตั้งค่า SSL ของ database

### หากไม่มีข้อมูลเริ่มต้น
- **PostgreSQL**: แอปพลิเคชันจะสร้างหมวดหมู่เริ่มต้นอัตโนมัติ
- **In-memory**: หมวดหมู่เริ่มต้นจะถูกสร้างทันทีเมื่อเริ่มแอป
- หากฐานข้อมูลไม่สามารถเข้าถึงได้ API จะคืนหมวดหมู่เริ่มต้นแทน

### ข้อดีของ Fallback System
- แอปพลิเคชันจะไม่หยุดทำงานแม้ฐานข้อมูลมีปัญหา
- สามารถทดสอบและใช้งานได้ทันทีโดยไม่ต้องรอตั้งค่าฐานข้อมูล
- เหมาะสำหรับ development และ demo