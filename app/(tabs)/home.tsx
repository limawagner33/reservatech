import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecursos, Recurso, Reserva } from '../../src/context/RecursosContext';

const formatarDataLocal = (ts: number) => { const d = new Date(ts); return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`; };
const formatarHoraLocal = (ts: number) => { const d = new Date(ts); return `${d.getHours().toString().padStart(2, '0')}h${d.getMinutes().toString().padStart(2, '0')}`; };
const formatarDuracaoVisual = (d: number) => { if (!d) return '0m'; const h = Math.floor(d); const m = Math.round((d - h) * 60); if (h === 0) return `${m}m`; if (m === 0) return `${h}h`; return `${h}h${m}m`; };

const StatusReativo = ({ reserva, recurso, onExpirar }: { reserva: Reserva, recurso: Recurso, onExpirar: () => void }) => {
  const [texto, setTexto] = useState('');
  const [rodando, setRodando] = useState(false);

  useEffect(() => {
    const tick = () => {
      const agora = Date.now();
      if (agora < reserva.inicioTimestamp) {
        setTexto('Aguardando...'); setRodando(false);
      } else if (agora < reserva.fimTimestamp) {
        const diff = reserva.fimTimestamp - agora;
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setTexto(`${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
        setRodando(true);
      } else {
        setTexto('Encerrando...'); setRodando(false);
        onExpirar();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [reserva, onExpirar]);

  return <Text style={rodando ? styles.txtCronometro : styles.txtFuturo}>{texto}</Text>;
};

const gerarDias = () => {
  const dias = []; const hoje = new Date();
  for (let i = 0; i < 15; i++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    dias.push({ data, str: `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}` });
  }
  return dias;
};

