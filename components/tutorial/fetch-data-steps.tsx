'use client'

import { TutorialStep } from "./tutorial-step";
import { CodeBlock } from "./code-block";
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js'
import { processExcel } from '@/app/data-formater';
import { processTable } from "@/app/table-formater";
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

export default function FetchDataSteps() {
  return (
    <ol className="flex flex-col gap-6">
      <TutorialStep title="Dados sobre a despesa">
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
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
            Upload
          </button>
        </form>
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

function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const month = formData.get('month');
  const year = formData.get('year');
  const startCol = formData.get('startCol');
  const endCol = formData.get('endCol');
  const file = formData.get('file') as File;

  if (!file) {
    console.error('No file uploaded');
    return;
  }

  async function uploadDataToSupabase(data: any) {
    // Upload the formatted data to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const user = await supabase.auth.getUser();
    
    console.log("here", user);
    const { error } = await supabase.from('ibiraci.Despesas').insert(data.map((row: any) => ({
      mes: row[0],
      ano: row[1],
      'unidade_orcamentaria': row[2],
      'fonte_de_recurso': row[3],
      'elemento_despesa': row[4],
      orcado: row[5],
      saldo: row[6],
      empenhado: row[7],
      user_id: "833b515f-e2dd-495b-8901-fa15fc90b5ed"
  })));;

    if (error) {
      console.error('Error uploading data to Supabase:', error);
    } else {
      console.log('Data uploaded successfully');
    }
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const ano = formData.get('year');
      const mes = formData.get('month');
      const processedWorkbook = processTable(workbook, Number(mes), Number(ano), Number(startCol), Number(endCol))
      // Process the workbook and get the data
      const processedData = processExcel(processedWorkbook, Number(startCol), Number(endCol));
      console.log("processedData", processedData);
      const dataToUpload = processedData.slice(1);
      // Upload data to Supabase
      const response = await uploadDataToSupabase(dataToUpload);

      return response;
    } catch (error) {
      console.error('Error uploading data to Supabase:', error);
    }
  };

  reader.readAsArrayBuffer(file);
}
