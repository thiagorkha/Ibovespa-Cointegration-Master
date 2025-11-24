import { GoogleGenAI } from "@google/genai";
import { DetailedAnalysis, ScannedPair, Source } from "../types";

// Declare process for TS to avoid "Cannot find name 'process'" error if types are missing
declare var process: {
  env: {
    API_KEY: string;
  };
};

// Initialize Gemini Client
// The API key is obtained exclusively from process.env.API_KEY as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = "gemini-2.5-flash";

/**
 * Helper to extract JSON from a potentially Markdown-formatted response.
 */
const extractJSON = (text: string): any => {
  try {
    // Attempt clean parse
    return JSON.parse(text);
  } catch (e) {
    // Attempt to extract from markdown code blocks or array/object patterns
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                      text.match(/```\s*([\s\S]*?)\s*```/) ||
                      text.match(/\[\s*\{[\s\S]*\}\s*\]/) ||
                      text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (e2) {
        console.error("Failed to parse extracted JSON", e2);
        return null;
      }
    }
    return null;
  }
};

/**
 * Helper to extract sources from grounding metadata.
 */
const extractSources = (response: any): Source[] => {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return chunks
    .filter((c: any) => c.web)
    .map((c: any) => ({ 
      title: c.web.title || "Fonte Web", 
      uri: c.web.uri 
    }));
};

/**
 * Scans the market using Google Search to find real-time cointegration opportunities.
 */
export const scanMarketForPairs = async (period: string, stocksList?: string): Promise<ScannedPair[]> => {
  const today = new Date().toLocaleDateString('pt-BR');
  
  // Use passed stocks list or default to a generic instruction if not provided (though scanner calls it with list usually)
  const stocksContext = stocksList ? `Considere esta lista de ações do IBOVESPA: ${stocksList}` : "Considere as principais ações do IBOVESPA.";

  const prompt = `
    Hoje é ${today}. Você é um sistema especialista em Long & Short.
    
    ${stocksContext}
    
    FASE 1: COLETA DE DADOS (Yahoo Finance & Investing.com)
    Pesquise agora as cotações e variações DE HOJE das ações listadas acima.
    Priorize fontes como **Yahoo Finance** e **Investing.com**.
    Procure por ativos que tiveram movimentos divergentes hoje (um subiu e o outro caiu, ou um subiu muito mais que o par).
    
    FASE 2: ANÁLISE QUANTITATIVA SIMULADA
    Com base nos movimentos REAIS encontrados nessas fontes (Yahoo/Investing), selecione 6 pares que provavelmente estão descorrelacionados neste momento.
    Para cada par, gere métricas estatísticas COERENTES com a intensidade da divergência encontrada.
    
    REGRAS DE SAÍDA:
    - Retorne APENAS um JSON Array puro.
    - O Z-Score (currentZScore) deve ser > 2.0 ou < -2.0 para pares com forte divergência hoje.
    - A confiança ADF (adfConfidence) deve ser alta (>90) para pares historicamente correlacionados (ex: ITUB4/BBDC4, PETR4/PRIO3).
    
    Formato do JSON (exemplo):
    [
      {
        "assetY": "PETR4",
        "assetX": "PRIO3",
        "adfConfidence": 96,
        "currentZScore": 2.35,
        "halfLife": 8
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.4, 
      }
    });

    const text = response.text || "[]";
    const data = extractJSON(text);
    const sources = extractSources(response);

    if (!Array.isArray(data)) {
      console.warn("Invalid data format received from Gemini:", text);
      // Se não for array, pode ser um erro do modelo, vamos lançar para o UI saber
      throw new Error("O modelo não retornou dados estruturados. Tente novamente.");
    }

    return data.map((item: any, index: number) => ({
      ...item,
      id: `pair-${index}-${Date.now()}`,
      sources: sources
    }));

  } catch (error: any) {
    console.error("Error scanning market:", error);
    // Propaga o erro para ser exibido no UI
    throw new Error(error.message || "Erro ao conectar com Gemini API");
  }
};

/**
 * Generates detailed analysis for a pair using Search to get the latest context.
 */
export const analyzeSpecificPair = async (assetY: string, assetX: string, period: string): Promise<DetailedAnalysis> => {
  const today = new Date().toLocaleDateString('pt-BR');

  const prompt = `
    Hoje é ${today}. Analise o par Long ${assetY} x Short ${assetX}.
    
    1. USE O GOOGLE SEARCH para descobrir o preço de fechamento mais recente (hoje ou ontem) destes dois ativos no **Yahoo Finance** ou **Investing.com**.
    2. Verifique se houve notícias relevantes afetando um deles hoje nessas plataformas.
    
    3. GERAÇÃO DE DADOS:
    Com base nos preços REAIS encontrados no Yahoo/Investing, gere uma série temporal simulada de resíduos (Z-Score) e Beta Rotation que leve ao cenário atual.
    Se a fonte diz que ${assetY} subiu e ${assetX} caiu, o gráfico de resíduos deve mostrar um pico recente.
    
    Retorne APENAS um JSON puro (sem markdown) com este formato exato:
    {
      "residuals": [{"date": "DD/MM", "value": 1.2}], // Gere 30 a 50 pontos. O último ponto deve refletir o Z-Score atual.
      "betaRotation": [{"date": "DD/MM", "value": 0.8}], // Gere 30 a 50 pontos.
      "halfLife": 12, // Número inteiro
      "hurstExponent": 0.45, // Float
      "adfConfidence": 98, // Inteiro 0-100
      "currentZScore": 2.3, // Float coerente com o último ponto dos resíduos
      "interpretation": "Explique o motivo do desajuste atual citando os dados encontrados no Yahoo Finance ou Investing.com."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3,
      }
    });

    const text = response.text || "{}";
    const data = extractJSON(text);
    const sources = extractSources(response);

    if (!data || !Array.isArray(data.residuals)) {
      throw new Error("Não foi possível gerar os gráficos. Tente novamente.");
    }
    
    return {
      pair: `${assetY} x ${assetX}`,
      lastUpdated: new Date().toLocaleTimeString(),
      sources: sources,
      ...data
    };

  } catch (error: any) {
    console.error("Error analyzing pair:", error);
    throw new Error(error.message || "Falha ao gerar análise.");
  }
};