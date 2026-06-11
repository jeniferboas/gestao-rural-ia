const { GoogleGenAI } = require("@google/genai");

// Inicializa a API passando explicitamente a chave do seu arquivo .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function processarMensagemProdutor(conteudoMensagem) {
  try {
    // Prompt mestre que ensina a IA a se comportar como o gerente da fazenda
    const promptMestre = `
      Você é o assistente de inteligência artificial de um sistema de gestão rural.
      Sua tarefa é analisar a mensagem enviada (que pode ser um texto ou a transcrição de um áudio de voz do produtor) e extrair os dados estruturados estritamente em formato JSON.

      Determine a categoria da mensagem:
      1. Se for uma compra ou venda de insumos, animais ou produtos, a categoria é 'transacao'.
      2. Se for um lembrete, agendamento de atividade ou serviço da fazenda, a categoria é 'tarefa'.
      3. Se não se encaixar em nenhuma das anteriores, a categoria é 'invalido'.

      Regras de resposta em JSON:
      - Para 'transacao': { "categoria": "transacao", "tipo": "compra" ou "venda", "produto": "nome", "quantidade": numero_ou_null, "valor_total": numero_ou_null, "cliente_fornecedor": "nome_ou_null" }
      - Para 'tarefa': { "categoria": "tarefa", "descricao": "resumo da atividade", "data_prevista": "AAAA-MM-DD" (se mencionada, caso contrário calcule com base na data atual se disser 'amanhã') }
      - Para 'invalido': { "categoria": "invalido" }

      Responda APENAS o objeto JSON puro, sem formatações markdown (sem usar \`\`\`json).
    `;

    // Se o conteúdo vindo do server.js for um áudio estruturado, passamos ele no array,
    // junto com o prompt mestre. Caso contrário, passamos o texto puro.
    const partesDaRequisicao = typeof conteudoMensagem === 'object' 
      ? [promptMestre, conteudoMensagem] 
      : [promptMestre, `Mensagem do produtor: "${conteudoMensagem}"`];

    const resposta = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Modelo ultra-rápido multimodal que aceita áudio
      contents: partesDaRequisicao,
    });

    const textoLimpo = resposta.text.trim();
    
    // Transforma a resposta em string para um objeto JavaScript real
    return JSON.parse(textoLimpo);

  } catch (erro) {
    console.error("❌ Erro ao processar no Gemini Service:", erro.message);
    return { categoria: "invalido" };
  }
}

module.exports = { processarMensagemProdutor };