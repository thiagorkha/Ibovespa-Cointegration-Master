import { GoogleGenAI } from "@google/genai";
import { DetailedAnalysis, ScannedPair, Source } from "../types";

// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
// This is handled by Vite define in vite.config.ts
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelName = "gemini-2.5-flash";

/**
 * Helper to extract JSON from a potentially Markdown-formatted response.
 * Otimizado para lidar com blocos de código e textos mistos.
 */
const extractJSON = (text: string): any => {
  if (!text) return null;
  try {
    // Tenta parse direto primeiro
    return JSON.parse(text);
  } catch (e) {
    // Tenta extrair de blocos de código markdown ```json ... ``` ou ``` ... ```
    const patterns = [
      /```json\s*([\s\S]*?)\s*```/,
      /```\s*([\s\S]*?)\s*```/,
      /^[\s\S]*?(\[\s*\{[\s\S]*\}\s*\])[\s\S]*$/, // Array JSON solto no texto
      /^[\s\S]*?(\{[\s\S]*\})[\s\S]*$/           // Objeto JSON solto no texto
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        try {
          return JSON.parse(match[1]);
        } catch (e2) {
          continue;
        }
      }
    }
    
    console.error("Failed to extract JSON from response:", text.substring(0, 100) + "...");
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
  const stocksContext = stocksList ? `Lista de monitoramento: ${stocksList}` : "Considere as principais ações líquidas do IBOVESPA.";

  const prompt = `
    Data de referência: ${today}.
    
    TAREFA: Identificar oportunidades de Long & Short (Cointegração) no IBOVESPA hoje.
    CONTEXTO: ${stocksContext}
    FONTES OBRIGATÓRIAS: Yahoo Finance, Investing.com.
    
    1. Pesquise as variações de preço DE HOJE para identificar divergências entre pares historicamente correlacionados (ex: ON vs PN, Setoriais).
    2. Com base nos dados REAIS encontrados, selecione 5 a 6 pares promissores.
    3. Para cada par, calcule/estime métricas estatísticas baseadas na volatilidade atual.

    CRITÉRIOS DE FILTRO:
    - O par deve ter divergência de preço relevante HOJE.
    - Z-Score estimado deve estar fora da banda de Bollinger (+-2 desvios).
    - ADF Confidence deve ser alto (>90%).

    OUTPUT ESPERADO:
    Retorne APENAS um JSON Array válido. Sem texto introdutório. Sem markdown.
    
    Exemplo de formato:
    [
      { "assetY": "PETR4", "assetX": "PETR3", "adfConfidence": 98, "currentZScore": -2.4, "halfLife": 6 }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, // Temperatura baixa para respostas mais determinísticas e estruturadas
      }
    });

    const text = response.text;
    const data = extractJSON(text);
    const sources = extractSources(response);

    if (!Array.isArray(data)) {
      throw new Error("Formato de dados inválido recebido do modelo. Tente novamente.");
    }

    return data.map((item: any, index: number) => ({
      ...item,
      id: `pair-${index}-${Date.now()}`,
      sources: sources
    }));

  } catch (error: any) {
    console.error("Scanner error:", error);
    throw new Error("Não foi possível escanear o mercado agora. Verifique sua API Key ou tente novamente em instantes.");
  }
};

/**
 * Generates detailed analysis for a pair.
 */
export const analyzeSpecificPair = async (assetY: string, assetX: string, period: string): Promise<DetailedAnalysis> => {
  const today = new Date().toLocaleDateString('pt-BR');

  const prompt = `
    Analise o par Long ${assetY} x Short ${assetX} com dados de HOJE (${today}).
    
    1. Busque a cotação exata de fechamento (ou última cotação) no Yahoo Finance.
    2. Identifique a tendência de curto prazo de cada ativo.
    3. Gere dados simulados para os gráficos de Resíduos e Beta Rotation que CONVERGEM para a situação real de mercado encontrada agora.
    
    OUTPUT: JSON puro.
    Formato:
    {
      "residuals": [{"date": "d/m", "value": 0.0}], 
      "betaRotation": [{"date": "d/m", "value": 0.0}],
      "halfLife": 10,
      "hurstExponent": 0.4,
      "adfConfidence": 95,
      "currentZScore": 2.1,
      "interpretation": "Texto curto explicando a divergência com base nas notícias/preços de hoje."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      }
    });

    const data = extractJSON(response.text);
    const sources = extractSources(response);

    if (!data || !Array.isArray(data.residuals)) {
      throw new Error("Dados incompletos retornados pelo modelo.");
    }
    
    return {
      pair: `${assetY} x ${assetX}`,
      lastUpdated: new Date().toLocaleTimeString('pt-BR'),
      sources: sources,
      ...data
    };

  } catch (error: any) {
    console.error("Analysis error:", error);
    throw new Error("Falha na análise detalhada. Tente novamente.");
  }
};