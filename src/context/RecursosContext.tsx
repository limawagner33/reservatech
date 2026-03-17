import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
// 1. Nova biblioteca oficial da Expo para Áudio (Livre de Warnings)
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

  // 2. Instanciando o Player em memória (Muito mais rápido e robusto)
  const audioPlayer = useAudioPlayer('https://www.myinstants.com/media/sounds/ding-sound-effect.mp3');

  function tocarAlerta() {
    try {
      if (audioPlayer) {
        audioPlayer.seekTo(0); // Garante que o som sempre toca do início
        audioPlayer.play();
      }
    } catch (error) {
      console.log('QA: Som não suportado no emulador sem foco.', error);
    }
  }

  const fecharNotificacao = () => setNotificacao(null);

  // HEARTBEAT CORPORATIVO COM NOTIFICAÇÃO IN-APP
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
              // String exata exigida pela regra de negócio
              msgNotificacao = `${r.tipo}, ${r.nome} tempo encerrado.`;
              return false; 
            }
            return true;
          });
          return reservasAtivas.length !== r.reservas.length ? { ...r, reservas: reservasAtivas } : r;
        });

        if (houveAlteracao) {
          tocarAlerta();
          setNotificacao(msgNotificacao);
          // Fecha o pop-up corporativo automaticamente após 5 segundos
          setTimeout(() => setNotificacao(null), 5000);
          return novosRecursos;
        }
        return prevRecursos;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [audioPlayer]); // O hook do áudio garante a reatividade

  const adicionarRecurso = (recurso: Omit<Recurso, 'id' | 'reservas'>) => {
    setRecursos((prev) => [...prev, { ...recurso, id: Date.now(), reservas: [] }]);
  };

  const atualizarRecurso = (recursoAtualizado: Omit<Recurso, 'reservas'>) => {
    setRecursos((prev) => prev.map(r => r.id === recursoAtualizado.id ? { ...recursoAtualizado, reservas: r.reservas } : r));
  };

  const excluirRecurso = (id: number) => {
    setRecursos((prev) => prev.filter(r => r.id !== id));
  };

  const reservarRecurso = useCallback((id: number, matricula: string, inicio: number, fim: number) => {
    // 1. Trazemos a validação para FORA do setRecursos!
    const recursoAlvo = recursos.find(r => r.id === id);
    if (recursoAlvo) {
      const conflito = recursoAlvo.reservas.some(res => (inicio <= res.fimTimestamp && fim >= res.inicioTimestamp));
      if (conflito) {
        // Agora o throw new Error é disparado no lugar certo, e o try/catch vai pegar!
        throw new Error("QA Block: O horário se choca com uma reserva existente.");
      }
    }

    // 2. Se passar na validação, aí sim atualizamos o estado do React
    setRecursos((prev) => prev.map(recurso => {
      if (recurso.id !== id) return recurso;
      
      const novaReserva: Reserva = { id: Math.random().toString(36).substring(7), matricula, inicioTimestamp: inicio, fimTimestamp: fim };
      return { ...recurso, reservas: [...recurso.reservas, novaReserva] };
    }));
  }, [recursos]); // <-- E adiciona 'recursos' aqui na dependência para ele ler os dados atuais.

  return (
    <RecursosContext.Provider value={{ recursos, adicionarRecurso, atualizarRecurso, excluirRecurso, reservarRecurso, notificacao, fecharNotificacao }}>
      {children}
    </RecursosContext.Provider>
  );
};

export const useRecursos = () => useContext(RecursosContext);