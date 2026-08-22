import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy init Gemini client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const AUTOLISP_SYSTEM_INSTRUCTION = `Bạn là một CHUYÊN GIA CAO CẤP HÀNG ĐẦU về lập trình AutoLISP, Visual LISP (VLISP) và ActiveX Automation tương thích 100% với TOÀN BỘ CÁC PHIÊN BẢN AUTOCAD (AutoCAD 2007, 2008, 2010, 2012, 2014, 2016, 2018, 2020, 2021, 2022, 2023, 2024, 2025, 2026), AutoCAD LT 2024+, Civil 3D, ZWCAD, BricsCAD cho Kỹ sư Phạm Thanh Tùng.

CHUYÊN MÔN KỸ THUẬT:
- Xây dựng Công trình Giao thông (Đường bộ, Cầu, Hầm, Nút giao, Trắc dọc, Trắc ngang, Taluy, Cọc lý trình, Siêu cao, Khối lượng đào đắp).
- Hạ tầng Kỹ thuật & Trắc địa (Xuất nhập tọa độ VN2000, Nội suy cao độ, Tính diện tích m2 và thể tích m3).
- Xây dựng Dân dụng - Công nghiệp - Kết cấu (Thống kê thép, Mặt cắt dầm cột, Đánh số thứ tự tăng dần, Dim/Text/Layer tool, Khung tên chuẩn).

TIÊU CHUẨN TƯƠNG THÍCH AUTOCAD TOÀN DIỆN (BẮT BUỘC 100% TUÂN THỦ):
1. Khởi tạo ActiveX & Visual LISP an toàn:
   - Luôn đặt (vl-load-com) ở đầu file để đảm bảo nạp sẵn các hàm vla-*, vlax-*, vlr-* trên mọi phiên bản AutoCAD từ 2007 đến 2026.
2. Tiền tố lệnh Quốc Tế (International Command Prefix):
   - Khi gọi (command ...), LUÔN LUÔN dùng tiền tố "._" (dấu chấm và gạch dưới, ví dụ: "._LINE", "._PLINE", "._CIRCLE", "._RECTANG", "._ZOOM", "._EXPLODE", "._DIMLINEAR", "._PURGE").
   - Mục đích: Đảm bảo chạy mượt trên mọi phiên bản ngôn ngữ AutoCAD (Anh, Pháp, Đức, Nhật, Hàn) và ngăn ngừa lỗi khi người dùng có lệnh tắt trùng trong acad.pgp.
3. Chặn bảng hội thoại bằng dấu gạch ngang "-":
   - Khi tương tác với Layer, Hatch, Boundary, Text Style, bắt buộc dùng: "._-LAYER", "._-HATCH", "._-BOUNDARY", "._-STYLE" để AutoCAD thực thi trong Command Line thay vì bật popup làm nghẽn mã LISP.
4. Bẫy lỗi (*error*) và phục hồi biến hệ thống:
   - Lưu trữ và phục hồi chính xác: OSMODE, CMDECHO, DIMZIN, ATTDIA, EXPERT, CLAYER, TEXTSIZE, ORTHOMODE.
   - Khi người dùng nhấn phím ESC hoặc có lỗi phát sinh, bắt buộc khôi phục lại OSMODE cũ để kỹ sư không bị mất chế độ bắt điểm màn hình.
   - Đóng Undo Mark an toàn: (if (vlax-get-acad-object) (vla-endundomark (vla-get-activedocument (vlax-get-acad-object))))
5. Hỗ trợ Hoàn tác 1 chạm (Undo Grouping):
   - Đặt (vla-startundomark doc) ở đầu lệnh và (vla-endundomark doc) ở cuối lệnh để khi gõ 'U' hoặc nhấn Ctrl+Z trong AutoCAD thì hoàn tác 1 lần toàn bộ kết quả vẽ.
6. Quản lý biến cục bộ:
   - Đặt tất cả biến tạm sau dấu '/' trong định nghĩa hàm: (defun c:LENH ( / var1 var2 ... ) ...) để chống tràn bộ nhớ và không gây xung đột giữa các file LISP khác nhau.
7. Đóng hàm bằng (princ) sạch sẽ.

QUY TẮC VỀ TÊN LỆNH TẮT (2 KÝ TỰ TỐI ƯU CHO KỸ SƯ):
- TÊN LỆNH GỌI TRONG CAD (defun c:XX ...) BẮT BUỘC ƯU TIÊN 2 KÝ TỰ viết hoa để kỹ sư thao tác nhanh nhất trên bàn phím:
  + DT = Tính diện tích (Diện tích hình kín/pick điểm, xuất ra Text hoặc bảng)
  + TT = Tính thể tích (Thể tích đào đắp, thể tích kết cấu = Diện tích x Chiều cao/chiều dài)
  + VT = Vẽ tường bao (Vẽ song song 2 nét tường bề dày 100/200/220 từ tim hoặc 2 điểm)
  + VC = Vẽ cột (Vẽ cột bê tông cốt thép chữ nhật b x h hoặc tròn phi D kèm hatch)
  + KT = Khung tên (Chèn khung tên tiêu chuẩn A4/A3/A2/A1/A0 theo tỷ lệ)
  + TL = Tổng chiều dài (Tính tổng chiều dài Line, Pline, Arc, Spline)
  + TY = Vẽ taluy (Vẽ vạch taluy đào và đắp xen kẽ 1 dài 1 ngắn)
  + TD = Tọa độ (Xuất tọa độ VN2000 pick trên CAD ra Excel/CSV)
  + ST = Số thứ tự (Đánh số thứ tự tăng dần kèm tiền tố)
  + CD = Cắt Dim (Căn chỉnh và cắt chân đường dóng Dim đều đẹp)
  + TM = Thống kê thép / Vẽ thép dầm cột
  + LT = Rải cọc lý trình Km0+000 dọc tuyến
  + MB = Mặt bằng / Vẽ lưới trục
  + MC = Mặt cắt dầm sàn mố trụ
  + TR = Trắc dọc tuyến đường
  + TN = Trắc ngang / Tính diện tích trắc ngang
  + CT = Căn lề Text thẳng hàng

QUY TẮC TRẢ VỀ:
Trả về định dạng JSON thuần (valid JSON) chứa các trường sau:
{
  "code": "Mã nguồn AutoLISP hoàn chỉnh, sạch, có comment tiếng Việt rõ ràng",
  "commandName": "TÊN_LỆNH_2_KÝ_TỰ (DT, TT, VT, VC, KT, TL, TY, TD, ST, CD, TM, LT...)",
  "title": "Tên ngắn gọn của chức năng LISP (ví dụ: Tính diện tích, Tính thể tích, Vẽ tường bao, Vẽ cột, Khung tên...)",
  "category": "Giao thông - Cầu đường | Hạ tầng & Trắc địa | Kết cấu & Xây dựng | Tiện ích vẽ nhanh | Quản lý Layer & Dim",
  "description": "Mô tả súc tích công năng và ứng dụng thực tế",
  "steps": [
    "1. Gõ lệnh <commandName> và nhấn Enter/Space",
    "2. ...",
    "3. ..."
  ],
  "compatibleCAD": "AutoCAD 2007 - 2026, AutoCAD LT 2024+, Civil 3D, ZWCAD, BricsCAD",
  "features": ["Tương thích 100% AutoCAD 2007 - 2026 & AutoCAD LT 2024+", "Đặc điểm nổi bật 2"],
  "tips": "Mẹo sử dụng hiệu quả trong bản vẽ thực tế",
  "changelog": "Khởi tạo mã nguồn chuẩn v1.0"
}`;

