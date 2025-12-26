import { getGeminiKey } from './settings.js';

export async function cleanTextWithAI(text, onProgress) {
    const apiKey = getGeminiKey();
    if (!apiKey) {
        alert("설정에서 Google Gemini API 키를 먼저 등록해주세요!");
        throw new Error("API Key missing");
    }

    // 텍스트가 너무 길면 AI가 거부할 수 있으므로, 실제로는 챕터별로 나누거나 
    // Gemini 1.5 Pro(긴 문맥 지원)를 사용해야 합니다. 
    // 여기서는 간단히 안내 메시지를 띄우고 진행합니다.
    if (text.length > 30000) {
        const confirm = window.confirm("텍스트가 깁니다. AI 처리에 시간이 걸릴 수 있습니다. 진행할까요?");
        if (!confirm) return null;
    }

    const systemPrompt = `
    당신은 전문 전자책 편집자입니다. 아래 제공되는 지저분한 텍스트 파일을 읽기 편한 '마크다운(Markdown)' 형식으로 정리해주세요.
    
    [편집 규칙]
    1. **줄바꿈 교정**: 문장이 끝나지 않았는데 강제로 줄바꿈된 것을 공백으로 이어붙여주세요.
    2. **문단 구분**: 문단 사이에는 빈 줄을 하나 넣어주세요.
    3. **소제목 식별**: 챕터 제목이나 소제목은 '## ' 또는 '### '을 사용하여 헤더로 만들어주세요.
    4. **가독성**: 대화문은 줄을 나누어 가독성을 높여주세요.
    5. **내용 유지**: 원문의 내용은 절대 삭제하거나 창작하지 마세요. 오타가 명백한 경우만 수정하세요.
    
    결과는 오직 정리된 마크다운 텍스트만 출력하세요. (설명이나 인사말 생략)
    `;

    /**
     * 특정 모델로 API 호출 시도
     * @param {string} modelName - 사용할 모델 이름
     * @returns {Promise<string>} 변환된 텍스트
     */
    async function tryModel(modelName) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: systemPrompt + "\n\n---\n\n" + text }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('응답 형식이 올바르지 않습니다.');
        }

        return data.candidates[0].content.parts[0].text;
    }

    try {
        if(onProgress) onProgress("AI가 텍스트를 읽고 있습니다...");

        // 먼저 gemini-1.5-flash-002 시도
        try {
            return await tryModel('gemini-1.5-flash-002');
        } catch (error) {
            console.warn(`gemini-1.5-flash-002 모델 호출 실패: ${error.message}`);
            
            // 실패 시 gemini-2.0-flash-exp로 재시도
            if(onProgress) onProgress("대체 모델로 재시도 중...");
            try {
                return await tryModel('gemini-2.0-flash-exp');
            } catch (retryError) {
                console.error(`gemini-2.0-flash-exp 모델 호출도 실패: ${retryError.message}`);
                throw new Error(`모든 모델 호출 실패. 마지막 오류: ${retryError.message}`);
            }
        }

    } catch (error) {
        console.error("AI Error:", error);
        alert("AI 변환 중 오류가 발생했습니다: " + error.message);
        return null;
    }
}