import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Keyboard, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecursos, Reserva, Recurso } from '../../src/context/RecursosContext';

// Categorias usando URLs da web corporativas (Estilo Unsplash)
const categoriasReserva = [
  { id: 'SALA', nome: 'Sala de Reunião', imagem: { uri: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=500&q=80' } },
  { id: 'EQUIPAMENTO', nome: 'Equipamentos', imagem: { uri: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=500&q=80' } },
  { id: 'VEICULO', nome: 'Veículos', imagem: { uri: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=500&q=80' } },
  { id: 'LABORATORIO', nome: 'Laboratórios', imagem: { uri: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=500&q=80' } },
];

const formatarDataLocal = (ts: number) => { const d = new Date(ts); return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`; };
const formatarHoraLocal = (ts: number) => { const d = new Date(ts); return `${d.getHours().toString().padStart(2, '0')}h${d.getMinutes().toString().padStart(2, '0')}`; };
const formatarDuracaoVisual = (d: number) => { if (!d) return '0m'; const h = Math.floor(d); const m = Math.round((d - h) * 60); if (h === 0) return `${m}m`; if (m === 0) return `${h}h`; return `${h}h${m}m`; };

// CRONÔMETRO INTELIGENTE E ISOLADO (Agora recebe a cor dinâmica)
const StatusReativoHome = ({ reserva, recurso, onExpirar, corDestaque }: { reserva: Reserva, recurso: Recurso, onExpirar: () => void, corDestaque: string }) => {
  const [texto, setTexto] = useState('');
  useEffect(() => {
    const tick = () => {
      const agora = Date.now();
      if (agora < reserva.inicioTimestamp) { setTexto('Aguardando...'); } 
      else if (agora < reserva.fimTimestamp) {
        const diff = reserva.fimTimestamp - agora;
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setTexto(`${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
      } else { setTexto('Encerrando...'); onExpirar(); }
    };
    tick(); const interval = setInterval(tick, 1000); return () => clearInterval(interval);
  }, [reserva, onExpirar]);
  return <Text style={[styles.txtCronometroHome, { color: corDestaque }]}>{texto}</Text>;
};

const gerarDiasReserva = () => {
  const dias = []; const hoje = new Date();
  for (let i = 0; i < 15; i++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    dias.push({ data, str: `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}` });
  }
  return dias;
};

// COMPONENTE DO FORMULÁRIO ISOLADO (Lê o tema para mudar as cores do Modal)
const FormularioReservaHome = ({ recurso, dias, onClose, onSucesso }: { recurso: Recurso, dias: any[], onClose: () => void, onSucesso: () => void }) => {
  const { reservarRecurso, tema } = useRecursos(); // Puxando o tema aqui também
  
  // Paleta dinâmica para o Modal
  const isDark = tema === 'dark';
  const c = {
    bgModal: isDark ? '#18181B' : '#FFFFFF',
    inputBg: isDark ? '#09090B' : '#F8FAFC',
    textoPri: isDark ? '#FAFAFA' : '#171717',
    textoSec: isDark ? '#A1A1AA' : '#52525B',
    borda: isDark ? '#27272A' : '#E2E8F0',
    destaque: '#0047AB'
  };

  const [matricula, setMatricula] = useState('');
  const [dataIni, setDataIni] = useState(dias[0].data); const [dataFim, setDataFim] = useState(dias[0].data);
  const [hIni, setHIni] = useState(''); const [mIni, setMIni] = useState('');
  const [hFim, setHFim] = useState(''); const [mFim, setMFim] = useState('');
  const [aviso, setAviso] = useState(''); const [tipoAviso, setTipoAviso] = useState<'erro' | 'sucesso' | ''>('');

  const processarTempoForm = (valor: string, max: number, setValor: (v: string) => void) => {
    const numStr = valor.replace(/[^0-9]/g, ''); if (numStr === '') { setValor(''); return; }
    const num = parseInt(numStr, 10); if (num > max) setValor(max.toString().padStart(2, '0')); else setValor(numStr);
  };

  const handleReservarHome = () => {
    Keyboard.dismiss(); setAviso(''); setTipoAviso('');
    if (matricula.length < 4 || !hIni || !mIni || !hFim || !mFim) { setTipoAviso('erro'); setAviso('QA: Preencha todos os campos.'); return; }
    const inicio = new Date(dataIni.getFullYear(), dataIni.getMonth(), dataIni.getDate(), parseInt(hIni), parseInt(mIni), 0).getTime();
    const fim = new Date(dataFim.getFullYear(), dataFim.getMonth(), dataFim.getDate(), parseInt(hFim), parseInt(mFim), 0).getTime();
    const agora = Date.now();
    if (inicio <= agora) { setTipoAviso('erro'); setAviso('QA: Inicie no futuro.'); return; }
    if (fim <= inicio) { setTipoAviso('erro'); setAviso('QA: O término deve ser superior ao início.'); return; }
    const duracaoH = (fim - inicio) / 3600000;
    if (duracaoH < recurso.minHoras || duracaoH > recurso.maxHoras) {
      setTipoAviso('erro'); setAviso(`QA: Exigido ${formatarDuracaoVisual(recurso.minHoras)} a ${formatarDuracaoVisual(recurso.maxHoras)}.`); return;
    }
    try {
      reservarRecurso(recurso.id, matricula, inicio, fim);
      setTipoAviso('sucesso'); setAviso('SUCESSO: Agendado.');
      setTimeout(() => { onSucesso(); }, 1500);
    } catch (e: any) { setTipoAviso('erro'); setAviso(e.message); }
  };

  return (
    <View style={styles.modalOverlayHomeAbsoluto}>
      <View style={[styles.modalContentHome, { backgroundColor: c.bgModal, borderColor: c.borda }]}>
        <View style={styles.modalHeaderHome}>
          <Text style={[styles.modalTitleHome, { color: c.textoPri }]}>{recurso.nome}</Text>
          <TouchableOpacity onPress={onClose} style={[styles.btnFecharModalHome, { backgroundColor: c.inputBg, borderColor: c.borda }]}><Text style={{color: c.textoPri, fontWeight: 'bold'}}>X</Text></TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={[styles.labelModalHome, { color: c.textoSec }]}>Matrícula de Acesso</Text>
          <TextInput style={[styles.inputModalHome, { backgroundColor: c.inputBg, color: c.textoPri, borderColor: c.borda }]} placeholder="Ex: 1234" placeholderTextColor={c.textoSec} keyboardType="numeric" value={matricula} onChangeText={setMatricula} maxLength={6} />
          
          <View style={[styles.blocoDataHome, { backgroundColor: c.inputBg, borderColor: c.borda }]}>
            <Text style={styles.labelTempoHome}>INÍCIO</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollDatasHome} keyboardShouldPersistTaps="handled">
              {dias.map((d, i) => (<TouchableOpacity key={i} style={[styles.chipDataHome, { backgroundColor: dataIni.getDate() === d.data.getDate() ? c.destaque : c.bgModal, borderColor: dataIni.getDate() === d.data.getDate() ? c.destaque : c.borda }]} onPress={() => setDataIni(d.data)}><Text style={[styles.txtChipDataHome, { color: dataIni.getDate() === d.data.getDate() ? '#FFF' : c.textoSec }]}>{d.str}</Text></TouchableOpacity>))}
            </ScrollView>
            <View style={styles.relogioDigitalHome}>
              <TextInput style={[styles.inputRelogioHome, { backgroundColor: c.bgModal, borderColor: c.borda, color: c.destaque }]} placeholder="00" placeholderTextColor={c.textoSec} keyboardType="numeric" maxLength={2} value={hIni} onChangeText={(v) => processarTempoForm(v, 23, setHIni)} />
              <Text style={[styles.separadorRelogioHome, { color: c.textoPri }]}>:</Text>
              <TextInput style={[styles.inputRelogioHome, { backgroundColor: c.bgModal, borderColor: c.borda, color: c.destaque }]} placeholder="00" placeholderTextColor={c.textoSec} keyboardType="numeric" maxLength={2} value={mIni} onChangeText={(v) => processarTempoForm(v, 59, setMIni)} />
            </View>
          </View>
          <View style={[styles.blocoDataHome, { backgroundColor: c.inputBg, borderColor: c.borda }]}>
            <Text style={styles.labelTempoHome}>TÉRMINO</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollDatasHome} keyboardShouldPersistTaps="handled">
              {dias.map((d, i) => (<TouchableOpacity key={i} style={[styles.chipDataHome, { backgroundColor: dataFim.getDate() === d.data.getDate() ? c.destaque : c.bgModal, borderColor: dataFim.getDate() === d.data.getDate() ? c.destaque : c.borda }]} onPress={() => setDataFim(d.data)}><Text style={[styles.txtChipDataHome, { color: dataFim.getDate() === d.data.getDate() ? '#FFF' : c.textoSec }]}>{d.str}</Text></TouchableOpacity>))}
            </ScrollView>
            <View style={styles.relogioDigitalHome}>
              <TextInput style={[styles.inputRelogioHome, { backgroundColor: c.bgModal, borderColor: c.borda, color: c.destaque }]} placeholder="00" placeholderTextColor={c.textoSec} keyboardType="numeric" maxLength={2} value={hFim} onChangeText={(v) => processarTempoForm(v, 23, setHFim)} />
              <Text style={[styles.separadorRelogioHome, { color: c.textoPri }]}>:</Text>
              <TextInput style={[styles.inputRelogioHome, { backgroundColor: c.bgModal, borderColor: c.borda, color: c.destaque }]} placeholder="00" placeholderTextColor={c.textoSec} keyboardType="numeric" maxLength={2} value={mFim} onChangeText={(v) => processarTempoForm(v, 59, setMFim)} />
            </View>
          </View>
          <Text style={styles.infoLimiteHome}>Limites: {formatarDuracaoVisual(recurso.minHoras)} a {formatarDuracaoVisual(recurso.maxHoras)}</Text>
          {aviso ? <View style={[styles.caixaMensagemHome, tipoAviso === 'erro' ? styles.caixaErroHome : styles.caixaSucessoHome]}><Text style={styles.textoMensagemHome}>{aviso}</Text></View> : null}
          <TouchableOpacity style={styles.btnConfirmarHome} onPress={handleReservarHome}><Text style={styles.txtConfirmarHome}>Confirmar</Text></TouchableOpacity>
          <View style={{height: 20}} />
        </ScrollView>
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  
  // PUXANDO TEMA E ALTERNARTEMA DO CONTEXTO
  const { recursos, notificacao, fecharNotificacao, finalizarReservaAutomatica, tema, alternarTema } = useRecursos();
  
  const [recursoSelecionadoHome, setRecursoSelecionadoHome] = useState<Recurso | null>(null);
  const [toastSemCadastroVisivel, setToastSemCadastroVisivel] = useState(false);
  const diasReserva = gerarDiasReserva();

  // PALETA DE CORES DINÂMICA
  const isDark = tema === 'dark';
  const c = {
    bg: isDark ? '#09090B' : '#FFFFFF',
    card: isDark ? '#18181B' : '#FFFFFF',
    textoPri: isDark ? '#FAFAFA' : '#171717',
    textoSec: isDark ? '#A1A1AA' : '#52525B',
    borda: isDark ? '#27272A' : '#E2E8F0',
    destaque: '#0047AB'
  };

  const tentarReservarCategoria = (idCat: string) => {
    const recursosDessaCat = recursos.filter(r => r.tipo === idCat);
    if (recursosDessaCat.length === 0) {
      setToastSemCadastroVisivel(true);
      setTimeout(() => setToastSemCadastroVisivel(false), 4000);
      return;
    }
    setRecursoSelecionadoHome(recursosDessaCat[0]);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {notificacao && (
        <View style={[styles.toastContainerContext, { backgroundColor: c.card, borderColor: c.destaque }]}><Text style={[styles.toastTextContext, { color: c.textoPri }]}>{notificacao}</Text><TouchableOpacity onPress={fecharNotificacao}><Text style={styles.toastCloseContext}>X</Text></TouchableOpacity></View>
      )}
      {toastSemCadastroVisivel && (
        <View style={styles.toastSemCadastroAdmin}><Text style={styles.txtToastSemCadastro}>ESTE RECURSO NÃO HÁ CADASTROS</Text></View>
      )}

      {/* HEADER COM O BOTÃO ☀️/🌙 */}
      <View style={styles.headerHome}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity style={[styles.btnSairHeaderHome, { borderColor: c.borda, backgroundColor: isDark ? '#18181B' : '#F8FAFC' }]} onPress={() => router.replace('/')}>
            <Text style={styles.txtSairHeaderHome}>Sair</Text>
          </TouchableOpacity>
          <Text style={[styles.txtOlaHome, { color: c.textoPri }]}>Olá, usuário</Text>
        </View>
        <TouchableOpacity onPress={alternarTema} style={[styles.btnTema, { backgroundColor: isDark ? '#18181B' : '#F8FAFC', borderColor: c.borda }]}>
          <Text style={{ fontSize: 16 }}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{flex: 1}} contentContainerStyle={{paddingBottom: 40}}>
        <Text style={[styles.txtPerguntaHome, { color: c.textoPri }]}>O que você deseja reservar?</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carrosselCategoriasHome} contentContainerStyle={{paddingRight: 24}}>
          {categoriasReserva.map(cat => (
            <TouchableOpacity key={cat.id} style={styles.cardCategoriaHome} onPress={() => tentarReservarCategoria(cat.id)} activeOpacity={0.8}>
              <Image source={cat.imagem} style={styles.imgCategoriaHome} />
              <Text style={styles.nomeCategoriaHome}>{cat.nome}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.rowEntreHome}>
          <Text style={[styles.txtReservadosHeaderHome, { color: c.textoPri }]}>Recursos reservados</Text>
          <TouchableOpacity><Text style={styles.txtVerTodasHome}>Ver todas {'>'}</Text></TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carrosselReservadosHome} contentContainerStyle={{paddingRight: 24}}>
          {recursos.filter(r => r.reservas.length > 0).length === 0 ? <Text style={[styles.textoVazioHome, { color: c.textoSec }]}>Nenhuma reserva ativa.</Text> : recursos.map(recurso => (
            recurso.reservas.map(reserva => (
              <View key={reserva.id} style={[styles.cardReservadoInspira, { backgroundColor: c.card, borderColor: c.borda }]}>
                <Image source={categoriasReserva.find(c => c.id === recurso.tipo)?.imagem} style={styles.imgCardReservado} />
                <View style={styles.contentCardReservado}>
                  <View style={styles.rowEntreCard}>
                    <Text style={[styles.nomeRecursoCardHome, { color: c.textoPri }]}>{recurso.nome}</Text>
                    {/* Passando a cor de destaque para o cronômetro */}
                    <StatusReativoHome reserva={reserva} recurso={recurso} onExpirar={() => finalizarReservaAutomatica(recurso.id, reserva.id, recurso.tipo, recurso.nome)} corDestaque={c.destaque} />
                  </View>
                  <Text style={[styles.txtDataReservaCardHome, { color: c.textoSec }]}>{formatarDataLocal(reserva.inicioTimestamp)}, {formatarHoraLocal(reserva.inicioTimestamp)} - {formatarHoraLocal(reserva.fimTimestamp)}</Text>
                </View>
              </View>
            ))
          ))}
        </ScrollView>
      </ScrollView>

      {recursoSelecionadoHome && (
        <FormularioReservaHome recurso={recursoSelecionadoHome} dias={diasReserva} onClose={() => setRecursoSelecionadoHome(null)} onSucesso={() => setRecursoSelecionadoHome(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  toastSemCadastroAdmin: { position: 'absolute', top: 50, right: 10, backgroundColor: '#B91C1C', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, zIndex: 9999, shadowColor: '#B91C1C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  txtToastSemCadastro: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  toastContainerContext: { position: 'absolute', top: 60, right: 20, borderLeftWidth: 4, borderRadius: 8, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 9999 },
  toastTextContext: { fontSize: 12, fontWeight: 'bold' }, toastCloseContext: { color: '#52525B', fontSize: 14, fontWeight: 'bold', marginLeft: 16 },
  headerHome: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 24 },
  btnSairHeaderHome: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1 },
  txtSairHeaderHome: { color: '#EF4444', fontSize: 12, fontWeight: 'bold' },
  txtOlaHome: { fontSize: 24, fontWeight: 'bold' },
  btnTema: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  txtPerguntaHome: { fontSize: 16, fontWeight: '500', marginBottom: 24 },
  carrosselCategoriasHome: { marginBottom: 32 },
  cardCategoriaHome: { width: 140, height: 180, backgroundColor: '#0047AB', borderRadius: 20, padding: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16, shadowColor: '#0047AB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  imgCategoriaHome: { width: 80, height: 80, borderRadius: 40, marginBottom: 16, backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: '#FFFFFF' },
  nomeCategoriaHome: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 4 },
  rowEntreHome: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  txtReservadosHeaderHome: { fontSize: 16, fontWeight: 'bold' },
  txtVerTodasHome: { color: '#0047AB', fontSize: 12, fontWeight: 'bold' },
  carrosselReservadosHome: { paddingVertical: 10 },
  cardReservadoInspira: { width: 300, borderRadius: 20, marginRight: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 6, overflow: 'hidden' },
  imgCardReservado: { width: '100%', height: 140 },
  contentCardReservado: { padding: 16 },
  rowEntreCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  nomeRecursoCardHome: { fontSize: 16, fontWeight: '600' },
  txtCronometroHome: { fontSize: 12, fontWeight: 'bold' },
  txtDataReservaCardHome: { fontSize: 12 },
  textoVazioHome: { fontSize: 12 },
  modalOverlayHomeAbsoluto: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.9)', zIndex: 1000, justifyContent: 'center', padding: 20 },
  modalContentHome: { width: '100%', borderRadius: 24, padding: 24, borderWidth: 1 },
  modalHeaderHome: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }, modalTitleHome: { fontSize: 18, fontWeight: 'bold' },
  btnFecharModalHome: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 }, 
  labelModalHome: { marginBottom: 8, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  inputModalHome: { borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, marginBottom: 20 },
  blocoDataHome: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 }, labelTempoHome: { color: '#0047AB', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  scrollDatasHome: { marginVertical: 12 },
  chipDataHome: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  txtChipDataHome: { fontSize: 12, fontWeight: 'bold' },
  relogioDigitalHome: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  inputRelogioHome: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', width: 70, height: 50, borderRadius: 8, borderWidth: 1 }, separadorRelogioHome: { fontSize: 24, fontWeight: 'bold', marginHorizontal: 12 },
  caixaMensagemHome: { padding: 12, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4 }, textoMensagemHome: { fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  caixaErroHome: { backgroundColor: '#FEF2F2', borderLeftColor: '#EF4444' }, caixaSucessoHome: { backgroundColor: '#ECFDF5', borderLeftColor: '#10B981' },
  infoLimiteHome: { fontSize: 10, color: '#A1A1AA', textAlign: 'center', marginBottom: 20 },
  btnConfirmarHome: { backgroundColor: '#0047AB', padding: 18, borderRadius: 12, alignItems: 'center' }, txtConfirmarHome: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
});