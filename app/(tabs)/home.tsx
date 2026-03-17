import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Keyboard, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecursos, Recurso } from '../../src/context/RecursosContext';

const formatarDataLocal = (timestamp: number) => {
  const data = new Date(timestamp);
  return `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}`;
};

const formatarHoraLocal = (timestamp: number) => {
  const data = new Date(timestamp);
  return `${data.getHours().toString().padStart(2, '0')}h${data.getMinutes().toString().padStart(2, '0')}`;
};

const formatarDuracaoVisual = (decimal: number) => {
  if (!decimal) return '0m';
  const h = Math.floor(decimal);
  const m = Math.round((decimal - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}m`;
};

// COMPONENTE TOTALMENTE ISOLADO
const StatusReativo = ({ inicio, fim }: { inicio: number, fim: number }) => {
  const [statusTexto, setStatusTexto] = useState('');
  const [isRodando, setIsRodando] = useState(false);

  useEffect(() => {
    const atualizarStatus = () => {
      const agora = Date.now();
      if (agora < inicio) {
        setStatusTexto('Aguardando...');
        setIsRodando(false);
      } else if (agora < fim) {
        const diferenca = fim - agora;
        const h = Math.floor(diferenca / (1000 * 60 * 60));
        const m = Math.floor((diferenca / (1000 * 60)) % 60);
        const s = Math.floor((diferenca / 1000) % 60);
        setStatusTexto(`${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
        setIsRodando(true);
      } else {
        setStatusTexto('Liberando...');
        setIsRodando(false);
      }
    };

    atualizarStatus(); 
    const intervalo = setInterval(atualizarStatus, 1000); 
    return () => clearInterval(intervalo);
  }, [inicio, fim]);

  return (
    <Text style={isRodando ? styles.txtCronometro : styles.txtFuturo}>{statusTexto}</Text>
  );
};

const gerarProximosDias = () => {
  const dias = [];
  const hoje = new Date();
  for (let i = 0; i < 15; i++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    dias.push({ dataCompleta: data, diaMes: `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}` });
  }
  return dias;
};

