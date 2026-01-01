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

    // 모델 우선순위
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

        // [수정된 프롬프트] 시각적 찌꺼기 제거 요청
        let systemPrompt = "";
        if (isFirstChunk) {
            systemPrompt = `
            당신은 전문 전자책 편집자입니다.
            
            [필수 규칙 - 엄격 준수]
            1. **서지 정보 표**: 문서 최상단에만 저자/출판사 정보를 '마크다운 표'로 작성하고, 바로 아래 '---' 구분선을 넣으세요.
            2. **본문 스타일**: 일반적인 소설책처럼 작성하세요.
               - **절대** 대화문에 인용구 기호('>')를 사용하지 마세요. (화면에 회색 줄이 생겨 지저분합니다)
               - **절대** 줄바꿈을 위해 백슬래시('\\')나 파이프('|') 기호를 넣지 마세요.
            3. **문단 간격**: 문단과 문단 사이는 반드시 **빈 줄 하나(엔터 두 번)**를 비워주세요.
            4. **내용 유지**: 원문 내용을 삭제하거나 요약하지 말고 그대로 살리세요.
            `;
        } else {
            systemPrompt = `
            당신은 소설 편집자입니다. 앞부분에 이어지는 텍스트를 정리 중입니다.
            
            [필수 규칙]
            1. **메타데이터/표 금지**: 앞부분에서 이미 작성했으니, 여기서는 절대 표를 만들지 마세요.
            2. **본문 스타일**:
               - 대화문에 인용구 기호('>') 사용 금지.
               - 줄바꿈용 특수기호('\\', '|') 사용 금지.
            3. **문단 간격**: 문단 사이에는 빈 줄을 하나 넣어주세요.
            4. 내용 끊김 없이 자연스럽게 이어서 작성하세요.
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

    // [후처리] AI가 남긴 찌꺼기 문자 강제 청소 (RegEx)
    // 1. 홀로 있는 백슬래시(\) 제거
    combinedResult = combinedResult.replace(/^\s*\\\s*$/gm, "");
    // 2. 홀로 있는 파이프(|) 제거
    combinedResult = combinedResult.replace(/^\s*\|\s*$/gm, "");
    // 3. 3줄 이상의 과도한 공백을 2줄로 축소
    combinedResult = combinedResult.replace(/\n{3,}/g, "\n\n");

    return combinedResult;
}