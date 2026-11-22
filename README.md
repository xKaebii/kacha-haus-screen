# Kacha Haus — จอในร้าน

กราฟิกตัวอักษรเคลื่อนไหวสำหรับจอ MagicPlayer ในร้าน Kacha Haus · React + Vite + GSAP + Three.js

**ลิงก์จอ:** https://xkaebii.github.io/kacha-haus-screen/ (ใส่ในแอพ LedArt → Web Page · **ปิด Refresh**)

## ฉาก (scene)
| type | ฉาก | จุดหักมุม |
|---|---|---|
| `led` | ป้าย LED เดิม: คำเฉียงวิ่งสวนกัน + โลโก้กลาง | – |
| `hyper` | **Hyper** สไตล์คลิปโชว์จอ LED: คำกระแทกทีละคำ (คำ `*` เป็นสีเน้น) → คำถูกเหวี่ยง ตบ หมุน 3 แกน → หัวข้อกระแทกพร้อมสั่น 3 เฟรม → ตัวอักษรแตกแล้วรวม → โลโก้ + วงแหวน · เบลอตามความเร็ว (พอร์ตจาก HyperFrames ด้านล่าง) | ตั้งค่า `hyper.slamA`, `shutter`, `headline`, `explode`, `slamB`, `accent` |
| `ramp` | **Speed Ramp** (GSAP ล้วน) คำพุ่งเข้าเร็วมาก ผ่อนจนเกือบหยุดให้อ่าน แล้วพุ่งออก (ความเร็วรูปตัว U) เบลอและยืดตามความเร็ว · สลับทิศ ขวา/ซ้าย/ล่าง/ซูมทะลุ · จบด้วยโลโก้ | ตั้งค่า `ramp.words`, `ramp.font`, `ramp.drift` |
| `type` | **Type (GSAP ล้วน)** คำใหญ่ทีละคำ แต่ละคำเข้าด้วยท่าต่างกัน 15 ท่า ทุก 4 คำมีกำแพงคำหมุน −90° (พอร์ตจาก Codrops ด้านล่าง) | – |
| `kinetic` | **Kinetic 3D** (พอร์ตจาก Codrops ด้านล่าง) 4 รูปทรงบนวงกลม หมุนต่อกัน · `endless` ปมคำ · `swirl` ลูกบอลคำ · `twisted` แท่งคำบิด · `relax` ผืนคำเป็นคลื่น (เลือกเดี่ยวได้) | – |
| `stretch` | **Stretch Stack** คำเต็มความกว้างซ้อนกัน คำหนึ่งยืดเต็มจอทีละคำ | ทั้งกองพับเข้ากลางจอ โลโก้หยดน้ำบานออกมา |
| `tunnel` | **Tunnel Dive** (Three.js) ดิ่งในอุโมงค์ที่ผนังเป็นคำ เร่ง-ผ่อนเป็นจังหวะ | ผนังหายไป โลโก้ลอยขึ้นมาจากความลึก |
| `beat` | **One Line, One Beat** "IF I WERE YOU I WOULD DRINK MYSELF TOO" ทีละท่อนเต็มจอ | "TOO" ค่อยๆ ถูกเติมเหมือนนมไหลขึ้น แล้วกลายเป็นโลโก้ |
| `windows` | **Letters as Windows** KACHA / HAUS ตัวยักษ์เป็นหน้าต่าง มองทะลุเห็นป้าย LED วิ่ง | ตัวอักษรหุบ หน้าต่างกลายเป็นหยดน้ำ แล้วเติมเป็นโลโก้ |

การเคลื่อนไหวทั้งหมด: ease-out ยาว (expo / quart) ไม่เด้ง ไม่ overshoot ไม่แฟลช

## หน้า control (แก้จอแบบ live)
**https://xkaebii.github.io/kacha-haus-screen/control.html** · เข้าด้วยบัญชี Google ของร้าน (`kachahaus@gmail.com`) · แก้แล้วจอเปลี่ยนในไม่กี่วินาที
- เลือกเพลย์ลิสต์ / ฉากเดียว / รูป / จอดำ · เปิดปิดฉาก ตั้งเวลา เรียงลำดับ · สี · คำของทุกฉาก · ป้าย LED (มุม ขนาด ความเร็ว โลโก้)
- ค่าเก็บใน Firebase Realtime Database โปรเจค `kacha-haus-screen` (บัญชีร้าน, แพลนฟรี Spark, Singapore) ที่ `screen/config`
- กฎฐานข้อมูล: ใครก็อ่าน `screen` ได้ (จอต้องอ่าน) · เขียนได้เฉพาะบัญชีร้านที่ยืนยันอีเมลแล้ว · จะเพิ่มคนแก้ได้ ต้องแก้ Rules ใน Firebase console
- ถ้ามีค่าใน Firebase จอใช้ค่านั้น · ถ้าไม่มี (หรือเชื่อมไม่ได้ตั้งแต่ต้น) ใช้ `public/config.json` · ปุ่ม "รีเซ็ตเป็นค่าเริ่มต้น" = โหลดจาก `config.json`
- ทดสอบหน้า control ในเครื่องโดยไม่ล็อกอิน: `npm run dev` แล้วเปิด `/control.html?demo` (ไม่บันทึกจริง)

