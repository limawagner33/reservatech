import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Keyboard, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecursos } from '../../src/context/RecursosContext';

interface Recurso {
  id: number;
  tipo: string;
  nome: string;
  minHoras: number;
  maxHoras: number;
  reservas?: any[];
}

export default function AdminListaScreen() {
  const router = useRouter();
  const { recursos, atualizarRecurso, excluirRecurso } = useRecursos();

  const [modalVisivel, setModalVisivel] = useState(false);
  const [idEditando, setIdEditando] = useState<number | null>(null);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('');
  
  const [minH, setMinH] = useState('');
  const [minM, setMinM] = useState('');
  const [maxH, setMaxH] = useState('');
  const [maxM, setMaxM] = useState('');
  
  const [aviso, setAviso] = useState('');
  const [tipoAviso, setTipoAviso] = useState<'erro' | 'sucesso' | ''>('');

  const [modalExclusaoVisivel, setModalExclusaoVisivel] = useState(false);
  const [recursoParaExcluir, setRecursoParaExcluir] = useState<{ id: number; nome: string } | null>(null);

  const categorias = ['SALA', 'EQUIPAMENTO', 'VEICULO', 'LABORATORIO', 'SOFTWARE'];

  const validarEntradaTempo = (texto: string, maximo: number, setValor: (v: string) => void) => {
    const valorNum = texto.replace(/[^0-9]/g, '');
    if (valorNum === '') { setValor(''); return; }
    if (parseInt(valorNum) <= maximo) setValor(valorNum);
  };

  const abrirModalEdicao = (recurso: Recurso) => {
    setIdEditando(recurso.id);
    setNome(recurso.nome);
    setTipo(recurso.tipo);
    
    // Matemática Reversa (Decimal -> UI Digital)
    const mH = Math.floor(recurso.minHoras);
    const mM = Math.round((recurso.minHoras - mH) * 60);
    setMinH(mH.toString().padStart(2, '0'));
    setMinM(mM.toString().padStart(2, '0'));

    const xH = Math.floor(recurso.maxHoras);
    const xM = Math.round((recurso.maxHoras - xH) * 60);
    setMaxH(xH.toString().padStart(2, '0'));
    setMaxM(xM.toString().padStart(2, '0'));

    setAviso(''); setTipoAviso('');
    setModalVisivel(true);
  };

  const handleSalvarEdicao = () => {
    Keyboard.dismiss();
    setAviso('');

    if (!nome.trim()) { setTipoAviso('erro'); setAviso('Nome obrigatório.'); return; }

    const nomeJaExiste = recursos.some((r: Recurso) => r.nome.toLowerCase() === nome.toLowerCase() && r.id !== idEditando);
    if (nomeJaExiste) { setTipoAviso('erro'); setAviso('Recurso com este nome já existe.'); return; }

    if (!minH || !minM || !maxH || !maxM) {
      setTipoAviso('erro'); setAviso('Preencha todo o relógio.'); return;
    }

    const minDecimal = parseInt(minH) + (parseInt(minM) / 60);
    const maxDecimal = parseInt(maxH) + (parseInt(maxM) / 60);

    if (minDecimal <= 0 || maxDecimal <= 0) { setTipoAviso('erro'); setAviso('O tempo não pode ser zero.'); return; }
    if (minDecimal > maxDecimal) { setTipoAviso('erro'); setAviso('Mínimo maior que o máximo.'); return; }

    if (idEditando !== null) {
      atualizarRecurso({ id: idEditando, nome, tipo, minHoras: minDecimal, maxHoras: maxDecimal });
      setTipoAviso('sucesso'); setAviso('SUCESSO: Recurso atualizado.');
      setTimeout(() => { setModalVisivel(false); setIdEditando(null); }, 1500);
    }
  };

  const abrirModalExclusao = (id: number, nomeRecurso: string) => {
    setRecursoParaExcluir({ id, nome: nomeRecurso });
    setModalExclusaoVisivel(true);
  };

  const confirmarExclusao = () => {
    if (recursoParaExcluir) {
      excluirRecurso(recursoParaExcluir.id);
      setModalExclusaoVisivel(false);
    }
  };

  const formatarDuracaoVisual = (decimal: number) => {
    if (!decimal) return '0m';
    const h = Math.floor(decimal);
    const m = Math.round((decimal - h) * 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h${m}m`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.saudacao}>Gestao de Recursos</Text>
          <Text style={styles.subSaudacao}>Painel Administrativo</Text>
        </View>
        <TouchableOpacity style={styles.btnVoltar} onPress={() => router.back()}>
          <Text style={styles.txtVoltar}>Voltar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {recursos.length === 0 ? (
          <Text style={styles.textoVazio}>Nenhum recurso cadastrado.</Text>
        ) : (
          recursos.map((recurso: Recurso) => (
            <View key={recurso.id} style={styles.cardLista}>
              <View style={{flex: 1}}>
                <Text style={styles.nomeLista}>{recurso.nome}</Text>
                <Text style={styles.badgeLista}>{recurso.tipo} • {formatarDuracaoVisual(recurso.minHoras)} a {formatarDuracaoVisual(recurso.maxHoras)}</Text>
              </View>
              <View style={styles.acoesLista}>
                <TouchableOpacity onPress={() => abrirModalEdicao(recurso)} style={styles.btnAcao}>
                  <Text style={styles.txtEditar}>EDITAR</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => abrirModalExclusao(recurso.id, recurso.nome)} style={styles.btnAcao}>
                  <Text style={styles.txtExcluir}>EXCLUIR</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* MODAL DE EDIÇÃO DIGITAL */}
        {modalVisivel && (
        <View style={styles.modalOverlayBottom}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%', maxHeight: '90%' }}>
            <View style={styles.modalContentEdicao}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Editar Recurso</Text>
                <TouchableOpacity onPress={() => setModalVisivel(false)} style={styles.btnFecharModal}><Text style={styles.txtFecharModal}>X</Text></TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.label}>Nome</Text>
                <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholderTextColor="#52525B" />

                <View style={styles.blocoTempo}>
                  <Text style={styles.labelTempo}>TEMPO MÍNIMO (HH:MM)</Text>
                  <View style={styles.relogioDigitalContainer}>
                    <TextInput style={styles.inputRelogio} placeholder="00" placeholderTextColor="#52525B" keyboardType="numeric" maxLength={2} value={minH} onChangeText={(v) => validarEntradaTempo(v, 48, setMinH)} />
                    <Text style={styles.separadorRelogio}>:</Text>
                    <TextInput style={styles.inputRelogio} placeholder="00" placeholderTextColor="#52525B" keyboardType="numeric" maxLength={2} value={minM} onChangeText={(v) => validarEntradaTempo(v, 59, setMinM)} />
                  </View>
                </View>

                <View style={styles.blocoTempo}>
                  <Text style={styles.labelTempo}>TEMPO MÁXIMO (HH:MM)</Text>
                  <View style={styles.relogioDigitalContainer}>
                    <TextInput style={styles.inputRelogio} placeholder="00" placeholderTextColor="#52525B" keyboardType="numeric" maxLength={2} value={maxH} onChangeText={(v) => validarEntradaTempo(v, 48, setMaxH)} />
                    <Text style={styles.separadorRelogio}>:</Text>
                    <TextInput style={styles.inputRelogio} placeholder="00" placeholderTextColor="#52525B" keyboardType="numeric" maxLength={2} value={maxM} onChangeText={(v) => validarEntradaTempo(v, 59, setMaxM)} />
                  </View>
                </View>

                {aviso ? <View style={[styles.caixaMensagem, tipoAviso === 'erro' ? styles.caixaErro : styles.caixaSucesso]}><Text style={[styles.textoMensagem, tipoAviso === 'erro' ? styles.textoErro : styles.textoSucesso]}>{aviso}</Text></View> : null}
                <TouchableOpacity style={styles.btnConfirmar} onPress={handleSalvarEdicao}><Text style={styles.txtConfirmar}>Salvar Alterações</Text></TouchableOpacity>
                <View style={{height: 20}} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* MODAL DE EXCLUSÃO */}
      <Modal animationType="fade" transparent={true} visible={modalExclusaoVisivel} onRequestClose={() => setModalExclusaoVisivel(false)}>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.modalContentAlerta}>
            <Text style={styles.tituloAlerta}>Confirmar Exclusão</Text>
            <Text style={styles.textoAlerta}>Deseja remover definitivamente <Text style={{fontWeight: 'bold', color: '#FAFAFA'}}>"{recursoParaExcluir?.nome}"</Text>?</Text>
            <Text style={styles.subTextoAlerta}>Esta ação não poderá ser desfeita.</Text>
            <View style={styles.rowBotoesAlerta}>
              <TouchableOpacity style={styles.btnCancelarAlerta} onPress={() => setModalExclusaoVisivel(false)}><Text style={styles.txtCancelarAlerta}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirmarAlerta} onPress={confirmarExclusao}><Text style={styles.txtConfirmarAlerta}>Sim, Excluir</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 32 },
  saudacao: { fontSize: 24, fontWeight: 'bold', color: '#FAFAFA', letterSpacing: -0.5 },
  subSaudacao: { fontSize: 14, color: '#A1A1AA', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  btnVoltar: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#27272A' },
  txtVoltar: { color: '#A1A1AA', fontWeight: '600', textTransform: 'uppercase', fontSize: 12 },
  textoVazio: { color: '#52525B', fontSize: 14 },
  cardLista: { backgroundColor: '#18181B', padding: 20, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#27272A', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nomeLista: { fontSize: 16, color: '#FAFAFA', fontWeight: '600', marginBottom: 4 },
  badgeLista: { color: '#06B6D4', fontSize: 12, fontWeight: 'bold' },
  acoesLista: { flexDirection: 'row', gap: 16 },
  btnAcao: { padding: 4 },
  txtEditar: { color: '#06B6D4', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
  txtExcluir: { color: '#EF4444', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
  modalOverlayBottom: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.9)', zIndex: 1000, justifyContent: 'flex-end' },
  modalContentEdicao: { backgroundColor: '#18181B', width: '100%', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, borderWidth: 1, borderColor: '#27272A', maxHeight: '90%' }, 
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContentAlerta: { backgroundColor: '#18181B', width: '100%', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#3F3F46' },
  tituloAlerta: { fontSize: 20, fontWeight: 'bold', color: '#FAFAFA', marginBottom: 12 },
  textoAlerta: { color: '#D4D4D8', fontSize: 14, lineHeight: 22 },
  subTextoAlerta: { color: '#EF4444', fontSize: 12, fontWeight: 'bold', marginTop: 12, marginBottom: 32, textTransform: 'uppercase', letterSpacing: 0.5 },
  rowBotoesAlerta: { flexDirection: 'row', gap: 12 },
  btnCancelarAlerta: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#52525B', alignItems: 'center' },
  txtCancelarAlerta: { color: '#FAFAFA', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  btnConfirmarAlerta: { flex: 1, backgroundColor: '#EF4444', padding: 16, borderRadius: 12, alignItems: 'center' },
  txtConfirmarAlerta: { color: '#FAFAFA', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FAFAFA' },
  btnFecharModal: { backgroundColor: '#27272A', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  txtFecharModal: { color: '#A1A1AA', fontWeight: 'bold' },
  label: { color: '#D4D4D8', marginBottom: 8, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#09090B', color: '#FAFAFA', borderRadius: 12, padding: 16, marginBottom: 20, fontSize: 16, borderWidth: 1, borderColor: '#27272A' },
  scrollChips: { marginBottom: 20, flexDirection: 'row' },
  chip: { backgroundColor: '#09090B', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#27272A', marginRight: 10, height: 45, justifyContent: 'center' },
  chipAtivo: { backgroundColor: '#131316', borderColor: '#06B6D4' },
  chipTexto: { color: '#A1A1AA', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  chipTextoAtivo: { color: '#06B6D4' },
  blocoTempo: { backgroundColor: '#09090B', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#27272A', marginBottom: 20 },
  labelTempo: { color: '#06B6D4', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  btnConfirmar: { backgroundColor: '#06B6D4', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 8 },
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