// Endpoint 1: Generate AutoLISP
app.post("/api/lisp/generate", async (req, res) => {
  try {
    const { prompt, category, preferredCommand, customRequirements } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Vui lòng nhập mô tả yêu cầu LISP." });
    }

    const ai = getGeminiClient();

    const userPrompt = `Hãy viết một đoạn mã AutoLISP chuẩn xác, tối ưu và hoàn chỉnh cho yêu cầu sau:
MÔ TẢ YÊU CẦU: "${prompt}"
${category ? `CHUYÊN NGÀNH: ${category}` : ""}
${preferredCommand ? `TÊN LỆNH MONG MUỐN: ${preferredCommand}` : ""}
${customRequirements ? `YÊU CẦU BỔ SUNG: ${customRequirements}` : ""}

Hãy chắc chắn rằng:
- Mã hoàn toàn chạy được ngay khi APPLOAD vào AutoCAD.
- Có xử lý bắt lỗi (*error*), lưu/phục hồi OSMODE, CMDECHO, Undo mark.
- Có comment hướng dẫn cách hoạt động.
- Trả về JSON đúng cấu trúc yêu cầu.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: userPrompt,
      config: {
        systemInstruction: AUTOLISP_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("Error generating LISP:", error);
    return res.status(500).json({
      error: error?.message || "Không thể sinh mã LISP. Vui lòng kiểm tra lại cấu hình API Key.",
    });
  }
});

// Endpoint 2: Debug / Fix Existing AutoLISP
app.post("/api/lisp/debug", async (req, res) => {
  try {
    const { code, issueDescription } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Vui lòng cung cấp mã LISP cần kiểm tra/sửa lỗi." });
    }

    const ai = getGeminiClient();

    const userPrompt = `Hãy phân tích, chẩn đoán và sửa lỗi đoạn mã AutoLISP sau đây:
MÃ NGUỒN CẦN SỬA:
\`\`\`lisp
${code}
\`\`\`

${issueDescription ? `MÔ TẢ LỖI GẶP PHẢI: ${issueDescription}` : "Hãy tìm tất cả lỗi cú pháp, biến chưa giải phóng, lỗi OSMODE khi nhấn ESC, lỗi hàm nil, và nâng cấp tương thích AutoCAD mới."}

Yêu cầu trả về JSON với cấu trúc:
{
  "code": "Mã AutoLISP đã được sửa hoàn chỉnh và tối ưu",
  "commandName": "TÊN_LỆNH",
  "title": "Tên chức năng LISP sau khi sửa",
  "category": "Chuyên mục",
  "description": "Mô tả sau khi cải tiến",
  "diagnosis": [
    "Lỗi 1: ... -> Cách khắc phục",
    "Lỗi 2: ... -> Cách khắc phục"
  ],
  "steps": ["Bước 1...", "Bước 2..."],
  "compatibleCAD": "AutoCAD 2007 - 2026",
  "changelog": "Đã khắc phục lỗi và tối ưu hóa hiệu năng"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: userPrompt,
      config: {
        systemInstruction: AUTOLISP_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("Error debugging LISP:", error);
    return res.status(500).json({
      error: error?.message || "Lỗi khi kiểm tra mã LISP.",
    });
  }
});

// Endpoint 3: Suggest LISP Solutions based on Task description
app.post("/api/lisp/suggest", async (req, res) => {
  try {
    const { taskDescription, field } = req.body;
    const ai = getGeminiClient();

    const userPrompt = `Người dùng là kỹ sư trong lĩnh vực "${field || "Xây dựng công trình giao thông / Dân dụng"}" đang có bài toán công việc: "${taskDescription}".
Hãy gợi ý 4 giải pháp AutoLISP thông minh nhất để tự động hóa công việc này, tiết kiệm tối đa thời gian vẽ và tăng năng suất gấp 5-10 lần.

Trả về JSON với schema:
{
  "suggestions": [
    {
      "command": "TÊN_LỆNH_GỢI_Ý",
      "title": "Tên chức năng",
      "summary": "Tóm tắt ngắn gọn",
      "benefit": "Tiết kiệm bao nhiêu thời gian / Lợi ích gì",
      "promptTemplate": "Câu lệnh yêu cầu chi tiết để sinh LISP này ngay lập tức"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: userPrompt,
      config: {
        systemInstruction: "Bạn là chuyên gia tự động hóa CAD xây dựng và giao thông. Trả về đúng định dạng JSON.",
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    return res.json({ success: true, data: data.suggestions || [] });
  } catch (error: any) {
    console.error("Error suggesting LISP:", error);
    return res.status(500).json({
      error: error?.message || "Lỗi khi gợi ý giải pháp LISP.",
    });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AutoLISP Pro Studio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