export default function HomeScreen() {
  const router = useRouter();
  const { recursos, reservarRecurso, notificacao, fecharNotificacao } = useRecursos();
  
  const [abaAtiva, setAbaAtiva] = useState<'CATALOGO' | 'AGENDADOS'>('CATALOGO');
  const [recursoSelecionado, setRecursoSelecionado] = useState<Recurso | null>(null);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [matricula, setMatricula] = useState('');
  
  const diasDisponiveis = gerarProximosDias();
  const [dataInicioSelecionada, setDataInicioSelecionada] = useState(diasDisponiveis[0].dataCompleta);
  const [dataFimSelecionada, setDataFimSelecionada] = useState(diasDisponiveis[0].dataCompleta);
  
  const [hIni, setHIni] = useState('');
  const [mIni, setMIni] = useState('');
  const [hFim, setHFim] = useState('');
  const [mFim, setMFim] = useState('');

  const [aviso, setAviso] = useState('');
  const [tipoAviso, setTipoAviso] = useState<'erro' | 'sucesso' | ''>('');

  const abrirMinitela = (item: Recurso) => {
    setRecursoSelecionado(item);
    setMatricula(''); setAviso(''); setTipoAviso('');
    setDataInicioSelecionada(diasDisponiveis[0].dataCompleta);
    setDataFimSelecionada(diasDisponiveis[0].dataCompleta);
    setHIni(''); setMIni(''); setHFim(''); setMFim('');
    setModalVisivel(true);
  };

  // Validadores mais gentis para o Web (Não travam o React)
  const lidarComH = (text: string, setFn: (v: string) => void) => {
    let num = text.replace(/[^0-9]/g, '');
    if (num !== '' && parseInt(num) > 23) num = '23';
    setFn(num);
  };

  const lidarComM = (text: string, setFn: (v: string) => void) => {
    let num = text.replace(/[^0-9]/g, '');
    if (num !== '' && parseInt(num) > 59) num = '59';
    setFn(num);
  };

  const handleReservar = () => {
    Keyboard.dismiss();
    setAviso(''); setTipoAviso('');

    if (!recursoSelecionado) return;
    if (!matricula.trim() || matricula.length < 4) {
      setTipoAviso('erro'); setAviso('Matrícula inválida. Mínimo 4 dígitos.'); return;
    }
    if (!hIni || !mIni || !hFim || !mFim) {
      setTipoAviso('erro'); setAviso('Preencha todas as horas e minutos.'); return;
    }

    const inicioTimestamp = new Date(dataInicioSelecionada.getFullYear(), dataInicioSelecionada.getMonth(), dataInicioSelecionada.getDate(), parseInt(hIni), parseInt(mIni), 0).getTime();
    const fimTimestamp = new Date(dataFimSelecionada.getFullYear(), dataFimSelecionada.getMonth(), dataFimSelecionada.getDate(), parseInt(hFim), parseInt(mFim), 0).getTime();
    const agora = Date.now();

    if (inicioTimestamp < agora) {
      setTipoAviso('erro'); setAviso('Não é possível agendar no passado.'); return;
    }
    if (fimTimestamp <= inicioTimestamp) {
      setTipoAviso('erro'); setAviso('O término deve ser posterior ao início.'); return;
    }

    const duracaoH = (fimTimestamp - inicioTimestamp) / (1000 * 60 * 60);
    if (duracaoH < recursoSelecionado.minHoras || duracaoH > recursoSelecionado.maxHoras) {
      setTipoAviso('erro'); 
      setAviso(`Limite exigido: ${formatarDuracaoVisual(recursoSelecionado.minHoras)} a ${formatarDuracaoVisual(recursoSelecionado.maxHoras)}.`);
      return;
    }

    try {
      reservarRecurso(recursoSelecionado.id, matricula, inicioTimestamp, fimTimestamp);
      setTipoAviso('sucesso');
      setAviso('SUCESSO: Recurso agendado com sucesso.');
      setTimeout(() => { setModalVisivel(false); setAbaAtiva('AGENDADOS'); }, 1500);
    } catch (error: any) {
      setTipoAviso('erro');
      setAviso(error.message);
    }
  };

  return (
    <View style={styles.container}>
      
      {notificacao && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{notificacao}</Text>
          <TouchableOpacity onPress={fecharNotificacao}>
            <Text style={styles.toastClose}>X</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.header}>
        <View>
          <Text style={styles.saudacao}>Área do Colaborador</Text>
          <Text style={styles.subSaudacao}>Agendamento de Recursos</Text>
        </View>
        <TouchableOpacity style={styles.btnSair} onPress={() => router.replace('/')}>
          <Text style={styles.txtSair}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, abaAtiva === 'CATALOGO' && styles.tabAtiva]} onPress={() => setAbaAtiva('CATALOGO')}>
          <Text style={[styles.tabText, abaAtiva === 'CATALOGO' && styles.tabTextAtivo]}>CATÁLOGO</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, abaAtiva === 'AGENDADOS' && styles.tabAtiva]} onPress={() => setAbaAtiva('AGENDADOS')}>
          <Text style={[styles.tabText, abaAtiva === 'AGENDADOS' && styles.tabTextAtivo]}>AGENDADOS</Text>
        </TouchableOpacity>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {abaAtiva === 'CATALOGO' && (
          recursos.length === 0 ? <Text style={styles.textoVazio}>Nenhum recurso cadastrado.</Text> : (
            recursos.map((item) => (
              <TouchableOpacity key={item.id} style={styles.cardRecurso} onPress={() => abrirMinitela(item)} activeOpacity={0.7}>
                <View style={{flex: 1}}>
                  <Text style={styles.nomeRecurso}>{item.nome}</Text>
                  <Text style={styles.badgeTipo}>{item.tipo}</Text>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                  <Text style={styles.txtReservar}>AGENDAR</Text>
                  <Text style={styles.infoReservas}>{item.reservas.length} reserva(s) futura(s)</Text>
                </View>
              </TouchableOpacity>
            ))
          )
        )}

        {abaAtiva === 'AGENDADOS' && (
          recursos.filter(r => r.reservas.length > 0).length === 0 ? <Text style={styles.textoVazio}>Nenhum agendamento ativo no sistema.</Text> : (
            recursos.map((item) => (
              item.reservas.map(reserva => (
                <View key={reserva.id} style={[styles.cardRecurso, styles.cardOcupado]}>
                  <View style={styles.rowEntre}>
                    <View>
                      <Text style={styles.nomeRecurso}>{item.nome}</Text>
                      <Text style={styles.infoOcupado}>Matrícula: {reserva.matricula}</Text>
                    </View>
                    <View style={{alignItems: 'flex-end'}}>
                      <Text style={styles.txtEmUso}>STATUS</Text>
                      <StatusReativo inicio={reserva.inicioTimestamp} fim={reserva.fimTimestamp} />
                    </View>
                  </View>
                  <View style={styles.ticketReserva}>
                    <View style={styles.ticketColuna}>
                      <Text style={styles.ticketLabel}>INÍCIO</Text>
                      <Text style={styles.ticketData}>{formatarDataLocal(reserva.inicioTimestamp)}</Text>
                      <Text style={styles.ticketHora}>{formatarHoraLocal(reserva.inicioTimestamp)}</Text>
                    </View>
                    <View style={styles.ticketMeio}>
                      <Text style={styles.ticketDuracao}>{formatarDuracaoVisual((reserva.fimTimestamp - reserva.inicioTimestamp) / 3600000)}</Text>
                      <View style={styles.ticketLinha} />
                    </View>
                    <View style={styles.ticketColuna}>
                      <Text style={styles.ticketLabel}>TÉRMINO</Text>
                      <Text style={styles.ticketData}>{formatarDataLocal(reserva.fimTimestamp)}</Text>
                      <Text style={styles.ticketHora}>{formatarHoraLocal(reserva.fimTimestamp)}</Text>
                    </View>
                  </View>
                </View>
              ))
            ))
          )
        )}
      </ScrollView>

      <Modal animationType="slide" transparent={true} visible={modalVisivel} onRequestClose={() => setModalVisivel(false)}>
        {/* Usando View ao invés de KeyboardAvoidingView para evitar bugs agressivos no Web */}
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{recursoSelecionado?.nome}</Text>
              <TouchableOpacity onPress={() => setModalVisivel(false)} style={styles.btnFecharModal}><Text style={styles.txtFecharModal}>X</Text></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.labelPainel}>Matrícula de Acesso</Text>
              <TextInput style={styles.inputModal} placeholder="Ex: 1234" placeholderTextColor="#52525B" keyboardType="numeric" value={matricula} onChangeText={(text) => { setMatricula(text); setAviso(''); }} maxLength={6} />

              <View style={styles.blocoData}>
                <Text style={styles.labelData}>INÍCIO DA RESERVA</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollDatas} keyboardShouldPersistTaps="handled">
                  {diasDisponiveis.map((dia, index) => (
                    <TouchableOpacity key={`d-ini-${index}`} style={[styles.chipData, dataInicioSelecionada.getDate() === dia.dataCompleta.getDate() && styles.chipDataAtivo]} onPress={() => setDataInicioSelecionada(dia.dataCompleta)}>
                      <Text style={[styles.txtChipData, dataInicioSelecionada.getDate() === dia.dataCompleta.getDate() && styles.txtChipDataAtivo]}>{dia.diaMes}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.relogioDigitalContainer}>
                  <TextInput style={styles.inputRelogio} placeholder="00" placeholderTextColor="#52525B" keyboardType="numeric" maxLength={2} value={hIni} onChangeText={(v) => lidarComH(v, setHIni)} />
                  <Text style={styles.separadorRelogio}>:</Text>
                  <TextInput style={styles.inputRelogio} placeholder="00" placeholderTextColor="#52525B" keyboardType="numeric" maxLength={2} value={mIni} onChangeText={(v) => lidarComM(v, setMIni)} />
                </View>
              </View>

              <View style={styles.blocoData}>
                <Text style={styles.labelData}>TÉRMINO DA RESERVA</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollDatas} keyboardShouldPersistTaps="handled">
                  {diasDisponiveis.map((dia, index) => (
                    <TouchableOpacity key={`d-fim-${index}`} style={[styles.chipData, dataFimSelecionada.getDate() === dia.dataCompleta.getDate() && styles.chipDataAtivo]} onPress={() => setDataFimSelecionada(dia.dataCompleta)}>
                      <Text style={[styles.txtChipData, dataFimSelecionada.getDate() === dia.dataCompleta.getDate() && styles.txtChipDataAtivo]}>{dia.diaMes}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.relogioDigitalContainer}>
                  <TextInput style={styles.inputRelogio} placeholder="00" placeholderTextColor="#52525B" keyboardType="numeric" maxLength={2} value={hFim} onChangeText={(v) => lidarComH(v, setHFim)} />
                  <Text style={styles.separadorRelogio}>:</Text>
                  <TextInput style={styles.inputRelogio} placeholder="00" placeholderTextColor="#52525B" keyboardType="numeric" maxLength={2} value={mFim} onChangeText={(v) => lidarComM(v, setMFim)} />
                </View>
              </View>

              <Text style={styles.infoLimite}>Permitido: {formatarDuracaoVisual(recursoSelecionado?.minHoras || 0)} a {formatarDuracaoVisual(recursoSelecionado?.maxHoras || 0)}</Text>

              {aviso ? (
                <View style={[styles.caixaMensagem, tipoAviso === 'erro' ? styles.caixaErro : styles.caixaSucesso]}>
                  <Text style={[styles.textoMensagem, tipoAviso === 'erro' ? styles.textoErro : styles.textoSucesso]}>{aviso}</Text>
                </View>
              ) : null}

              <TouchableOpacity style={styles.btnConfirmar} onPress={handleReservar}>
                <Text style={styles.txtConfirmar}>Confirmar Reserva</Text>
              </TouchableOpacity>
              <View style={{height: 20}} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B', padding: 24 },
  toastContainer: { position: 'absolute', top: 60, right: 20, backgroundColor: '#18181B', borderColor: '#06B6D4', borderWidth: 1, borderLeftWidth: 4, borderRadius: 8, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5, maxWidth: '80%' },
  toastText: { color: '#FAFAFA', fontSize: 12, fontWeight: 'bold', marginRight: 16 },
  toastClose: { color: '#A1A1AA', fontWeight: 'bold', fontSize: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 32 },
  saudacao: { fontSize: 20, fontWeight: 'bold', color: '#FAFAFA', letterSpacing: -0.5 },
  subSaudacao: { fontSize: 12, color: '#A1A1AA', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  btnSair: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#27272A' },
  txtSair: { color: '#EF4444', fontWeight: '600', textTransform: 'uppercase', fontSize: 12 },
  textoVazio: { color: '#52525B', fontSize: 14, marginTop: 10 },
  cardRecurso: { backgroundColor: '#18181B', padding: 20, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#27272A' },
  cardOcupado: { borderColor: '#3F3F46' },
  rowEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  nomeRecurso: { fontSize: 16, color: '#FAFAFA', fontWeight: '600', marginBottom: 4 },
  badgeTipo: { color: '#06B6D4', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  txtReservar: { color: '#06B6D4', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', marginBottom: 4 },
  infoReservas: { color: '#52525B', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  tabContainer: { flexDirection: 'row', marginBottom: 24, backgroundColor: '#18181B', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  tabAtiva: { backgroundColor: '#27272A' },
  tabText: { color: '#A1A1AA', fontSize: 12, fontWeight: 'bold' },
  tabTextAtivo: { color: '#FAFAFA' },
  infoOcupado: { color: '#A1A1AA', fontSize: 12 },
  ticketReserva: { flexDirection: 'row', backgroundColor: '#09090B', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#27272A', marginTop: 16, alignItems: 'center', justifyContent: 'space-between' },
  ticketColuna: { alignItems: 'center' },
  ticketLabel: { color: '#52525B', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  ticketData: { color: '#FAFAFA', fontSize: 14, fontWeight: 'bold', marginTop: 4 },
  ticketHora: { color: '#06B6D4', fontSize: 12, fontWeight: 'bold' },
  ticketMeio: { flex: 1, alignItems: 'center', paddingHorizontal: 16 },
  ticketDuracao: { color: '#A1A1AA', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  ticketLinha: { height: 1, backgroundColor: '#27272A', width: '100%' },
  txtEmUso: { color: '#06B6D4', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  txtFuturo: { color: '#A1A1AA', fontSize: 12, fontStyle: 'italic' },
  txtCronometro: { color: '#FAFAFA', fontSize: 14, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#18181B', width: '100%', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, borderWidth: 1, borderColor: '#27272A', maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FAFAFA' },
  btnFecharModal: { backgroundColor: '#27272A', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  txtFecharModal: { color: '#A1A1AA', fontWeight: 'bold' },
  labelPainel: { color: '#A1A1AA', marginBottom: 8, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 'bold' },
  inputModal: { backgroundColor: '#09090B', color: '#FAFAFA', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#27272A', marginBottom: 24 },
  blocoData: { backgroundColor: '#09090B', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#27272A', marginBottom: 16 },
  labelData: { color: '#06B6D4', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  scrollDatas: { marginBottom: 12, flexDirection: 'row' },
  chipData: { backgroundColor: '#18181B', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#27272A', marginRight: 8 },
  chipDataAtivo: { backgroundColor: '#131316', borderColor: '#06B6D4' },
  txtChipData: { color: '#A1A1AA', fontSize: 14, fontWeight: 'bold' },
  txtChipDataAtivo: { color: '#06B6D4' },
  infoLimite: { color: '#52525B', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center', marginBottom: 20 },
  btnConfirmar: { backgroundColor: '#06B6D4', padding: 18, borderRadius: 12, alignItems: 'center' },
  txtConfirmar: { color: '#09090B', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  caixaMensagem: { padding: 12, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4 },
  caixaErro: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeftColor: '#EF4444' },
  caixaSucesso: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderLeftColor: '#10B981' },
  textoMensagem: { fontSize: 14, fontWeight: '600' },
  textoErro: { color: '#FCA5A5' },
  textoSucesso: { color: '#6EE7B7' },
  relogioDigitalContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#131316', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#27272A', marginTop: 8 },
  inputRelogio: { backgroundColor: '#09090B', color: '#06B6D4', fontSize: 32, fontWeight: 'bold', textAlign: 'center', width: 80, height: 60, borderRadius: 8, borderWidth: 1, borderColor: '#3F3F46' },
  separadorRelogio: { color: '#FAFAFA', fontSize: 32, fontWeight: 'bold', marginHorizontal: 16, paddingBottom: 6 },
});