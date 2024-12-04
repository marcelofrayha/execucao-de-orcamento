"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function InitializeProfile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user_id = searchParams.get('user_id');

  const [nome, setNome] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [estado, setEstado] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/initialize-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id, nome, municipio, estado })
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/protected');
      } else {
        setError(data.error || 'Erro ao inicializar perfil.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-semibold mb-4">Inicializar Perfil</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4">
        <div>
          <Label htmlFor="nome">Nome</Label>
          <Input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="municipio">Município</Label>
          <Input
            id="municipio"
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="estado">Estado</Label>
          <Input
            id="estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Perfil'}
        </Button>
      </form>
    </div>
  );
} 