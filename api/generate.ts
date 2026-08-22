import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    // Chỉ nhận phương thức POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Lấy Key từ biến môi trường Vercel
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        // Lấy 4 trường dữ liệu từ form giao diện của bạn gửi lên
        const { yeuCau, chuyenNganh, tenLenh, nangCao } = req.body;

        // Ép AI vào vai chuyên gia và truyền tham số
        const prompt = `Bạn là một kỹ sư chuyên viết AutoLISP tối ưu cho mảng ${chuyenNganh}. 
        Hãy viết mã LISP thực hiện công việc: ${yeuCau}. 
        Sử dụng lệnh tắt là: ${tenLenh}. 
        Yêu cầu nâng cao: ${nangCao}.
        Chỉ trả về đoạn mã LISP thuần túy, tuyệt đối không giải thích thêm.`;

        // Gọi AI sinh mã
        const result = await model.generateContent(prompt);
        const lispCode = result.response.text();

        // Trả kết quả về cho Frontend hiển thị
        return res.status(200).json({ lispCode: lispCode });

    } catch (error) {
        console.error("Lỗi Server:", error);
        return res.status(500).json({ error: 'Có lỗi xảy ra khi kết nối AI' });
    }
}