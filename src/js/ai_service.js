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
        "gemini-2.0-flash",
        "gemini-2.0-flash-001",
        "gemini-2.5-flash" 
    ];

    for (let i = 0; i < totalChunks; i++) {
        const chunk = chunks[i];
        const isFirstChunk = (i === 0);
        
        if (onProgress) {
            const percent = Math.round(((i + 1) / totalChunks) * 100);
            onProgress(`AI 변환 중... (${i + 1}/${totalChunks} 구역, ${percent}%)`);
        }

        // [핵심 로직] 첫 번째 조각과 나머지 조각의 규칙을 다르게 설정
        let headerRule = "";
        if (isFirstChunk) {
            headerRule = `6. **제목/서지정보:** 텍스트 시작 부분에 책 제목, 저자, 챕터명이 있다면 # (H1) 또는 ### (H3) 헤더로 예쁘게 포맷팅하세요.`;
        } else {
            headerRule = `6. **제목 반복 금지:** 이 텍스트는 소설의 중간 부분입니다. **책 제목, 저자, 출판사 정보를 절대 다시 출력하지 마세요.** 문맥을 이어받아 바로 소설 내용부터 시작하세요.`;
        }

        // [수정 완료] systemPrompt를 if문 밖으로 꺼내서 정상 작동하게 함
        const systemPrompt = `
        당신은 소설 텍스트 교정 및 포맷팅 전문가입니다.
        사용자가 입력한 텍스트를 읽기 편한 **마크다운(Markdown) 소설 형식**으로 변환하세요.

        [🚨 필수 절대 규칙 🚨]
        1. **인용문(>) 사용 금지:** 본문에 절대 '>' 기호를 붙이지 마세요. 그냥 평문으로 작성하세요.
        2. **줄바꿈 정리(Line Joining):** 문장 중간에 강제로 끊긴 줄바꿈을 모두 제거하고, 하나의 긴 문단으로 이어 붙이세요. (가장 중요)
        3. **문단 간격:** 문단과 문단 사이에는 **빈 줄을 하나만** 넣어서 구분하세요.
        4. **대화문:** 대화문("...")은 줄을 바꿔서 표현하되, 인용문 기호 없이 작성하세요.
        5. **내용 유지:** 원문의 내용은 조사 하나도 빠뜨리지 말고 그대로 유지하세요. (요약 금지)
        ${headerRule}
        `;

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

    // 후처리: 과도한 공백 제거
    combinedResult = combinedResult.replace(/\n{3,}/g, "\n\n");

    return combinedResult;
}