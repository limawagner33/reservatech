import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Keyboard, Platform, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRecursos } from '../../src/context/RecursosContext';


const categorias = [
  { id: 'SALA', nome: 'Sala de Reunião', imagem: require('../../assets/images/reuniao.png') },
  { id: 'EQUIPAMENTO', nome: 'Equipamentos', imagem: require('../../assets/images/equipamento.png') },
  { id: 'VEICULO', nome: 'Veículos', imagem: require('../../assets/images/veiculo.png') },
  { id: 'LABORATORIO', nome: 'Laboratórios', imagem: require('../../assets/images/lab.png') },
];

export default function AdminScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); 
  const { recursos, adicionarRecurso, tema, alternarTema } = useRecursos();

  // 👉 Lógica do Toast de Boas-vindas (do Login)
  const [toastLogin, setToastLogin] = useState(params.login === 'true');
  React.useEffect(() => {
    if (toastLogin) { setTimeout(() => setToastLogin(false), 2000); }
  }, [toastLogin]);

  const isDark = tema === 'dark';
  const c = {
    bg: isDark ? '#09090B' : '#FFFFFF',
    card: isDark ? '#18181B' : '#F8FAFC',
    textoPri: isDark ? '#FAFAFA' : '#171717',
    textoSec: isDark ? '#A1A1AA' : '#52525B',
    borda: isDark ? '#27272A' : '#E2E8F0',
    inputBg: isDark ? '#09090B' : '#FFFFFF',
    destaque: '#0047AB'
  };

  const [nome, setNome] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(categorias[0]); 
  const [modalCadastroVisivel, setModalCadastroVisivel] = useState(false);
  const [minH, setMinH] = useState(''); const [minM, setMinM] = useState('');
  const [maxH, setMaxH] = useState(''); const [maxM, setMaxM] = useState('');
  const [aviso, setAviso] = useState(''); const [tipoAviso, setTipoAviso] = useState<'erro' | 'sucesso' | ''>('');

  const abrirModalCadastro = (cat: any) => {
    setCategoriaSelecionada(cat); setNome(''); setMinH(''); setMinM(''); setMaxH(''); setMaxM(''); setAviso(''); setModalCadastroVisivel(true);
  };

  const getPlaceholderCategoria = (idCat: string) => {
    switch(idCat) {
      case 'SALA': return 'Ex: Sala Maker';
      case 'EQUIPAMENTO': return 'Ex: Projetor Epson';
      case 'VEICULO': return 'Ex: Fiat Uno';
      case 'LABORATORIO': return 'Ex: Lab de Redes';
      default: return 'Ex: Nome do recurso';
    }
  };

  const processarTempo = (valor: string, max: number, setValor: (v: string) => void) => {
    const numStr = valor.replace(/[^0-9]/g, ''); if (numStr === '') { setValor(''); return; }
    const num = parseInt(numStr, 10); if (num > max) setValor(max.toString().padStart(2, '0')); else setValor(numStr);
  };

  const handleCadastrarRecurso = () => {
    Keyboard.dismiss(); setAviso(''); setTipoAviso('');
    if (!nome.trim() || !minH || !minM || !maxH || !maxM) { setTipoAviso('erro'); setAviso('QA: Preencha todos os campos.'); return; }

    // 👉 AQUI ENTRA A TRAVA DE QA NA CRIAÇÃO!
    // Ele olha o banco de dados inteiro e bloqueia se achar o mesmo nome.
    const nomeJaExiste = recursos.some(r => r.nome.toLowerCase().trim() === nome.toLowerCase().trim());
    if (nomeJaExiste) {
      setTipoAviso('erro'); setAviso('QA Block: Já existe uma infraestrutura cadastrada com este nome.'); return;
    }

    const minDecimal = parseInt(minH) + (parseInt(minM) / 60);
    const maxDecimal = parseInt(maxH) + (parseInt(maxM) / 60);
    if (minDecimal >= maxDecimal) { setTipoAviso('erro'); setAviso('QA: Mínimo maior/igual ao Máximo.'); return; }

    adicionarRecurso({ nome: nome.trim(), tipo: categoriaSelecionada.id, minHoras: minDecimal, maxHoras: maxDecimal });
    setTipoAviso('sucesso'); setAviso(`SUCESSO: ${nome} cadastrado.`);
    setTimeout(() => { setModalCadastroVisivel(false); }, 1500);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      
      {toastLogin && (
        <View style={styles.toastSucesso}>
          <Text style={styles.txtToastSucesso}>✓ Login Bem-Sucedido</Text>
        </View>
      )}

      <View style={styles.headerAdmin}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity style={[styles.btnSairHeader, { borderColor: c.borda, backgroundColor: isDark ? '#18181B' : '#F8FAFC' }]} onPress={() => router.replace('/')}>
            <Text style={styles.txtSairHeader}>Sair</Text>
          </TouchableOpacity>
          <Text style={[styles.txtOlaAdmin, { color: c.textoPri }]}>Olá, usuário</Text>
        </View>
        <TouchableOpacity onPress={alternarTema} style={[styles.btnTema, { backgroundColor: isDark ? '#18181B' : '#F8FAFC', borderColor: c.borda }]}>
          <Text style={{ fontSize: 16 }}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{flex: 1}} contentContainerStyle={{paddingBottom: 40}}>
        <Text style={[styles.txtPerguntaAdmin, { color: c.textoPri }]}>Qual a categoria da Infraestrutura?</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carrosselCategorias} contentContainerStyle={{paddingRight: 24}}>
          {categorias.map(cat => (
            <TouchableOpacity key={cat.id} style={styles.cardCategoriaAdmin} onPress={() => abrirModalCadastro(cat)} activeOpacity={0.8}>
              <Image source={cat.imagem} style={styles.imgCategoriaAdmin} />
              <Text style={styles.nomeCategoriaAdmin}>{cat.nome}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.rowEntreAdmin}>
          <Text style={[styles.txtCadastradasAdmin, { color: c.textoPri }]}>Infraestruturas cadastradas</Text>
          <TouchableOpacity onPress={() => router.push('/admin-lista')}><Text style={styles.txtVerTodasAdmin}>Ver todas {'>'}</Text></TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carrosselCadastradas} contentContainerStyle={{paddingRight: 24}}>
          {recursos.length === 0 ? <Text style={[styles.textoVazioAdmin, { color: c.textoSec }]}>Nenhuma cadastrada.</Text> : recursos.slice(-5).map(r => (
            <View key={r.id} style={[styles.cardCadastradaAdmin, { backgroundColor: c.card, borderColor: c.borda }]}>
              <Text style={styles.tipoCadastrada}>{r.tipo}</Text>
              <Text style={[styles.nomeCadastradaAdmin, { color: c.textoPri }]}>{r.nome}</Text>
            </View>
          ))}
        </ScrollView>
      </ScrollView>

      {modalCadastroVisivel && (
        <View style={styles.modalOverlayAdminAbsoluto}>
          <View style={[styles.modalContentAdmin, { backgroundColor: c.bg, borderColor: c.borda, borderWidth: 1 }]}>
            <View style={styles.modalHeaderAdmin}>
              <Text style={[styles.modalTitleAdmin, { color: c.textoPri }]}>Novo: {categoriaSelecionada.nome}</Text>
              <TouchableOpacity onPress={() => setModalCadastroVisivel(false)} style={[styles.btnFecharModalAdmin, { backgroundColor: c.inputBg, borderColor: c.borda }]}>
                <Text style={{ color: c.textoPri, fontWeight: 'bold' }}>X</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.labelModalAdmin, { color: c.textoSec }]}>Nome do Recurso</Text>
              <TextInput 
                style={[styles.inputModalAdmin, { backgroundColor: c.inputBg, color: c.textoPri, borderColor: c.borda }]} 
                placeholder={getPlaceholderCategoria(categoriaSelecionada.id)} 
                placeholderTextColor={c.textoSec} 
                value={nome} 
                onChangeText={setNome} 
              />
              
              <View style={[styles.blocoTempoAdmin, { backgroundColor: c.inputBg, borderColor: c.borda }]}>
                <Text style={styles.labelTempoAdmin}>Tempo Mínimo (HH:MM)</Text>
                <View style={styles.relogioDigitalAdmin}>
                  <TextInput style={[styles.inputRelogioAdmin, { backgroundColor: c.bg, borderColor: c.borda, color: c.destaque }]} placeholder="00" placeholderTextColor={c.textoSec} keyboardType="numeric" maxLength={2} value={minH} onChangeText={(v) => processarTempo(v, 48, setMinH)} />
                  <Text style={[styles.separadorRelogioAdmin, { color: c.textoPri }]}>:</Text>
                  <TextInput style={[styles.inputRelogioAdmin, { backgroundColor: c.bg, borderColor: c.borda, color: c.destaque }]} placeholder="00" placeholderTextColor={c.textoSec} keyboardType="numeric" maxLength={2} value={minM} onChangeText={(v) => processarTempo(v, 59, setMinM)} />
                </View>
              </View>

              <View style={[styles.blocoTempoAdmin, { backgroundColor: c.inputBg, borderColor: c.borda }]}>
                <Text style={styles.labelTempoAdmin}>Tempo Máximo (HH:MM)</Text>
                <View style={styles.relogioDigitalAdmin}>
                  <TextInput style={[styles.inputRelogioAdmin, { backgroundColor: c.bg, borderColor: c.borda, color: c.destaque }]} placeholder="00" placeholderTextColor={c.textoSec} keyboardType="numeric" maxLength={2} value={maxH} onChangeText={(v) => processarTempo(v, 48, setMaxH)} />
                  <Text style={[styles.separadorRelogioAdmin, { color: c.textoPri }]}>:</Text>
                  <TextInput style={[styles.inputRelogioAdmin, { backgroundColor: c.bg, borderColor: c.borda, color: c.destaque }]} placeholder="00" placeholderTextColor={c.textoSec} keyboardType="numeric" maxLength={2} value={maxM} onChangeText={(v) => processarTempo(v, 59, setMaxM)} />
                </View>
              </View>

              {aviso ? (
                <View style={[styles.caixaMensagemAdmin, { backgroundColor: tipoAviso === 'erro' ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2') : (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5'), borderLeftColor: tipoAviso === 'erro' ? '#EF4444' : '#10B981' }]}>
                  <Text style={[styles.textoMensagemAdmin, { color: tipoAviso === 'erro' ? (isDark ? '#FCA5A5' : '#B91C1C') : (isDark ? '#6EE7B7' : '#047857') }]}>{aviso}</Text>
                </View>
              ) : null}

              <TouchableOpacity style={styles.btnConfirmarAdmin} onPress={handleCadastrarRecurso}><Text style={styles.txtConfirmarAdmin}>Registrar</Text></TouchableOpacity>
              <View style={{height: 20}} />
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  toastSucesso: { position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: '#ECFDF5', borderColor: '#10B981', borderWidth: 1, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, zIndex: 9999 },
  txtToastSucesso: { color: '#047857', fontSize: 14, fontWeight: 'bold' },
  headerAdmin: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 24 },
  btnSairHeader: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1 },
  txtSairHeader: { color: '#EF4444', fontSize: 12, fontWeight: 'bold' },
  txtOlaAdmin: { fontSize: 24, fontWeight: 'bold' },
  btnTema: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  txtPerguntaAdmin: { fontSize: 16, fontWeight: '500', marginBottom: 24 },
  carrosselCategorias: { marginBottom: 32 },
  cardCategoriaAdmin: { width: 140, height: 180, backgroundColor: '#0047AB', borderRadius: 20, padding: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16, shadowColor: '#0047AB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  imgCategoriaAdmin: { width: 80, height: 80, borderRadius: 40, marginBottom: 16, backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: '#FFFFFF' },
  nomeCategoriaAdmin: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 4 },
  rowEntreAdmin: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  txtCadastradasAdmin: { fontSize: 16, fontWeight: 'bold' },
  txtVerTodasAdmin: { color: '#0047AB', fontSize: 12, fontWeight: 'bold' },
  carrosselCadastradas: { paddingVertical: 10 },
  cardCadastradaAdmin: { width: 160, padding: 20, borderRadius: 16, marginRight: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  tipoCadastrada: { fontSize: 10, color: '#0047AB', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 },
  nomeCadastradaAdmin: { fontSize: 14, fontWeight: '600' },
  textoVazioAdmin: { fontSize: 12 },
  modalOverlayAdminAbsoluto: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.9)', zIndex: 1000, justifyContent: 'center', padding: 20 },
  modalContentAdmin: { width: '100%', borderRadius: 24, padding: 24 },
  modalHeaderAdmin: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }, 
  modalTitleAdmin: { fontSize: 18, fontWeight: 'bold' },
  btnFecharModalAdmin: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 }, 
  labelModalAdmin: { marginBottom: 8, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  inputModalAdmin: { borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, marginBottom: 20 },
  blocoTempoAdmin: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 }, 
  labelTempoAdmin: { color: '#0047AB', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  relogioDigitalAdmin: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  inputRelogioAdmin: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', width: 70, height: 50, borderRadius: 8, borderWidth: 1 }, 
  separadorRelogioAdmin: { fontSize: 24, fontWeight: 'bold', marginHorizontal: 12 },
  caixaMensagemAdmin: { padding: 12, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4 }, 
  textoMensagemAdmin: { fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  btnConfirmarAdmin: { backgroundColor: '#0047AB', padding: 18, borderRadius: 12, alignItems: 'center' }, 
  txtConfirmarAdmin: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
});