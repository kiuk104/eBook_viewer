import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiKey } from './settings.js';

/**
 * 텍스트를 문단 단위로 안전하게 자르는 함수
 */
function chunkText(text, maxLength) {
    const chunks = [];
    let currentChunk = "";
    const paragraphs = text.split(/\n\s*\n/); // 빈 줄 기준으로 문단 분리

    for (const paragraph of paragraphs) {
        if (paragraph.length > maxLength) {
            if (currentChunk) {
                chunks.push(currentChunk);
                currentChunk = "";
            }
            for (let i = 0; i < paragraph.length; i += maxLength) {
                chunks.push(paragraph.slice(i, i + maxLength));
            }
        } else {
            if (currentChunk.length + paragraph.length + 2 < maxLength) {
                currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
            } else {
                chunks.push(currentChunk);
                currentChunk = paragraph;
            }
        }
    }
    if (currentChunk) chunks.push(currentChunk);
    return chunks;
}

export async function cleanTextWithAI(text, onProgress) {
    const apiKey = getGeminiKey();
    if (!apiKey) {
        alert("설정에서 Google Gemini API 키를 먼저 등록해주세요!");
        throw new Error("API Key missing");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const CHUNK_SIZE = 6000; 
    const chunks = chunkText(text, CHUNK_SIZE);
    const totalChunks = chunks.length;
    let combinedResult = "";

    console.log(`📝 텍스트 분할 처리 시작: 총 ${totalChunks}개 구역`);

    const modelsToTry = [
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash-002",
        "gemini-1.5-flash"
    ];

    for (let i = 0; i < totalChunks; i++) {
        const chunk = chunks[i];
        const isFirstChunk = (i === 0);
        
        if (onProgress) {
            const percent = Math.round(((i + 1) / totalChunks) * 100);
            onProgress(`AI 변환 중... (${i + 1}/${totalChunks} 구역, ${percent}%)`);
        }

        // [수정된 프롬프트] 구조화 지시 강화
        let systemPrompt = "";
        if (isFirstChunk) {
            systemPrompt = `
            당신은 전문 전자책 편집자입니다.
            
            [필수 규칙]
            1. **서지 정보**: 텍스트 초반의 제목, 저자, 출판사 정보는 **반드시 마크다운 표**로 작성하세요. (헤더는 비워둘 것: | | |)
            2. **제목**: 책의 메인 제목은 반드시 '# 제목' (H1 태그)을 사용하여 가장 크게 표시하세요.
            3. **인용구/독백**: 중요한 독백이나 인용구는 '>' 기호를 사용하여 구분하세요. (뷰어에서 예쁘게 스타일링 됩니다)
            4. **본문 스타일**: 문단 사이에는 반드시 빈 줄을 넣어 가독성을 높이세요.
            5. **청소**: 불필요한 특수기호나 깨진 글자를 정리하되, 원문 내용은 절대 삭제하지 마세요.
            `;
        } else {
            systemPrompt = `
            당신은 소설 편집자입니다. 앞부분에 이어지는 텍스트를 정리 중입니다.
            
            [필수 규칙]
            1. **메타데이터 금지**: 표는 절대 다시 만들지 마세요. 본문만 이어서 작성하세요.
            2. **스타일**:
               - 중요한 독백이나 강조할 문장은 '>' 기호(인용구)를 사용하세요.
               - 문단 사이에는 빈 줄을 넣으세요.
            3. **내용 유지**: 내용은 끊김 없이 자연스럽게 이어져야 합니다.
            `;
        }

        let chunkSuccess = false;
        let chunkResult = "";

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    systemInstruction: systemPrompt 
                });

                const result = await model.generateContent({
                    contents: [{ role: "user", parts: [{ text: chunk }] }],
                    generationConfig: {
                        maxOutputTokens: 8192,
                        temperature: 0.7,
                    }
                });

                const response = await result.response;
                chunkResult = response.text();
                
                if (chunkResult) {
                    chunkSuccess = true;
                    combinedResult += chunkResult + "\n\n";
                    break; 
                }
            } catch (error) {
                console.warn(`⚠️ [Chunk ${i+1}] ${modelName} 실패:`, error);
            }
        }

        if (!chunkSuccess) {
            alert(`변환 중 오류가 발생했습니다. (${i+1}번째 구역)\n네트워크 상태를 확인해주세요.`);
            throw new Error("Chunk processing failed");
        }
        
        await new Promise(r => setTimeout(r, 500));
    }

    // 후처리: 과도한 공백만 제거 (기호는 살려둠)
    combinedResult = combinedResult.replace(/\n{3,}/g, "\n\n");

    return combinedResult;
}