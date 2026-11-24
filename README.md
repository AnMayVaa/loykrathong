# ลอยกระทงออนไลน์ ๒๕๖๙ · Loy Krathong Online 2026

เว็บลอยกระทงออนไลน์สำหรับคืนวันเพ็ญ เดือนสิบสอง (อังคาร 24 พฤศจิกายน 2569)
ประดิษฐ์กระทง ตั้งจิตอธิษฐาน แล้วลอยบนสายน้ำเดียวกับทุกคนที่เข้ามาในคืนนี้ โดยไม่สร้างขยะในแม่น้ำจริง

**Live:** https://loykrathong2569.vercel.app · **About / FAQ:** https://loykrathong2569.vercel.app/about

## ผู้สร้าง · Author

**พิทักษ์ ปทุมวัน (โอม)** · Pitak "Ohm" Patumwan
นักศึกษาวิศวกรรมคอมพิวเตอร์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (KMUTNB)

- Portfolio: https://ohmpatumwan.com
- GitHub: [@AnMayVaa](https://github.com/AnMayVaa)
- LinkedIn: https://www.linkedin.com/in/ohmpatumwan
- Facebook: https://www.facebook.com/Ohm.Patumwan
- Email: pitakpatumwan14@gmail.com

## Features

- ฉากแม่น้ำยามค่ำคืนวาดสดด้วย Canvas: พระจันทร์เต็มดวงและเงาสะท้อน, วัดที่เปิดไฟ, โคมลอย, พลุ, หิ่งห้อย
- ประดิษฐ์กระทงได้ 5 แบบ (ใบตอง, ขนมปัง, ดอกบัว, หยวกกล้วย, กะลา) × ดอกไม้ 6 สี พร้อมพรีวิวสด
- สายน้ำร่วมกัน: กระทงของทุกคนลอยมาให้เห็น แตะเพื่ออ่านชื่อและคำอธิษฐาน, ตัวนับจำนวนกระทงแบบสด
- เลือกเก็บคำอธิษฐานไว้ในใจได้ (ไม่ส่งออกจากเครื่อง)
- แตะท้องฟ้าเพื่อปล่อยโคมลอยของตัวเอง
- เสียงน้ำและเสียงระนาดสังเคราะห์ด้วย Web Audio (ไม่มีไฟล์เพลง)
- ภาษาไทย / English, รองรับมือถือ, คีย์บอร์ด, `prefers-reduced-motion`
- ทำงานต่อได้แม้ออฟไลน์ (กระทงลอยในเครื่อง)

## Tech

- Static site ล้วน: HTML + CSS + ES modules, ไม่มี build step, ไม่มี dependency ฝั่ง client
- ฟอนต์ Charm และ Anuphan (SIL OFL) โฮสต์ในโปรเจกต์เอง
- Backend: Supabase (Postgres) ผ่าน REST — ตาราง `public.krathongs`
  - RLS: อ่านและเพิ่มได้อย่างเดียว ห้ามแก้หรือลบ
  - Trigger ฝั่งเซิร์ฟเวอร์ตัดช่องว่าง/ความยาวข้อความ, บังคับเวลาเซิร์ฟเวอร์ และจำกัด 20 กระทง/นาที ต่อ IP
- Deploy บน Vercel พร้อม Content-Security-Policy เข้มงวด (`vercel.json`)

## Run locally

```bash
python3 -m http.server 8080
# แล้วเปิด http://localhost:8080
```

## Structure

```
index.html          หน้าเว็บหลัก
css/style.css       สไตล์ทั้งหมด
js/main.js          UI, ฟอร์มประดิษฐ์กระทง, polling
js/scene.js         ฉากแม่น้ำ (Canvas), พรีวิว
js/draw.js          วาดกระทง ดอกไม้ โคมลอย เปลวเทียน
js/api.js           เชื่อม Supabase REST
js/audio.js         เสียงสังเคราะห์
js/i18n.js          ข้อความไทย/อังกฤษ
fonts/              Charm, Anuphan (OFL)
about.html          หน้าเกี่ยวกับ / วิธีใช้ / FAQ / เครดิต (/about)
robots.txt          อนุญาตทั้ง search engine และ AI crawler
sitemap.xml         แผนผังเว็บสำหรับ search engine
llms.txt            สรุปเว็บสำหรับ AI assistant
humans.txt          เครดิตผู้สร้าง
vercel.json         headers + CSP
```

## SEO

- Title/description ภาษาไทย + อังกฤษ, Open Graph, Twitter card
- Structured data (JSON-LD): WebSite, WebApplication, SoftwareSourceCode, Person, AboutPage, FAQPage, BreadcrumbList
- `robots.txt` เปิดให้ทุก crawler รวมถึง AI (GPTBot, ClaudeBot, PerplexityBot, Google-Extended ฯลฯ) + `sitemap.xml` + `llms.txt`
- แจ้ง Bing/IndexNow อัตโนมัติด้วย key file ที่ root

## License

© 2569 พิทักษ์ ปทุมวัน — ฟอนต์ Charm และ Anuphan ใช้ภายใต้ SIL Open Font License
