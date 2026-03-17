import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { useAudioPlayer } from 'expo-audio';

export interface Reserva {
  id: string;
  matricula: string;
  inicioTimestamp: number;
  fimTimestamp: number;
}

export interface Recurso {
  id: number;
  tipo: string;
  nome: string;
  minHoras: number;
  maxHoras: number;
  reservas: Reserva[];
}

interface RecursosContextData {
  recursos: Recurso[];
  adicionarRecurso: (recurso: Omit<Recurso, 'id' | 'reservas'>) => void;
  atualizarRecurso: (recurso: Omit<Recurso, 'reservas'>) => void;
  excluirRecurso: (id: number) => void;
  reservarRecurso: (id: number, matricula: string, inicio: number, fim: number) => void;
  notificacao: string | null;
  fecharNotificacao: () => void;
}

const RecursosContext = createContext<RecursosContextData>({} as RecursosContextData);

export const RecursosProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [notificacao, setNotificacao] = useState<string | null>(null);

  const audioPlayer = useAudioPlayer('https://www.myinstants.com/media/sounds/ding-sound-effect.mp3');

  // HEARTBEAT
  useEffect(() => {
    const interval = setInterval(() => {
      const tempoAtual = Date.now();
      let houveAlteracao = false;
      let msgNotificacao = "";

      setRecursos(prevRecursos => {
        const novosRecursos = prevRecursos.map(r => {
          const reservasAtivas = r.reservas.filter(res => {
            if (res.fimTimestamp <= tempoAtual) {
              houveAlteracao = true;
              msgNotificacao = `${r.tipo}, ${r.nome} tempo encerrado.`;
              return false; 
            }
            return true;
          });
          return reservasAtivas.length !== r.reservas.length ? { ...r, reservas: reservasAtivas } : r;
        });

        if (houveAlteracao) {
          if (audioPlayer) {
            audioPlayer.seekTo(0);
            audioPlayer.play();
          }
          setNotificacao(msgNotificacao);
          setTimeout(() => setNotificacao(null), 5000);
          return novosRecursos;
        }
        return prevRecursos;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [audioPlayer]);

  // Envolvendo funções em useCallback para estabilizar a memória
  const adicionarRecurso = useCallback((recurso: Omit<Recurso, 'id' | 'reservas'>) => {
    setRecursos((prev) => [...prev, { ...recurso, id: Date.now(), reservas: [] }]);
  }, []);

  const atualizarRecurso = useCallback((recursoAtualizado: Omit<Recurso, 'reservas'>) => {
    setRecursos((prev) => prev.map(r => r.id === recursoAtualizado.id ? { ...recursoAtualizado, reservas: r.reservas } : r));
  }, []);

  const excluirRecurso = useCallback((id: number) => {
    setRecursos((prev) => prev.filter(r => r.id !== id));
  }, []);

  const reservarRecurso = useCallback((id: number, matricula: string, inicio: number, fim: number) => {
    setRecursos((prev) => prev.map(recurso => {
      if (recurso.id !== id) return recurso;
      const conflito = recurso.reservas.some(res => (inicio <= res.fimTimestamp && fim >= res.inicioTimestamp));
      if (conflito) throw new Error("O horário se choca com uma reserva existente.");
      
      const novaReserva: Reserva = { id: Math.random().toString(36).substring(7), matricula, inicioTimestamp: inicio, fimTimestamp: fim };
      return { ...recurso, reservas: [...recurso.reservas, novaReserva] };
    }));
  }, []);

  const fecharNotificacao = useCallback(() => setNotificacao(null), []);

  // BLINDAGEM SUPREMA: Impede a tela de "piscar" e roubar o teclado
  const contextValue = useMemo(() => ({
    recursos, adicionarRecurso, atualizarRecurso, excluirRecurso, reservarRecurso, notificacao, fecharNotificacao
  }), [recursos, notificacao, adicionarRecurso, atualizarRecurso, excluirRecurso, reservarRecurso, fecharNotificacao]);

  return (
    <RecursosContext.Provider value={contextValue}>
      {children}
    </RecursosContext.Provider>
  );
};

export const useRecursos = () => useContext(RecursosContext);