// 🚀 ARQUITETURA DE ISOLAMENTO: Este componente blinda o teclado!
const FormularioReserva = ({ recurso, dias, onClose, onSucesso }: { recurso: Recurso, dias: any[], onClose: () => void, onSucesso: () => void }) => {
  const { reservarRecurso } = useRecursos();
  const [matricula, setMatricula] = useState('');
  const [dataIni, setDataIni] = useState(dias[0].data);
  const [dataFim, setDataFim] = useState(dias[0].data);
  const [hIni, setHIni] = useState(''); const [mIni, setMIni] = useState('');
  const [hFim, setHFim] = useState(''); const [mFim, setMFim] = useState('');
  const [aviso, setAviso] = useState(''); const [tipoAviso, setTipoAviso] = useState<'erro' | 'sucesso' | ''>('');

  const processarTempo = (valor: string, max: number, setValor: (v: string) => void) => {
    const numStr = valor.replace(/[^0-9]/g, '');
    if (numStr === '') { setValor(''); return; }
    const num = parseInt(numStr, 10);
    if (num > max) setValor(max.toString().padStart(2, '0')); else setValor(numStr);
  };

  const handleReservar = () => {
    Keyboard.dismiss(); setAviso(''); setTipoAviso('');
    if (matricula.length < 4) { setTipoAviso('erro'); setAviso('Matrícula inválida.'); return; }
    if (!hIni || !mIni || !hFim || !mFim) { setTipoAviso('erro'); setAviso('QA: Preencha o relógio.'); return; }

    const inicio = new Date(dataIni.getFullYear(), dataIni.getMonth(), dataIni.getDate(), parseInt(hIni), parseInt(mIni), 0).getTime();
    const fim = new Date(dataFim.getFullYear(), dataFim.getMonth(), dataFim.getDate(), parseInt(hFim), parseInt(mFim), 0).getTime();

    if (inicio < Date.now()) { setTipoAviso('erro'); setAviso('QA: Horário no passado.'); return; }
    if (fim <= inicio) { setTipoAviso('erro'); setAviso('QA: Término deve ser superior ao início.'); return; }

    const duracaoH = (fim - inicio) / 3600000;
    if (duracaoH < recurso.minHoras || duracaoH > recurso.maxHoras) {
      setTipoAviso('erro'); setAviso(`QA: Permitido ${formatarDuracaoVisual(recurso.minHoras)} a ${formatarDuracaoVisual(recurso.maxHoras)}.`); return;
    }

    try {
      reservarRecurso(recurso.id, matricula, inicio, fim);
      setTipoAviso('sucesso'); setAviso('SUCESSO: Agendado.');
      setTimeout(() => { onSucesso(); }, 1500);
    } catch (e: any) { setTipoAviso('erro'); setAviso(e.message); }
  };

  return (
    <View style={styles.modalOverlayAbsoluto}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{recurso.nome}</Text>
          <TouchableOpacity onPress={onClose} style={styles.btnFecharModal}><Text style={styles.txtFecharModal}>X</Text></TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.labelPainel}>Matrícula de Acesso</Text>
          <TextInput style={styles.inputModal} placeholder="Ex: 1234" placeholderTextColor="#52525B" keyboardType="numeric" value={matricula} onChangeText={setMatricula} maxLength={6} />
          
          <View style={styles.blocoData}>
            <Text style={styles.labelData}>INÍCIO</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollDatas} keyboardShouldPersistTaps="handled">
              {dias.map((d, i) => (<TouchableOpacity key={i} style={[styles.chipData, dataIni.getDate() === d.data.getDate() && styles.chipDataAtivo]} onPress={() => setDataIni(d.data)}><Text style={[styles.txtChipData, dataIni.getDate() === d.data.getDate() && styles.txtChipDataAtivo]}>{d.str}</Text></TouchableOpacity>))}
            </ScrollView>
            <View style={styles.relogioDigitalContainer}>
              <TextInput style={styles.inputRelogio} placeholder="00" placeholderTextColor="#52525B" keyboardType="numeric" maxLength={2} value={hIni} onChangeText={(v) => processarTempo(v, 23, setHIni)} />
              <Text style={styles.separadorRelogio}>:</Text>
              <TextInput style={styles.inputRelogio} placeholder="00" placeholderTextColor="#52525B" keyboardType="numeric" maxLength={2} value={mIni} onChangeText={(v) => processarTempo(v, 59, setMIni)} />
            </View>
          </View>

          <View style={styles.blocoData}>
            <Text style={styles.labelData}>TÉRMINO</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollDatas} keyboardShouldPersistTaps="handled">
              {dias.map((d, i) => (<TouchableOpacity key={i} style={[styles.chipData, dataFim.getDate() === d.data.getDate() && styles.chipDataAtivo]} onPress={() => setDataFim(d.data)}><Text style={[styles.txtChipData, dataFim.getDate() === d.data.getDate() && styles.txtChipDataAtivo]}>{d.str}</Text></TouchableOpacity>))}
            </ScrollView>
            <View style={styles.relogioDigitalContainer}>
              <TextInput style={styles.inputRelogio} placeholder="00" placeholderTextColor="#52525B" keyboardType="numeric" maxLength={2} value={hFim} onChangeText={(v) => processarTempo(v, 23, setHFim)} />
              <Text style={styles.separadorRelogio}>:</Text>
              <TextInput style={styles.inputRelogio} placeholder="00" placeholderTextColor="#52525B" keyboardType="numeric" maxLength={2} value={mFim} onChangeText={(v) => processarTempo(v, 59, setMFim)} />
            </View>
          </View>

          <Text style={styles.infoLimite}>Limites: {formatarDuracaoVisual(recurso.minHoras)} a {formatarDuracaoVisual(recurso.maxHoras)}</Text>
          {aviso ? <View style={[styles.caixaMensagem, tipoAviso === 'erro' ? styles.caixaErro : styles.caixaSucesso]}><Text style={[styles.textoMensagem, tipoAviso === 'erro' ? styles.textoErro : styles.textoSucesso]}>{aviso}</Text></View> : null}
          <TouchableOpacity style={styles.btnConfirmar} onPress={handleReservar}><Text style={styles.txtConfirmar}>Confirmar</Text></TouchableOpacity>
          <View style={{height: 20}} />
        </ScrollView>
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { recursos, notificacao, fecharNotificacao, finalizarReservaAutomatica } = useRecursos();
  
  const [abaAtiva, setAbaAtiva] = useState<'CATALOGO' | 'AGENDADOS'>('CATALOGO');
  const [recursoSelecionado, setRecursoSelecionado] = useState<Recurso | null>(null);
  const dias = gerarDias();

  return (
    <View style={styles.container}>
      {notificacao && (
        <View style={styles.toastContainer}><Text style={styles.toastText}>{notificacao}</Text><TouchableOpacity onPress={fecharNotificacao}><Text style={styles.toastClose}>X</Text></TouchableOpacity></View>
      )}
      <View style={styles.header}>
        <View><Text style={styles.saudacao}>Área do Colaborador</Text><Text style={styles.subSaudacao}>Agendamento de Recursos</Text></View>
        <TouchableOpacity style={styles.btnSair} onPress={() => router.replace('/')}><Text style={styles.txtSair}>Sair</Text></TouchableOpacity>
      </View>
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, abaAtiva === 'CATALOGO' && styles.tabAtiva]} onPress={() => setAbaAtiva('CATALOGO')}><Text style={[styles.tabText, abaAtiva === 'CATALOGO' && styles.tabTextAtivo]}>CATÁLOGO</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tab, abaAtiva === 'AGENDADOS' && styles.tabAtiva]} onPress={() => setAbaAtiva('AGENDADOS')}><Text style={[styles.tabText, abaAtiva === 'AGENDADOS' && styles.tabTextAtivo]}>AGENDADOS</Text></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {abaAtiva === 'CATALOGO' && (
          recursos.length === 0 ? <Text style={styles.textoVazio}>Nenhum recurso cadastrado.</Text> : recursos.map(item => (
            <TouchableOpacity key={item.id} style={styles.cardRecurso} onPress={() => setRecursoSelecionado(item)}>
              <View style={{flex: 1}}><Text style={styles.nomeRecurso}>{item.nome}</Text><Text style={styles.badgeTipo}>{item.tipo}</Text></View>
              <View style={{alignItems: 'flex-end'}}><Text style={styles.txtReservar}>AGENDAR</Text><Text style={styles.infoReservas}>{item.reservas.length} reserva(s)</Text></View>
            </TouchableOpacity>
          ))
        )}
        {abaAtiva === 'AGENDADOS' && (
          recursos.filter(r => r.reservas.length > 0).length === 0 ? <Text style={styles.textoVazio}>Nenhum agendamento ativo.</Text> : recursos.map(item => (
            item.reservas.map(res => (
              <View key={res.id} style={styles.cardOcupado}>
                <View style={styles.rowEntre}>
                  <View><Text style={styles.nomeRecurso}>{item.nome}</Text><Text style={styles.infoOcupado}>Matrícula: {res.matricula}</Text></View>
                  <View style={{alignItems: 'flex-end'}}><Text style={styles.txtEmUso}>STATUS</Text>
                    <StatusReativo reserva={res} recurso={item} onExpirar={() => finalizarReservaAutomatica(item.id, res.id, item.tipo, item.nome)} />
                  </View>
                </View>
                <View style={styles.ticketReserva}>
                  <View style={styles.ticketColuna}><Text style={styles.ticketLabel}>INÍCIO</Text><Text style={styles.ticketData}>{formatarDataLocal(res.inicioTimestamp)}</Text><Text style={styles.ticketHora}>{formatarHoraLocal(res.inicioTimestamp)}</Text></View>
                  <View style={styles.ticketMeio}><Text style={styles.ticketDuracao}>{formatarDuracaoVisual((res.fimTimestamp - res.inicioTimestamp) / 3600000)}</Text><View style={styles.ticketLinha} /></View>
                  <View style={styles.ticketColuna}><Text style={styles.ticketLabel}>TÉRMINO</Text><Text style={styles.ticketData}>{formatarDataLocal(res.fimTimestamp)}</Text><Text style={styles.ticketHora}>{formatarHoraLocal(res.fimTimestamp)}</Text></View>
                </View>
              </View>
            ))
          ))
        )}
      </ScrollView>

      {recursoSelecionado && (
        <FormularioReserva 
          recurso={recursoSelecionado} 
          dias={dias} 
          onClose={() => setRecursoSelecionado(null)} 
          onSucesso={() => { setRecursoSelecionado(null); setAbaAtiva('AGENDADOS'); }} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B', padding: 24 },
  modalOverlayAbsoluto: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.95)', zIndex: 1000, justifyContent: 'center', padding: 20 },
  toastContainer: { position: 'absolute', top: 60, right: 20, backgroundColor: '#18181B', borderColor: '#06B6D4', borderWidth: 1, borderLeftWidth: 4, borderRadius: 8, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5, maxWidth: '80%' },
  toastText: { color: '#FAFAFA', fontSize: 12, fontWeight: 'bold', marginRight: 16 }, toastClose: { color: '#A1A1AA', fontWeight: 'bold', fontSize: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 32 },
  saudacao: { fontSize: 20, fontWeight: 'bold', color: '#FAFAFA', letterSpacing: -0.5 }, subSaudacao: { fontSize: 12, color: '#A1A1AA', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  btnSair: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#27272A' }, txtSair: { color: '#EF4444', fontWeight: '600', textTransform: 'uppercase', fontSize: 12 },
  textoVazio: { color: '#52525B', fontSize: 14, marginTop: 10 },
  cardRecurso: { backgroundColor: '#18181B', padding: 20, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#27272A', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardOcupado: { backgroundColor: '#18181B', padding: 20, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#3F3F46' },
  rowEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  nomeRecurso: { fontSize: 16, color: '#FAFAFA', fontWeight: '600', marginBottom: 4 }, badgeTipo: { color: '#06B6D4', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  txtReservar: { color: '#06B6D4', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', marginBottom: 4 }, infoReservas: { color: '#52525B', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  tabContainer: { flexDirection: 'row', marginBottom: 24, backgroundColor: '#18181B', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 }, tabAtiva: { backgroundColor: '#27272A' }, tabText: { color: '#A1A1AA', fontSize: 12, fontWeight: 'bold' }, tabTextAtivo: { color: '#FAFAFA' },
  infoOcupado: { color: '#A1A1AA', fontSize: 12 },
  ticketReserva: { flexDirection: 'row', backgroundColor: '#09090B', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#27272A', marginTop: 16, alignItems: 'center', justifyContent: 'space-between' },
  ticketColuna: { alignItems: 'center' }, ticketLabel: { color: '#52525B', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }, ticketData: { color: '#FAFAFA', fontSize: 14, fontWeight: 'bold', marginTop: 4 }, ticketHora: { color: '#06B6D4', fontSize: 12, fontWeight: 'bold' },
  ticketMeio: { flex: 1, alignItems: 'center', paddingHorizontal: 16 }, ticketDuracao: { color: '#A1A1AA', fontSize: 10, fontWeight: 'bold', marginBottom: 4 }, ticketLinha: { height: 1, backgroundColor: '#27272A', width: '100%' },
  txtEmUso: { color: '#06B6D4', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 }, txtFuturo: { color: '#A1A1AA', fontSize: 12, fontStyle: 'italic' }, txtCronometro: { color: '#FAFAFA', fontSize: 14, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
  modalContent: { backgroundColor: '#18181B', width: '100%', borderRadius: 32, padding: 32, borderWidth: 1, borderColor: '#27272A', maxHeight: '95%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }, modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FAFAFA' },
  btnFecharModal: { backgroundColor: '#27272A', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }, txtFecharModal: { color: '#A1A1AA', fontWeight: 'bold' },
  labelPainel: { color: '#A1A1AA', marginBottom: 8, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 'bold' },
  inputModal: { backgroundColor: '#09090B', color: '#FAFAFA', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#27272A', marginBottom: 24 },
  blocoData: { backgroundColor: '#09090B', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#27272A', marginBottom: 16 },
  labelData: { color: '#06B6D4', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  scrollDatas: { marginBottom: 12, flexDirection: 'row' },
  chipData: { backgroundColor: '#18181B', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#27272A', marginRight: 8 }, chipDataAtivo: { backgroundColor: '#131316', borderColor: '#06B6D4' },
  txtChipData: { color: '#A1A1AA', fontSize: 14, fontWeight: 'bold' }, txtChipDataAtivo: { color: '#06B6D4' },
  infoLimite: { color: '#52525B', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center', marginBottom: 20 },
  btnConfirmar: { backgroundColor: '#06B6D4', padding: 18, borderRadius: 12, alignItems: 'center' }, txtConfirmar: { color: '#09090B', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  caixaMensagem: { padding: 12, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4 }, caixaErro: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeftColor: '#EF4444' }, caixaSucesso: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderLeftColor: '#10B981' },
  textoMensagem: { fontSize: 14, fontWeight: '600' }, textoErro: { color: '#FCA5A5' }, textoSucesso: { color: '#6EE7B7' },
  relogioDigitalContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#131316', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#27272A', marginTop: 8 },
  inputRelogio: { backgroundColor: '#09090B', color: '#06B6D4', fontSize: 32, fontWeight: 'bold', textAlign: 'center', width: 80, height: 60, borderRadius: 8, borderWidth: 1, borderColor: '#3F3F46' }, separadorRelogio: { color: '#FAFAFA', fontSize: 32, fontWeight: 'bold', marginHorizontal: 16, paddingBottom: 6 },
});