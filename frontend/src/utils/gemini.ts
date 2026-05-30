export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

// Danh sách các mô hình hỗ trợ xoay vòng để phòng ngừa vượt giới hạn gọi (Rate Limit - 429)
export const GEMINI_MODELS = [
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

/**
 * Gọi API Gemini một cách đồng nhất, hỗ trợ xoay vòng model nếu gặp lỗi Rate Limit (429) hoặc lỗi kết nối.
 *
 * @param apiKey API Key cá nhân của người dùng
 * @param contents Danh sách lịch sử cuộc trò chuyện
 * @param systemInstruction Chỉ thị hệ thống (system prompt)
 */
export const callGeminiAPI = async (
  apiKey: string,
  contents: GeminiMessage[],
  systemInstruction?: string
): Promise<string> => {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Vui lòng cấu hình Gemini API Key cá nhân trong trang Cài đặt để sử dụng trợ lý AI.');
  }

  let lastErrorMessage = 'Không thể kết nối đến máy chủ AI';

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      
      const requestBody: any = { contents };
      if (systemInstruction) {
        requestBody.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 429) {
        console.warn(`Model ${model} bị quá giới hạn RPM (Rate Limit). Đang chuyển sang model kế tiếp...`);
        lastErrorMessage = 'Các mô hình AI đều vượt quá giới hạn lượt dùng (Rate Limit - 429).';
        continue;
      }

      if (!response.ok) {
        const errorDetails = await response.json().catch(() => ({}));
        console.warn(`Model ${model} trả về lỗi:`, errorDetails);
        lastErrorMessage = errorDetails.error?.message || `Model ${model} gặp sự cố khi xử lý.`;
        continue;
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (error: any) {
      console.warn(`Lỗi kết nối tới model ${model}:`, error);
      lastErrorMessage = error.message || lastErrorMessage;
    }
  }

  throw new Error(lastErrorMessage);
};
