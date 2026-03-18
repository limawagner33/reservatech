import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecursos, Recurso } from '../../src/context/RecursosContext';

const categoriasFiltro = [
  { id: 'SALA', nome: 'Salas' },
  { id: 'EQUIPAMENTO', nome: 'Equipamentos' },
  { id: 'VEICULO', nome: 'Veículos' },
  { id: 'LABORATORIO', nome: 'Laboratórios' },
];

const formatarDuracaoVisual = (d: number) => { 
  if (!d) return '0m'; 
  const h = Math.floor(d); 
  const m = Math.round((d - h) * 60); 
  if (h === 0) return `${m}m`; 
  if (m === 0) return `${h}h`; 
  return `${h}h${m.toString().padStart(2, '0')}m`; 
};

export default function AdminListaScreen() {
  const router = useRouter();
  const { recursos, excluirRecurso, atualizarRecurso, tema, alternarTema } = useRecursos();
  
  const [filtroAtivo, setFiltroAtivo] = useState<string | null>(null);

  // 👉 ESTADOS DO MODAL DE EDIÇÃO
  const [modalEditVisivel, setModalEditVisivel] = useState(false);
  const [recursoEditando, setRecursoEditando] = useState<Recurso | null>(null);
  
  // 👉 NOVO ESTADO: Modal de Exclusão (Substitui o window.confirm)
  const [modalExcluirVisivel, setModalExcluirVisivel] = useState(false);
  const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);

  const [categoriaEdit, setCategoriaEdit] = useState('');
  const [nomeEdit, setNomeEdit] = useState('');
  const [minH, setMinH] = useState(''); const [minM, setMinM] = useState('');
  const [maxH, setMaxH] = useState(''); const [maxM, setMaxM] = useState('');
  const [aviso, setAviso] = useState(''); const [tipoAviso, setTipoAviso] = useState<'erro' | 'sucesso' | ''>('');

  const isDark = tema === 'dark';
  const c = {
    bg: isDark ? '#09090B' : '#FFFFFF',
    card: isDark ? '#18181B' : '#F8FAFC',
    textoPri: isDark ? '#FAFAFA' : '#171717',
    textoSec: isDark ? '#A1A1AA' : '#52525B',
    borda: isDark ? '#27272A' : '#E2E8F0',
    destaque: '#0047AB',
    perigo: isDark ? '#EF4444' : '#DC2626',
    inputBg: isDark ? '#09090B' : '#FFFFFF',
  };

  const recursosVisiveis = filtroAtivo ? recursos.filter(r => r.tipo === filtroAtivo) : recursos;

  const abrirEdicao = (recurso: Recurso) => {
    setRecursoEditando(recurso);
    setNomeEdit(recurso.nome);
    setCategoriaEdit(recurso.tipo);
    
    const minHFloor = Math.floor(recurso.minHoras);
    const minMFloor = Math.round((recurso.minHoras - minHFloor) * 60);
    setMinH(minHFloor.toString().padStart(2, '0'));
    setMinM(minMFloor.toString().padStart(2, '0'));

    const maxHFloor = Math.floor(recurso.maxHoras);
    const maxMFloor = Math.round((recurso.maxHoras - maxHFloor) * 60);
    setMaxH(maxHFloor.toString().padStart(2, '0'));
    setMaxM(maxMFloor.toString().padStart(2, '0'));

    setAviso(''); setTipoAviso('');
    setModalEditVisivel(true);
  };

  const processarTempo = (valor: string, max: number, setValor: (v: string) => void) => {
    const numStr = valor.replace(/[^0-9]/g, ''); if (numStr === '') { setValor(''); return; }
    const num = parseInt(numStr, 10); if (num > max) setValor(max.toString().padStart(2, '0')); else setValor(numStr);
  };

  const handleSalvarEdicao = () => {
    Keyboard.dismiss(); setAviso(''); setTipoAviso('');
    if (!nomeEdit.trim() || !minH || !minM || !maxH || !maxM || !categoriaEdit) { 
      setTipoAviso('erro'); setAviso('QA: Preencha todos os campos e selecione uma categoria.'); return; 
    }

    const nomeJaExiste = recursos.some(r => r.nome.toLowerCase().trim() === nomeEdit.toLowerCase().trim() && r.id !== recursoEditando?.id);
    if (nomeJaExiste) {
      setTipoAviso('erro'); setAviso('QA Block: Já existe uma infraestrutura cadastrada com este nome.'); return;
    }

    const minDecimal = parseInt(minH) + (parseInt(minM) / 60);
    const maxDecimal = parseInt(maxH) + (parseInt(maxM) / 60);
    if (minDecimal >= maxDecimal) { setTipoAviso('erro'); setAviso('QA: Mínimo deve ser menor que o Máximo.'); return; }

    if (recursoEditando) {
      atualizarRecurso({ id: recursoEditando.id, tipo: categoriaEdit, nome: nomeEdit.trim(), minHoras: minDecimal, maxHoras: maxDecimal });
      setTipoAviso('sucesso'); setAviso('SUCESSO: Recurso atualizado.');
      setTimeout(() => setModalEditVisivel(false), 1500);
    }
  };

  // 👉 AÇÃO DE EXCLUSÃO DEFINITIVA
  const confirmarExclusao = () => {
    if (idParaExcluir !== null) {
      excluirRecurso(idParaExcluir);
    }
    setModalExcluirVisivel(false);
    setIdParaExcluir(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      
      <View style={styles.header}>
        <TouchableOpacity style={[styles.btnVoltar, { borderColor: c.borda, backgroundColor: c.card }]} onPress={() => router.back()}>
          <Text style={{ color: c.textoPri, fontWeight: 'bold' }}>{'< Voltar'}</Text>
        </TouchableOpacity>
        <Text style={[styles.titulo, { color: c.textoPri }]}>Gestão de Recursos</Text>
        <TouchableOpacity onPress={alternarTema} style={[styles.btnTema, { backgroundColor: c.card, borderColor: c.borda }]}>
          <Text style={{ fontSize: 16 }}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.areaFiltro} contentContainerStyle={{ paddingRight: 24, paddingLeft: 24 }}>
        <TouchableOpacity style={[styles.chipFiltro, { backgroundColor: filtroAtivo === null ? c.destaque : c.card, borderColor: filtroAtivo === null ? c.destaque : c.borda }]} onPress={() => setFiltroAtivo(null)}>
          <Text style={{ color: filtroAtivo === null ? '#FFF' : c.textoSec, fontSize: 12, fontWeight: 'bold' }}>Todos</Text>
        </TouchableOpacity>
        {categoriasFiltro.map(cat => (
          <TouchableOpacity key={cat.id} style={[styles.chipFiltro, { backgroundColor: filtroAtivo === cat.id ? c.destaque : c.card, borderColor: filtroAtivo === cat.id ? c.destaque : c.borda }]} onPress={() => setFiltroAtivo(cat.id)}>
            <Text style={{ color: filtroAtivo === cat.id ? '#FFF' : c.textoSec, fontSize: 12, fontWeight: 'bold' }}>{cat.nome}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        {recursosVisiveis.length === 0 ? (
          <Text style={{ color: c.textoSec, textAlign: 'center', marginTop: 40 }}>Nenhum recurso encontrado.</Text>
        ) : (
          recursosVisiveis.map(recurso => (
            <View key={recurso.id} style={[styles.cardRecurso, { backgroundColor: c.card, borderColor: c.borda }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.txtTipo, { color: c.destaque }]}>{recurso.tipo}</Text>
                <Text style={[styles.txtNome, { color: c.textoPri }]}>{recurso.nome}</Text>
                <Text style={[styles.txtDetalhe, { color: c.textoSec }]}>Limites: {formatarDuracaoVisual(recurso.minHoras)} a {formatarDuracaoVisual(recurso.maxHoras)}</Text>
              </View>
              
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={[styles.btnAcao, { borderColor: c.destaque }]} onPress={() => abrirEdicao(recurso)}>
                  <Text style={{ color: c.destaque, fontWeight: 'bold', fontSize: 12 }}>Editar</Text>
                </TouchableOpacity>
                {/* 👉 BOTÃO EXCLUIR CHAMA O MODAL NOVO */}
                <TouchableOpacity style={[styles.btnAcao, { borderColor: c.perigo }]} onPress={() => {
                  setIdParaExcluir(recurso.id);
                  setModalExcluirVisivel(true);
                }}>
                  <Text style={{ color: c.perigo, fontWeight: 'bold', fontSize: 12 }}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* --- 👉 MODAL DE CONFIRMAÇÃO DE EXCLUSÃO (Double Opt-in) --- */}
      {modalExcluirVisivel && (
        <View style={[styles.modalOverlayAbsoluto, { zIndex: 2000, backgroundColor: 'rgba(0,0,0,0.85)' }]}>
          <View style={[styles.modalContent, { backgroundColor: c.bg, borderColor: c.borda, borderWidth: 1, padding: 32 }]}>
            <Text style={{ color: c.perigo, textAlign: 'center', marginBottom: 16, fontSize: 20, fontWeight: 'bold' }}>Tem certeza?</Text>
            <Text style={{ color: c.textoSec, textAlign: 'center', marginBottom: 32, fontSize: 14, lineHeight: 22 }}>
              Você está prestes a excluir este recurso do sistema. Essa ação não poderá ser desfeita e removerá todas as reservas associadas a ele.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <TouchableOpacity
                style={{ flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: c.borda, backgroundColor: c.inputBg, alignItems: 'center' }}
                onPress={() => {
                  setModalExcluirVisivel(false);
                  setIdParaExcluir(null);
                }}
              >
                <Text style={{ color: c.textoPri, fontWeight: 'bold' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, padding: 16, borderRadius: 12, backgroundColor: c.perigo, alignItems: 'center' }}
                onPress={confirmarExclusao}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* MODAL DE EDIÇÃO */}
      {modalEditVisivel && recursoEditando && (
        <View style={styles.modalOverlayAbsoluto}>
          <View style={[styles.modalContent, { backgroundColor: c.bg, borderColor: c.borda, borderWidth: 1, maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.textoPri }]}>Editar Recurso</Text>
              <TouchableOpacity onPress={() => setModalEditVisivel(false)} style={[styles.btnFecharModal, { backgroundColor: c.inputBg, borderColor: c.borda }]}>
                <Text style={{ color: c.textoPri, fontWeight: 'bold' }}>X</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              
              <Text style={[styles.labelModal, { color: c.textoSec }]}>Categoria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {categoriasFiltro.map(cat => (
                  <TouchableOpacity 
                    key={cat.id} 
                    style={[styles.chipFiltro, { 
                      backgroundColor: categoriaEdit === cat.id ? c.destaque : c.inputBg, 
                      borderColor: categoriaEdit === cat.id ? c.destaque : c.borda 
                    }]} 
                    onPress={() => setCategoriaEdit(cat.id)}
                  >
                    <Text style={{ color: categoriaEdit === cat.id ? '#FFF' : c.textoSec, fontSize: 12, fontWeight: 'bold' }}>{cat.nome}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.labelModal, { color: c.textoSec }]}>Nome do Recurso</Text>
              <TextInput style={[styles.inputModal, { backgroundColor: c.inputBg, color: c.textoPri, borderColor: c.borda }]} value={nomeEdit} onChangeText={setNomeEdit} />
              
              <View style={[styles.blocoTempo, { backgroundColor: c.inputBg, borderColor: c.borda }]}>
                <Text style={styles.labelTempo}>Tempo Mínimo (HH:MM)</Text>
                <View style={styles.relogioDigital}>
                  <TextInput style={[styles.inputRelogio, { backgroundColor: c.bg, borderColor: c.borda, color: c.destaque }]} keyboardType="numeric" maxLength={2} value={minH} onChangeText={(v) => processarTempo(v, 48, setMinH)} />
                  <Text style={[styles.separadorRelogio, { color: c.textoPri }]}>:</Text>
                  <TextInput style={[styles.inputRelogio, { backgroundColor: c.bg, borderColor: c.borda, color: c.destaque }]} keyboardType="numeric" maxLength={2} value={minM} onChangeText={(v) => processarTempo(v, 59, setMinM)} />
                </View>
              </View>

              <View style={[styles.blocoTempo, { backgroundColor: c.inputBg, borderColor: c.borda }]}>
                <Text style={styles.labelTempo}>Tempo Máximo (HH:MM)</Text>
                <View style={styles.relogioDigital}>
                  <TextInput style={[styles.inputRelogio, { backgroundColor: c.bg, borderColor: c.borda, color: c.destaque }]} keyboardType="numeric" maxLength={2} value={maxH} onChangeText={(v) => processarTempo(v, 48, setMaxH)} />
                  <Text style={[styles.separadorRelogio, { color: c.textoPri }]}>:</Text>
                  <TextInput style={[styles.inputRelogio, { backgroundColor: c.bg, borderColor: c.borda, color: c.destaque }]} keyboardType="numeric" maxLength={2} value={maxM} onChangeText={(v) => processarTempo(v, 59, setMaxM)} />
                </View>
              </View>

              {aviso ? (
                <View style={[styles.caixaMensagem, { backgroundColor: tipoAviso === 'erro' ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2') : (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5'), borderLeftColor: tipoAviso === 'erro' ? '#EF4444' : '#10B981' }]}>
                  <Text style={[styles.textoMensagem, { color: tipoAviso === 'erro' ? (isDark ? '#FCA5A5' : '#B91C1C') : (isDark ? '#6EE7B7' : '#047857') }]}>{aviso}</Text>
                </View>
              ) : null}

              <TouchableOpacity style={styles.btnConfirmar} onPress={handleSalvarEdicao}><Text style={styles.txtConfirmar}>Salvar Alterações</Text></TouchableOpacity>
              <View style={{height: 20}} />
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, paddingHorizontal: 24, marginBottom: 16 },
  btnVoltar: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1 },
  titulo: { fontSize: 18, fontWeight: 'bold' },
  btnTema: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  areaFiltro: { maxHeight: 50, marginBottom: 16 },
  chipFiltro: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, marginRight: 8, height: 36, justifyContent: 'center' },
  cardRecurso: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  txtTipo: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  txtNome: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  txtDetalhe: { fontSize: 12 },
  btnAcao: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  
  modalOverlayAbsoluto: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.9)', zIndex: 1000, justifyContent: 'center', padding: 20 },
  modalContent: { width: '100%', borderRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }, 
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  btnFecharModal: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 }, 
  labelModal: { marginBottom: 8, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  inputModal: { borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, marginBottom: 20 },
  blocoTempo: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 }, 
  labelTempo: { color: '#0047AB', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  relogioDigital: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  inputRelogio: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', width: 70, height: 50, borderRadius: 8, borderWidth: 1 }, 
  separadorRelogio: { fontSize: 24, fontWeight: 'bold', marginHorizontal: 12 },
  caixaMensagem: { padding: 12, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4 }, 
  textoMensagem: { fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  btnConfirmar: { backgroundColor: '#0047AB', padding: 18, borderRadius: 12, alignItems: 'center' }, 
  txtConfirmar: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
});