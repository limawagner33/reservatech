import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Keyboard, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecursos, Reserva, Recurso } from '../../src/context/RecursosContext';

// Categorias usando URLs da web para não quebrar o build na Vercel
const categoriasReserva = [
  { id: 'SALA', nome: 'Sala de Reunião', imagem: { uri: 'https://cdn-icons-png.flaticon.com/512/2942/2942933.png' } },
  { id: 'EQUIPAMENTO', nome: 'Equipamentos', imagem: { uri: 'https://cdn-icons-png.flaticon.com/512/3004/3004100.png' } },
  { id: 'VEICULO', nome: 'Veículos', imagem: { uri: 'https://cdn-icons-png.flaticon.com/512/2962/2962303.png' } },
  { id: 'LABORATORIO', nome: 'Laboratórios', imagem: { uri: 'https://cdn-icons-png.flaticon.com/512/933/933042.png' } },
];

const formatarDataLocal = (ts: number) => { const d = new Date(ts); return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`; };
const formatarHoraLocal = (ts: number) => { const d = new Date(ts); return `${d.getHours().toString().padStart(2, '0')}h${d.getMinutes().toString().padStart(2, '0')}`; };
const formatarDuracaoVisual = (d: number) => { if (!d) return '0m'; const h = Math.floor(d); const m = Math.round((d - h) * 60); if (h === 0) return `${m}m`; if (m === 0) return `${h}h`; return `${h}h${m}m`; };

// CRONÔMETRO INTELIGENTE E ISOLADO
const StatusReativoHome = ({ reserva, recurso, onExpirar }: { reserva: Reserva, recurso: Recurso, onExpirar: () => void }) => {
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
  return <Text style={styles.txtCronometroHome}>{texto}</Text>;
};

const gerarDiasReserva = () => {
  const dias = []; const hoje = new Date();
  for (let i = 0; i < 15; i++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    dias.push({ data, str: `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}` });
  }
  return dias;
};

// COMPONENTE DO FORMULÁRIO ISOLADO (Blinda Teclado)
const FormularioReservaHome = ({ recurso, dias, onClose, onSucesso }: { recurso: Recurso, dias: any[], onClose: () => void, onSucesso: () => void }) => {
  const { reservarRecurso } = useRecursos();
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
    if (fim <= inicio) { setTipoAviso('erro'); setAviso('QA: O término deve ser superior ao início.'); return; } // Validação estrita mantida
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
      <View style={styles.modalContentHome}>
        <View style={styles.modalHeaderHome}>
          <Text style={styles.modalTitleHome}>{recurso.nome}</Text>
          <TouchableOpacity onPress={onClose} style={styles.btnFecharModalHome}><Text style={styles.txtFecharModalHome}>X</Text></TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.labelModalHome}>Matrícula de Acesso</Text>
          <TextInput style={styles.inputModalHome} placeholder="Ex: 1234" placeholderTextColor="#A1A1AA" keyboardType="numeric" value={matricula} onChangeText={setMatricula} maxLength={6} />
          
          <View style={styles.blocoDataHome}>
            <Text style={styles.labelTempoHome}>INÍCIO</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollDatasHome} keyboardShouldPersistTaps="handled">
              {dias.map((d, i) => (<TouchableOpacity key={i} style={[styles.chipDataHome, dataIni.getDate() === d.data.getDate() && styles.chipDataHomeAtivo]} onPress={() => setDataIni(d.data)}><Text style={[styles.txtChipDataHome, dataIni.getDate() === d.data.getDate() && styles.txtChipDataHomeAtivo]}>{d.str}</Text></TouchableOpacity>))}
            </ScrollView>
            <View style={styles.relogioDigitalHome}>
              <TextInput style={styles.inputRelogioHome} placeholder="00" placeholderTextColor="#A1A1AA" keyboardType="numeric" maxLength={2} value={hIni} onChangeText={(v) => processarTempoForm(v, 23, setHIni)} />
              <Text style={styles.separadorRelogioHome}>:</Text>
              <TextInput style={styles.inputRelogioHome} placeholder="00" placeholderTextColor="#A1A1AA" keyboardType="numeric" maxLength={2} value={mIni} onChangeText={(v) => processarTempoForm(v, 59, setMIni)} />
            </View>
          </View>
          <View style={styles.blocoDataHome}>
            <Text style={styles.labelTempoHome}>TÉRMINO</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollDatasHome} keyboardShouldPersistTaps="handled">
              {dias.map((d, i) => (<TouchableOpacity key={i} style={[styles.chipDataHome, dataFim.getDate() === d.data.getDate() && styles.chipDataHomeAtivo]} onPress={() => setDataFim(d.data)}><Text style={[styles.txtChipDataHome, dataFim.getDate() === d.data.getDate() && styles.txtChipDataHomeAtivo]}>{d.str}</Text></TouchableOpacity>))}
            </ScrollView>
            <View style={styles.relogioDigitalHome}>
              <TextInput style={styles.inputRelogioHome} placeholder="00" placeholderTextColor="#A1A1AA" keyboardType="numeric" maxLength={2} value={hFim} onChangeText={(v) => processarTempoForm(v, 23, setHFim)} />
              <Text style={styles.separadorRelogioHome}>:</Text>
              <TextInput style={styles.inputRelogioHome} placeholder="00" placeholderTextColor="#A1A1AA" keyboardType="numeric" maxLength={2} value={mFim} onChangeText={(v) => processarTempoForm(v, 59, setMFim)} />
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
  const { recursos, notificacao, fecharNotificacao, finalizarReservaAutomatica } = useRecursos();
  
  const [recursoSelecionadoHome, setRecursoSelecionadoHome] = useState<Recurso | null>(null);
  const [toastSemCadastroVisivel, setToastSemCadastroVisivel] = useState(false);
  const diasReserva = gerarDiasReserva();

  const tentarReservarCategoria = (idCat: string) => {
    const recursosDessaCat = recursos.filter(r => r.tipo === idCat);
    if (recursosDessaCat.length === 0) {
      setToastSemCadastroVisivel(true);
      setTimeout(() => setToastSemCadastroVisivel(false), 4000);
      return;
    }
    setRecursoSelecionadoHome(recursosDessaCat[0]); // Seleciona o primeiro dessa categoria
  };

  return (
    <View style={styles.container}>
      {notificacao && (
        <View style={styles.toastContainerContext}><Text style={styles.toastTextContext}>{notificacao}</Text><TouchableOpacity onPress={fecharNotificacao}><Text style={styles.toastCloseContext}>X</Text></TouchableOpacity></View>
      )}
      {/* NOTIFICAÇÃO NO CANTO SUPERIOR DIREITO QUANDO NÃO HÁ CADASTROS */}
      {toastSemCadastroVisivel && (
        <View style={styles.toastSemCadastroAdmin}><Text style={styles.txtToastSemCadastro}>ESTE RECURSO NÃO HÁ CADASTROS</Text></View>
      )}

      <View style={styles.headerHome}>
        <TouchableOpacity style={styles.btnSairHeaderHome} onPress={() => router.replace('/')}><Text style={styles.txtSairHeaderHome}>Sair</Text></TouchableOpacity>
        <Text style={styles.txtOlaHome}>Olá, usuário</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{flex: 1}} contentContainerStyle={{paddingBottom: 40}}>
        <Text style={styles.txtPerguntaHome}>O que você deseja reservar?</Text>
        
        {/* CARROSSEL DE CATEGORIAS (Rolagem Horizontal) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carrosselCategoriasHome} contentContainerStyle={{paddingRight: 24}}>
          {categoriasReserva.map(cat => (
            <TouchableOpacity key={cat.id} style={styles.cardCategoriaHome} onPress={() => tentarReservarCategoria(cat.id)} activeOpacity={0.8}>
              <Image source={cat.imagem} style={styles.imgCategoriaHome} />
              <Text style={styles.nomeCategoriaHome}>{cat.nome}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.rowEntreHome}>
          <Text style={styles.txtReservadosHeaderHome}>Recursos reservados</Text>
          <TouchableOpacity><Text style={styles.txtVerTodasHome}>Ver todas {'>'}</Text></TouchableOpacity>
        </View>
        
        {/* CARROSSEL DE RESERVADOS (Inspirado no print) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carrosselReservadosHome} contentContainerStyle={{paddingRight: 24}}>
          {recursos.filter(r => r.reservas.length > 0).length === 0 ? <Text style={styles.textoVazioHome}>Nenhuma reserva ativa.</Text> : recursos.map(recurso => (
            recurso.reservas.map(reserva => (
              <View key={reserva.id} style={styles.cardReservadoInspira}>
                <Image source={categoriasReserva.find(c => c.id === recurso.tipo)?.imagem} style={styles.imgCardReservado} />
                <View style={styles.contentCardReservado}>
                  <View style={styles.rowEntreCard}>
                    <Text style={styles.nomeRecursoCardHome}>{recurso.nome}</Text>
                    <StatusReativoHome reserva={reserva} recurso={recurso} onExpirar={() => finalizarReservaAutomatica(recurso.id, reserva.id, recurso.tipo, recurso.nome)} />
                  </View>
                  <Text style={styles.txtDataReservaCardHome}>{formatarDataLocal(reserva.inicioTimestamp)}, {formatarHoraLocal(reserva.inicioTimestamp)} - {formatarHoraLocal(reserva.fimTimestamp)}</Text>
                </View>
              </View>
            ))
          ))}
        </ScrollView>
      </ScrollView>

      {/* FORMULÁRIO SOBREPOSTO DE RESERVA */}
      {recursoSelecionadoHome && (
        <FormularioReservaHome recurso={recursoSelecionadoHome} dias={diasReserva} onClose={() => setRecursoSelecionadoHome(null)} onSucesso={() => setRecursoSelecionadoHome(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 24 },
  toastSemCadastroAdmin: { position: 'absolute', top: 50, right: 10, backgroundColor: '#B91C1C', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, zIndex: 9999, shadowColor: '#B91C1C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  txtToastSemCadastro: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  toastContainerContext: { position: 'absolute', top: 60, right: 20, backgroundColor: '#FFFFFF', borderColor: '#0047AB', borderWidth: 1, borderLeftWidth: 4, borderRadius: 8, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 9999 },
  toastTextContext: { color: '#171717', fontSize: 12, fontWeight: 'bold' }, toastCloseContext: { color: '#52525B', fontSize: 14, fontWeight: 'bold', marginLeft: 16 },
  headerHome: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 24 },
  btnSairHeaderHome: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  txtSairHeaderHome: { color: '#EF4444', fontSize: 12, fontWeight: 'bold' },
  txtOlaHome: { fontSize: 24, fontWeight: 'bold', color: '#171717' },
  txtPerguntaHome: { fontSize: 16, color: '#171717', fontWeight: '500', marginBottom: 24 },
  carrosselCategoriasHome: { marginBottom: 32 },
  cardCategoriaHome: { width: 140, height: 180, backgroundColor: '#0047AB', borderRadius: 20, padding: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16, shadowColor: '#0047AB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  imgCategoriaHome: { width: 80, height: 80, borderRadius: 40, marginBottom: 16, backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: '#FFFFFF' },
  nomeCategoriaHome: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 4 },
  rowEntreHome: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  txtReservadosHeaderHome: { fontSize: 16, color: '#171717', fontWeight: 'bold' },
  txtVerTodasHome: { color: '#0047AB', fontSize: 12, fontWeight: 'bold' },
  carrosselReservadosHome: { paddingVertical: 10 },
  cardReservadoInspira: { width: 300, backgroundColor: '#FFFFFF', borderRadius: 20, marginRight: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 6, overflow: 'hidden' },
  imgCardReservado: { width: '100%', height: 140 },
  contentCardReservado: { padding: 16 },
  rowEntreCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  nomeRecursoCardHome: { fontSize: 16, color: '#171717', fontWeight: '600' },
  txtCronometroHome: { fontSize: 12, color: '#0047AB', fontWeight: 'bold' },
  txtDataReservaCardHome: { fontSize: 12, color: '#52525B' },
  textoVazioHome: { color: '#A1A1AA', fontSize: 12 },
  modalOverlayHomeAbsoluto: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.9)', zIndex: 1000, justifyContent: 'center', padding: 20 },
  modalContentHome: { backgroundColor: '#FFFFFF', width: '100%', borderRadius: 24, padding: 24 },
  modalHeaderHome: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }, modalTitleHome: { fontSize: 18, fontWeight: 'bold', color: '#171717' },
  btnFecharModalHome: { backgroundColor: '#F8FAFC', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }, txtFecharModalHome: { color: '#171717', fontWeight: 'bold' },
  labelModalHome: { color: '#52525B', marginBottom: 8, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  inputModalHome: { backgroundColor: '#F8FAFC', color: '#171717', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  blocoDataHome: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 }, labelTempoHome: { color: '#0047AB', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  scrollDatasHome: { marginVertical: 12 },
  chipDataHome: { backgroundColor: '#FFFFFF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#CBD5E1', marginRight: 8 },
  chipDataHomeAtivo: { backgroundColor: '#0047AB', borderColor: '#0047AB' },
  txtChipDataHome: { color: '#52525B', fontSize: 12, fontWeight: 'bold' }, txtChipDataHomeAtivo: { color: '#FFFFFF' },
  relogioDigitalHome: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  inputRelogioHome: { backgroundColor: '#FFFFFF', color: '#0047AB', fontSize: 24, fontWeight: 'bold', textAlign: 'center', width: 70, height: 50, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1' }, separadorRelogioHome: { color: '#171717', fontSize: 24, fontWeight: 'bold', marginHorizontal: 12 },
  caixaMensagemHome: { padding: 12, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4 }, textoMensagemHome: { fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  caixaErroHome: { backgroundColor: '#FEF2F2', borderLeftColor: '#EF4444' }, caixaSucessoHome: { backgroundColor: '#ECFDF5', borderLeftColor: '#10B981' },
  infoLimiteHome: { fontSize: 10, color: '#A1A1AA', textAlign: 'center', marginBottom: 20 },
  btnConfirmarHome: { backgroundColor: '#0047AB', padding: 18, borderRadius: 12, alignItems: 'center' }, txtConfirmarHome: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
});