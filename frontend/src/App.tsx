import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [transacoes, setTransacoes] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function buscarDados() {
      // 1. Busca as transações
      const resTransacoes = await supabase
        .from('transacoes')
        .select('*')
        .order('id', { ascending: false });

      // 2. Busca as tarefas
      const resTarefas = await supabase
        .from('tarefas')
        .select('*')
        .order('id', { ascending: false });

      if (!resTransacoes.error && resTransacoes.data) {
        setTransacoes(resTransacoes.data);
      }
      
      if (!resTarefas.error && resTarefas.data) {
        setTarefas(resTarefas.data);
      }

      setLoading(false);
    }
    buscarDados();
  }, []);

  // Calcula o faturamento total somando apenas as vendas
  const faturamentoTotal = transacoes
    .filter(t => t.tipo === 'venda')
    .reduce((soma, t) => soma + (t.valor_total || 0), 0);

  // Formata a data para ficar bonita na tela (DD/MM/AAAA)
  const formatarData = (dataString) => {
    if (!dataString) return 'Não definida';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      {/* Cabeçalho */}
      <header className="mb-8 flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestão Rural IA 🌾</h1>
          <p className="text-gray-500">Dashboard Operacional e Financeiro</p>
        </div>
        <div className="flex items-center space-x-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></span>
          <span>WhatsApp Conectado</span>
        </div>
      </header>

      {/* Seção de Resumos / Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Faturamento Total</p>
          <h3 className="mt-2 text-3xl font-bold text-green-600">
            R$ {faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Operações Registradas</p>
          <h3 className="mt-2 text-3xl font-bold text-gray-700">{transacoes.length}</h3>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Tarefas Agendadas</p>
          <h3 className="mt-2 text-3xl font-bold text-orange-600">{tarefas.length}</h3>
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-center text-gray-500">Carregando dados do Supabase...</div>
      ) : (
        /* Grid de duas colunas para as Tabelas */
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Coluna 1 e 2: Tabela de Transações (Ocupa 2/3 da largura em telas grandes) */}
          <div className="lg:col-span-2 overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-700">Últimas movimentações financeiras</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                    <th className="px-6 py-3">Tipo</th>
                    <th className="px-6 py-3">Produto</th>
                    <th className="px-6 py-3">Qtd</th>
                    <th className="px-6 py-3">Valor Total</th>
                    <th className="px-6 py-3">Parceiro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
                  {transacoes.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                          t.tipo === 'venda' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {t.tipo ? t.tipo.toUpperCase() : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{t.produto}</td>
                      <td className="px-6 py-4">{t.quantidade || '-'}</td>
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        R$ {t.valor_total ? t.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{t.cliente_fornecedor || '-'}</td>
                    </tr>
                  ))}
                  {transacoes.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-400">Nenhuma transação financeira.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Coluna 3: Quadro de Tarefas (Ocupa 1/3 da largura) */}
          <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-700">Agenda da Fazenda 📅</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {tarefas.map((tarefa) => (
                  <div key={tarefa.id} className="flex flex-col rounded-lg border border-l-4 border-gray-100 border-l-orange-500 bg-gray-50 p-4 transition-all hover:shadow-md">
                    <p className="font-medium text-gray-800">{tarefa.descricao}</p>
                    <div className="mt-2 flex items-center text-xs font-semibold text-gray-400">
                      <span className="mr-1">📅 Previsão:</span>
                      <span className="text-orange-600">{formatarData(tarefa.data_prevista)}</span>
                    </div>
                  </div>
                ))}
                {tarefas.length === 0 && (
                  <div className="py-8 text-center text-gray-400 text-sm">
                    Nenhum agendamento pendente na fazenda.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}