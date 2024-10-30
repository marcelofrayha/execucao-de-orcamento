'use client'

import { TutorialStep } from "./tutorial-step";
import { CodeBlock } from "./code-block";
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js'
import { processExcel } from '@/app/data-formater';
import { processTable } from "@/app/table-formater";
import { useState } from 'react';
import { redirect } from 'next/navigation';

const create = `create table notes (
  id bigserial primary key,
  title text
);

insert into notes(title)
values
  ('Today I created a Supabase project.'),
  ('I added some data and queried it from Next.js.'),
  ('It was awesome!');
`.trim();

const server = `import { createClient } from '@/utils/supabase/server'

export default async function Page() {
  const supabase = createClient()
  const { data: notes } = await supabase.from('notes').select()

  return <pre>{JSON.stringify(notes, null, 2)}</pre>
}
`.trim();

const client = `'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function Page() {
  const [notes, setNotes] = useState<any[] | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase.from('notes').select()
      setNotes(data)
    }
    getData()
  }, [])

  return <pre>{JSON.stringify(notes, null, 2)}</pre>
}
`.trim();

export default function FetchDataSteps({ user_id }: { user_id: string }) {
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [tableType, setTableType] = useState<'Despesas' | 'Receitas'>('Despesas');

  return (
    <ol className="flex flex-col gap-6">
      <TutorialStep title="Dados sobre a despesa ou receita">
        <form onSubmit={(e) => handleSubmit(e, user_id, setPreviewData, tableType)} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-col">
            <label htmlFor="tableType" className="mb-2 text-sm font-medium text-gray-800">Tipo de Tabela:</label>
            <select 
              id="tableType" 
              name="tableType" 
              value={tableType} 
              onChange={(e) => setTableType(e.target.value as 'Despesas' | 'Receitas')}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Despesas">Despesas</option>
              <option value="Receitas">Receitas</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="month" className="mb-2 text-sm font-medium text-gray-800">Mês:</label>
            <input 
              type="number" 
              id="month" 
              name="month" 
              min="1" 
              max="12" 
              required 
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="year" className="mb-2 text-sm font-medium text-gray-800">Ano:</label>
            <input 
              type="number" 
              id="year" 
              name="year" 
              min="1900" 
              max="2100" 
              required 
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="startCol" className="mb-2 text-sm font-medium text-gray-800">Coluna Inicial:</label>
            <input 
              type="text" 
              id="startCol" 
              name="startCol" 
              required 
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="endCol" className="mb-2 text-sm font-medium text-gray-800">Coluna Final:</label>
            <input 
              type="text" 
              id="endCol" 
              name="endCol" 
              required 
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="file" className="mb-2 text-sm font-medium text-gray-800">Upload Arquivo (XLSX ou CSV):</label>
            <input 
              type="file" 
              id="file" 
              name="file" 
              accept=".xlsx, .csv" 
              required 
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button 
            type="submit" 
            className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Pré Visualizar
          </button>
        </form>
        {previewData && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Preview dos dados processados:</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead>
                  <tr>
                    {tableType === 'Despesas' ? (
                      <>
                        <th className="px-4 py-2 border-b">Mês</th>
                        <th className="px-4 py-2 border-b">Ano</th>
                        <th className="px-4 py-2 border-b">Unidade Orçamentária</th>
                        <th className="px-4 py-2 border-b">Fonte de Recurso</th>
                        <th className="px-4 py-2 border-b">Elemento Despesa</th>
                        <th className="px-4 py-2 border-b">Orçado</th>
                        <th className="px-4 py-2 border-b">Saldo</th>
                        <th className="px-4 py-2 border-b">Empenhado</th>
                      </>
                    ) : (
                      <>
                      <th className="px-4 py-2 border-b">Mês</th>
                      <th className="px-4 py-2 border-b">Ano</th>
                        <th className="px-4 py-2 border-b">Descrição</th>
                        <th className="px-4 py-2 border-b">Fonte de Recurso</th>
                        <th className="px-4 py-2 border-b">Orçado</th>
                        <th className="px-4 py-2 border-b">Saldo</th>
                        <th className="px-4 py-2 border-b">Receita</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      {row.map((cell: any, cellIndex: number) => (
                        <td key={cellIndex} className="px-4 py-2 border-b">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-sm text-gray-600">Mostrando os primeiros 5 registros de {previewData.length} total.</p>
            <button 
              onClick={() => uploadDataToSupabase(previewData, user_id, tableType)}
              className="mt-4 px-4 py-2 font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Confirmar e Enviar para Base de Dados
            </button>
          </div>
        )}
      </TutorialStep>

      {/* <TutorialStep title="Query Supabase data from Next.js">
        <p>
          To create a Supabase client and query data from an Async Server
          Component, create a new page.tsx file at{" "}
          <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
            /app/notes/page.tsx
          </span>{" "}
          and add the following.
        </p>
        <CodeBlock code={server} />
        <p>Alternatively, you can use a Client Component.</p>
        <CodeBlock code={client} />
      </TutorialStep>

      <TutorialStep title="Build in a weekend and scale to millions!">
        <p>You're ready to launch your product to the world! 🚀</p>
      </TutorialStep> */}
    </ol>
  );
}

function handleSubmit(event: React.FormEvent<HTMLFormElement>, user_id: string, setPreviewData: (data: any[] | null) => void, tableType: 'Despesas' | 'Receitas') {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const startCol = formData.get('startCol');
  const endCol = formData.get('endCol');
  const file = formData.get('file') as File;

  if (!file) {
    console.error('No file uploaded');
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const ano = formData.get('year');
      const mes = formData.get('month');
      const processedWorkbook = processTable(workbook, Number(mes), Number(ano), Number(startCol), Number(endCol), tableType)
      const processedData = processExcel(processedWorkbook, Number(startCol), Number(endCol));
      const dataToUpload = processedData.slice(1);
      setPreviewData(dataToUpload);
    } catch (error) {
      console.error('Error processing data:', error);
      setPreviewData(null);
    }
  };

  reader.readAsArrayBuffer(file);
}

async function uploadDataToSupabase(data: any[], user_id: string, tableType: 'Despesas' | 'Receitas') {
  if (!sanityCheck(data, tableType)) {
    alert('Erro no sanity check. Por favor, verifique os dados.');
    return;
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });
  
  let formattedData;
  if (tableType === 'Despesas') {
    formattedData = data.map((row: any) => ({
      mes: row[0],
      ano: row[1],
      'unidade_orcamentaria': row[2],
      'fonte_de_recurso': row[3],
      'elemento_despesa': row[4],
      orcado: row[5],
      saldo: row[6],
      empenhado: row[7],
      user_id: user_id
    }));
  } else {
    formattedData = data.map((row: any) => ({
      mes: row[0],
      ano: row[1],
      descricao: row[2],
      'fonte_de_recurso': row[3],
      orcado: row[4],
      saldo: row[5],
      receita: row[6],
      user_id: user_id
    }));
  }
  const { data: { session } } = await supabase.auth.getSession()
  console.log('Current session:', session)

  if (!session) {
    // Get the cookie name dynamically by finding the supabase cookie
    const supabaseCookie = Object.keys(parseCookies()).find(key => 
      key.startsWith('sb-') && key.endsWith('-auth-token')
    );

    if (supabaseCookie) {
      const encodedSession = getCookie(supabaseCookie);
      if (encodedSession) {
        const { access_token, refresh_token } = decodeSession(encodedSession);
        await supabase.auth.setSession({
          access_token,
          refresh_token
        })
        // Buscar a nova sessão após setá-la
        const { data: { session: newSession } } = await supabase.auth.getSession()
        console.log('New session set:', newSession)
      }
    }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('User not authenticated')
    // Redirecionar para login ou mostrar mensagem de erro
    return redirect('/login')
  }

  const { error } = await supabase.from(tableType).insert(formattedData);

  if (error) {
    console.error(`Error uploading data to Supabase ${tableType} table:`, error);
    alert(`Erro ao enviar dados para Supabase ${tableType}. Por favor, tente novamente.`);
  } else {
    console.log('Data uploaded successfully');
    alert(`Dados enviados com sucesso para Supabase ${tableType}!`);
    return redirect(`/protected/dashboard?user_id=${user_id}`)
  }
}

function sanityCheck(data: any[], tableType: 'Despesas' | 'Receitas'): boolean {
  if (data.length === 0) {
    console.error('Erro: Nenhum dado para processar.');
    return false;
  }

  const requiredFields = tableType === 'Despesas' 
    ? ['mes', 'ano', 'unidade_orcamentaria', 'fonte_de_recurso', 'elemento_despesa', 'orcado', 'saldo', 'empenhado']
    : ['descricao', 'fonte_de_recurso', 'orcado', 'saldo', 'receita'];

  const allFieldsPresent = data.every(row => 
    requiredFields.every((field, index) => row[index] !== undefined && row[index] !== null)
  );

  if (!allFieldsPresent) {
    console.error('Erro: Alguns campos obrigatórios estão faltando ou são nulos.');
    return false;
  }

  const numericFields = tableType === 'Despesas' 
    ? [5, 6, 7]  // índices de orcado, saldo, empenhado
    : [2, 3, 4]; // índices de orcado, saldo, receita

  const originalSum = data.reduce((sum, row) => sum + numericFields.reduce((rowSum, index) => rowSum + (Number(row[index]) || 0), 0), 0);
  const processedSum = data.reduce((sum, row) => sum + numericFields.reduce((rowSum, index) => rowSum + (Number(row[index]) || 0), 0), 0);

  const tolerance = 0.01; // 1% de tolerância
  const relativeDifference = Math.abs(originalSum - processedSum) / originalSum;

  if (relativeDifference > tolerance) {
    console.error(`Erro: A soma dos valores processados difere significativamente da original. Diferença relativa: ${(relativeDifference * 100).toFixed(2)}%`);
    return false;
  }

  console.log('Sanity check passou: Todos os dados estão presentes e a soma permanece aproximadamente igual.');
  return true;
}

function getCookie(name: string): string {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() ?? '';
  return '';
}

function decodeSession(encodedSession: string): { access_token: string, refresh_token: string } {
  try {
    const decodedSession = atob(encodedSession.replace('base64-', ''));
    const sessionData = JSON.parse(decodedSession);
    return {
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token
    };
  } catch (error) {
    console.error('Erro ao decodificar a sessão:', error);
    return { access_token: '', refresh_token: '' };
  }
}

// Helper function to parse all cookies
function parseCookies(): { [key: string]: string } {
  return document.cookie.split(';').reduce((cookies, cookie) => {
    const [name, value] = cookie.trim().split('=');
    cookies[name] = value;
    return cookies;
  }, {} as { [key: string]: string });
}
