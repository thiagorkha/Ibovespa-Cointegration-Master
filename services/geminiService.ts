import { GoogleGenAI, Type } from "@google/genai";
import { DetailedAnalysis, ScannedPair } from "../types";

// Initialize Gemini Client
// Note: We use process.env.API_KEY as strictly required by the instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = "gemini-2.5-flash";

/**
 * Simulates scanning the market for cointegrated pairs.
 * Since we don't have a real-time financial backend, we ask Gemini to identify
 * potential pairs based on its internal knowledge of historical correlations
 * and generate synthetic current stats that fit the user's criteria (ADF > 95%, Z > 2).
 */
export const scanMarketForPairs = async (period: string): Promise<ScannedPair[]> => {
  const prompt = `
    Atue como um analista quantitativo sênior especializado no mercado brasileiro (B3).
    Gere uma lista de 6 a 8 pares de ações do IBOVESPA que historicamente apresentam alta probabilidade de cointegração.
    
    Para este cenário simulado, assuma que estamos analisando o período de "${period}".
    Filtre APENAS pares que satisfaçam estas condições ESTRITAS agora:
    1. Teste ADF (Augmented Dickey-Fuller) com confiança > 95%.
    2. O Z-Score atual dos resíduos deve estar fora da banda de bollinger normal, ou seja, > 2.0 ou < -2.0 (indicando oportunidade de entrada).
    
    Retorne apenas JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              assetY: { type: Type.STRING, description: "Ativo Dependente (ex: PETR4)" },
              assetX: { type: Type.STRING, description: "Ativo Independente (ex: VALE3)" },
              adfConfidence: { type: Type.NUMBER, description: "Confiança do ADF em % (deve ser > 95)" },
              currentZScore: { type: Type.NUMBER, description: "Valor atual do Z-Score dos resíduos" },
              halfLife: { type: Type.NUMBER, description: "Meia-vida estimada em dias" },
            },
            required: ["assetY", "assetX", "adfConfidence", "currentZScore", "halfLife"]
          }
        }
      }
    });

    const data = JSON.parse(response.text || "[]");
    return data.map((item: any, index: number) => ({
      ...item,
      id: `pair-${index}-${Date.now()}`
    }));

  } catch (error) {
    console.error("Error scanning market:", error);
    // Return empty array on error to prevent app crash
    return [];
  }
};

/**
 * Generates detailed analysis data (charts) for a specific pair.
 * Simulates time-series data for residuals and beta based on the pair's characteristics.
 */
export const analyzeSpecificPair = async (assetY: string, assetX: string, period: string): Promise<DetailedAnalysis> => {
  const prompt = `
    Gere uma análise de cointegração detalhada para o par Long ${assetY} x Short ${assetX} no período de ${period}.
    
    Eu preciso de dados simulados realistas para plotar gráficos.
    1. Gere 50 pontos de dados representando os últimos dias úteis para a série de "Resíduos" (Z-Score).
    2. Gere 50 pontos de dados para a "Rotação do Beta" (evolução do coeficiente beta).
    3. Calcule métricas estatísticas coerentes com os gráficos gerados.
    
    O Z-Score deve mostrar um comportamento de reversão à média (Mean Reversion), mas atualmente deve estar esticado (acima de 2 ou abaixo de -2).
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            residuals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING, description: "Data DD/MM" },
                  value: { type: Type.NUMBER, description: "Valor do Z-Score" }
                }
              }
            },
            betaRotation: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  value: { type: Type.NUMBER, description: "Valor do Beta" }
                }
              }
            },
            halfLife: { type: Type.NUMBER },
            hurstExponent: { type: Type.NUMBER },
            adfConfidence: { type: Type.NUMBER },
            currentZScore: { type: Type.NUMBER },
            interpretation: { type: Type.STRING, description: "Breve análise do trade em português" }
          },
          required: ["residuals", "betaRotation", "halfLife", "hurstExponent", "adfConfidence", "currentZScore", "interpretation"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    return {
      pair: `${assetY} x ${assetX}`,
      lastUpdated: new Date().toLocaleTimeString(),
      ...data
    };

  } catch (error) {
    console.error("Error analyzing pair:", error);
    throw new Error("Falha ao gerar análise.");
  }
};
