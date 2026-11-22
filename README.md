# Kacha Haus — จอในร้าน

กราฟิกตัวอักษรเคลื่อนไหวสำหรับจอ MagicPlayer ในร้าน Kacha Haus · React + Vite + GSAP + Three.js

**ลิงก์จอ:** https://xkaebii.github.io/kacha-haus-screen/ (ใส่ในแอพ LedArt → Web Page · **ปิด Refresh**)

## ฉาก (scene)
| type | ฉาก | จุดหักมุม |
|---|---|---|
| `led` | ป้าย LED เดิม: คำเฉียงวิ่งสวนกัน + โลโก้กลาง | – |
| `stretch` | **Stretch Stack** คำเต็มความกว้างซ้อนกัน คำหนึ่งยืดเต็มจอทีละคำ | ทั้งกองพับเข้ากลางจอ โลโก้หยดน้ำบานออกมา |
| `tunnel` | **Tunnel Dive** (Three.js) ดิ่งในอุโมงค์ที่ผนังเป็นคำ เร่ง-ผ่อนเป็นจังหวะ | ผนังหายไป โลโก้ลอยขึ้นมาจากความลึก |
| `beat` | **One Line, One Beat** "IF I WERE YOU I WOULD DRINK MYSELF TOO" ทีละท่อนเต็มจอ | "TOO" ค่อยๆ ถูกเติมเหมือนนมไหลขึ้น แล้วกลายเป็นโลโก้ |
| `windows` | **Letters as Windows** KACHA / HAUS ตัวยักษ์เป็นหน้าต่าง มองทะลุเห็นป้าย LED วิ่ง | ตัวอักษรหุบ หน้าต่างกลายเป็นหยดน้ำ แล้วเติมเป็นโลโก้ |

การเคลื่อนไหวทั้งหมด: ease-out ยาว (expo / quart) ไม่เด้ง ไม่ overshoot ไม่แฟลช

## เปลี่ยนสิ่งที่ขึ้นจอ (จากที่ไหนก็ได้)
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
