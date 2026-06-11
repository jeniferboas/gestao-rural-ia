require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { processarMensagemProdutor } = require('./geminiService');
const axios = require('axios');

const app = express();
app.use(express.json());

// Conexão com o Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Rota do Webhook com suporte a Texto e Áudio
app.post('/webhook', async (req, res) => {
  console.log("\n📦 Dados brutos recebidos da Whapi:", JSON.stringify(req.body, null, 2));

  const mensagens = req.body.messages;

  if (!mensagens || mensagens.length === 0) {
    return res.sendStatus(200);
  }

  const primeiraMensagem = mensagens[0];

  if (primeiraMensagem.from_me) {
    console.log("📱 Ignorando mensagem enviada por mim mesmo.");
    return res.sendStatus(200);
  }

  let textoParaProcessar = "";

  // 🔎 DETECTANDO O TIPO DE MENSAGEM: TEXTO OU ÁUDIO
  if (primeiraMensagem.type === 'text') {
    textoParaProcessar = primeiraMensagem.text?.body || primeiraMensagem.body;
    console.log(`\n💬 Texto recebido com sucesso: "${textoParaProcessar}"`);
  } 
  else if (primeiraMensagem.type === 'voice' || primeiraMensagem.type === 'audio') {
    console.log("🎙️ Áudio detectado! Iniciando processamento do arquivo de voz...");
    
    // Whapi envia uma URL direta ou um link de mídia para download
    const urlAudio = primeiraMensagem.voice?.link || primeiraMensagem.audio?.link || primeiraMensagem.link;
    
    if (!urlAudio) {
      console.log("⚠️ Não foi possível encontrar o link de download do áudio.");
      return res.sendStatus(200);
    }

    try {
      console.log("📥 Baixando arquivo de áudio temporariamente...");
      const respostaAudio = await axios.get(urlAudio, { responseType: 'arraybuffer' });
      const audioBuffer = Buffer.from(respostaAudio.data);

      // Convertendo o buffer para o formato Base64 que a API do Gemini exige
      const audioBase64 = audioBuffer.toString('base64');

      console.log("🤖 Enviando o áudio direto para o Gemini ouvir...");
      // objeto especial que o Gemini aceita nativamente
      const arquivoParaGemini = {
        inlineData: {
          data: audioBase64,
          mimeType: "audio/ogg"
        }
      };

      // Chamando a inteligência passando o áudio em vez do texto!
      const resultadoIA = await processarMensagemProdutor(arquivoParaGemini);
      console.log("🎯 Resultado estruturado pela IA a partir do áudio:", resultadoIA);
      
      // Executa o salvamento no banco
      await salvarNoBanco(resultadoIA);
      return res.sendStatus(200);

    } catch (erro) {
      console.error("❌ Erro ao baixar ou processar o áudio com o Gemini:", erro.message);
      return res.sendStatus(200);
    }
  }

  // Se for texto tradicional, segue o fluxo normal
  if (textoParaProcessar) {
    console.log("🤖 Chamando o Gemini para o texto...");
    const resultadoIA = await processarMensagemProdutor(textoParaProcessar);
    console.log("🎯 Resultado estruturado pela IA:", resultadoIA);
    await salvarNoBanco(resultadoIA);
  }

  return res.sendStatus(200);
});

// Função auxiliar para evitar repetição de código ao salvar no Supabase
async function salvarNoBanco(resultadoIA) {
  if (resultadoIA.categoria === 'transacao') {
    const { error } = await supabase.from('transacoes').insert([{
      tipo: resultadoIA.tipo,
      produto: resultadoIA.produto,
      quantidade: resultadoIA.quantidade,
      valor_total: resultadoIA.valor_total,
      cliente_fornecedor: resultadoIA.cliente_fornecedor
    }]);
    if (error) console.error("Erro no Supabase:", error);
    else console.log("💾 Transação salva no Supabase com sucesso!");
  }

  if (resultadoIA.categoria === 'tarefa') {
    const { error } = await supabase.from('tarefas').insert([{
      descricao: resultadoIA.descricao,
      data_prevista: resultadoIA.data_prevista
    }]);
    if (error) console.error("Erro no Supabase:", error);
    else console.log("💾 Tarefa agendada no Supabase com sucesso!");
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando com sucesso na porta ${PORT}`);
});