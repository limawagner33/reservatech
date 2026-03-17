import React, { createContext, useState, useContext, useCallback } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

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
  finalizarReservaAutomatica: (recursoId: number, reservaId: string, tipo: string, nome: string) => void;
}

const RecursosContext = createContext<RecursosContextData>({} as RecursosContextData);

export const RecursosProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [notificacao, setNotificacao] = useState<string | null>(null);

  // Áudio Híbrido: API Nativa no Web (sem warnings) e expo-av no Mobile
  const tocarAlerta = async () => {
    if (Platform.OS === 'web') {
      try {
        const audio = new window.Audio('https://www.myinstants.com/media/sounds/ding-sound-effect.mp3');
        audio.play();
      } catch (e) { console.log('Áudio web bloqueado pelo navegador.'); }
    } else {
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: 'https://www.myinstants.com/media/sounds/ding-sound-effect.mp3' });
        await sound.playAsync();
      } catch (e) { console.log('Erro no áudio mobile.', e); }
    }
  };

  // Esta função é chamada pelo cronômetro da tela quando ele zera
  const finalizarReservaAutomatica = useCallback((recursoId: number, reservaId: string, tipo: string, nome: string) => {
    setRecursos(prev => prev.map(r => {
      if (r.id !== recursoId) return r;
      return { ...r, reservas: r.reservas.filter(res => res.id !== reservaId) };
    }));
    tocarAlerta();
    setNotificacao(`${tipo}, ${nome} tempo encerrado.`);
    setTimeout(() => setNotificacao(null), 6000);
  }, []);

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

      const conflito = recurso.reservas.some(res => (inicio < res.fimTimestamp && fim > res.inicioTimestamp));
      if (conflito) throw new Error("O horário se choca com uma reserva existente.");

      const novaReserva: Reserva = { id: Math.random().toString(36).substring(7), matricula, inicioTimestamp: inicio, fimTimestamp: fim };
      return { ...recurso, reservas: [...recurso.reservas, novaReserva] };
    }));
  }, []);

  const fecharNotificacao = useCallback(() => setNotificacao(null), []);

  return (
    <RecursosContext.Provider value={{ recursos, adicionarRecurso, atualizarRecurso, excluirRecurso, reservarRecurso, notificacao, fecharNotificacao, finalizarReservaAutomatica }}>
      {children}
    </RecursosContext.Provider>
  );
};

export const useRecursos = () => useContext(RecursosContext);