## เปลี่ยนสิ่งที่ขึ้นจอผ่านไฟล์ (ค่าเริ่มต้น)
แก้ `public/config.json` แล้ว commit (มือถือ: แอพ GitHub → repo นี้ → public/config.json → ✏️) · GitHub Actions build + deploy ~1–2 นาที แล้วจอเปลี่ยนเองภายใน 1 นาที (ไม่ต้อง refresh)

- `mode`: `playlist` วนตาม `scenes` · หรือชื่อฉากเดียว (`led`, `stretch`, `tunnel`, `beat`, `windows`) · `image` รูปเต็มจอ (`image` = ลิงก์รูป, `fit` = `cover`/`contain`) · `black` จอดำ
- `scenes`: `[{ "type": "stretch", "seconds": 16.5 }, …]` ลำดับและเวลาต่อฉาก (เวลาเท่ากับหนึ่งรอบพอดีจะจบที่โลโก้)
- `rows`: คำของป้าย LED (ใช้ใน `led`, `tunnel`, `windows`) · หนึ่งบรรทัด = หนึ่งแถว · `*` หน้าคำ = ตัวทึบ
- `stretch.words`, `beat.lines` (ใช้ `/` แบ่งแถวในท่อนเดียว), `windows.words` เปลี่ยนคำของแต่ละฉากได้
- `bg` / `fg` สีพื้น / ตัวอักษร · `angle`, `size`, `speed` ของป้าย LED · `logo`, `logoX`, `logoY`, `logoSize` โลโก้ในป้าย LED
- `guides`: `true` = เส้นกลางจอ + ขอบ + ขนาดที่เบราว์เซอร์เห็น
- เพิ่ม `version` ทุกครั้งที่แก้ · ต่อท้ายลิงก์ `?debug=1` เห็นฉาก/เวอร์ชันมุมขวาล่าง · ทดสอบฉากเดียว: `?scene=tunnel`

## พัฒนา
```
npm install
npm run dev        # http://localhost:5173  (?scene=…)
npm run build      # dist/ + build.json
```
- push เข้า `main` = deploy อัตโนมัติ (`.github/workflows/deploy.yml`)
- หน้าเว็บเช็ก `build.json` ทุก 1 นาที ถ้ามีเวอร์ชันใหม่จะจางออกแล้วโหลดใหม่เอง · รีโหลดนุ่มๆ ทุก 6 ชม. · เน็ตหลุดโชว์ของเดิมต่อ
- ฉากอยู่ใน `src/scenes/` · สี/ฟอนต์/โลโก้/ease ใน `src/lib/brand.js`
- ฟอนต์ Higed © arijuanda (All Rights Reserved) — ยังต้องเช็กไลเซนส์การใช้งาน

## เครดิต
- ฉาก `kinetic` / `endless` / `swirl` / `twisted` / `relax` พอร์ตจาก **Kinetic Typography with Three.js** โดย Mario Carrillo (marioecg) สำหรับ Codrops (2020) — https://tympanus.net/codrops/2020/06/02/kinetic-typography-with-three-js/ · https://github.com/marioecg/codrops-kinetic-typo · MIT License, Copyright (c) 2009 - 2020 Codrops
- ฟอนต์ต้นฉบับของฉากนี้: Orbitron, Montserrat Alternates, Archivo Black, Open Sans (SIL Open Font License ผ่าน @fontsource)
- ตั้งค่าใน config: `kinetic.words` (4 คำ), `kinetic.palette` (`original` / `brand`), `kinetic.font` (`original` / `higed`), `kinetic.hold` (วินาทีที่ค้างแต่ละรูปทรง)
- ฉาก `type` พอร์ตจาก Codrops **On-Scroll Typography Animations** (https://github.com/codrops/OnScrollTypographyAnimations) และ **Kinetic Type Page Transition** (https://github.com/codrops/KineticTypePageTransition) · MIT License, Copyright (c) Codrops · ต้นฉบับขยับตามการเลื่อนหน้า ที่นี่เล่นตามเวลา · ตั้งค่า `type.words`, `type.font` (`archivo` / `higed`), `type.hold`
- ฉาก `hyper` พอร์ตจาก **HyperFrames** โดย HeyGen (https://github.com/heygen-com/hyperframes) · Apache License 2.0 (http://www.apache.org/licenses/LICENSE-2.0) · ใช้คอมโพเนนต์ caption-kinetic-slam, shutter-slam, headline-slam, char-slam-explode, logo-sting · สิ่งที่เปลี่ยน: คำ/โลโก้ของร้าน, จัดสำหรับจอแนวตั้ง, เบลอคิดจากความเร็วจริงแทนการเรนเดอร์ shutter, ตัดแฟลชขาว 1 เฟรมของ logo-sting ออก
