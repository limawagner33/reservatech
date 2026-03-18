import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Keyboard, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecursos } from '../../src/context/RecursosContext';

// Categorias usando URLs da web para não quebrar o build na Vercel
const categorias = [
  { id: 'SALA', nome: 'Sala de Reunião', imagem: { uri: 'https://cdn-icons-png.flaticon.com/512/2942/2942933.png' } },
  { id: 'EQUIPAMENTO', nome: 'Equipamentos', imagem: { uri: 'https://cdn-icons-png.flaticon.com/512/3004/3004100.png' } },
  { id: 'VEICULO', nome: 'Veículos', imagem: { uri: 'https://cdn-icons-png.flaticon.com/512/2962/2962303.png' } },
  { id: 'LABORATORIO', nome: 'Laboratórios', imagem: { uri: 'https://cdn-icons-png.flaticon.com/512/933/933042.png' } },
];

export default function AdminScreen() {
  const router = useRouter();
  const { recursos, adicionarRecurso } = useRecursos();

  const [nome, setNome] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(categorias[0]); 
  const [modalCadastroVisivel, setModalCadastroVisivel] = useState(false);
  const [minH, setMinH] = useState(''); const [minM, setMinM] = useState('');
  const [maxH, setMaxH] = useState(''); const [maxM, setMaxM] = useState('');
  const [aviso, setAviso] = useState(''); const [tipoAviso, setTipoAviso] = useState<'erro' | 'sucesso' | ''>('');

  const abrirModalCadastro = (cat: any) => {
    setCategoriaSelecionada(cat); setNome(''); setMinH(''); setMinM(''); setMaxH(''); setMaxM(''); setAviso(''); setModalCadastroVisivel(true);
  };

  const processarTempo = (valor: string, max: number, setValor: (v: string) => void) => {
    const numStr = valor.replace(/[^0-9]/g, ''); if (numStr === '') { setValor(''); return; }
    const num = parseInt(numStr, 10); if (num > max) setValor(max.toString().padStart(2, '0')); else setValor(numStr);
  };

  const handleCadastrarRecurso = () => {
    Keyboard.dismiss(); setAviso(''); setTipoAviso('');
    if (!nome.trim() || !minH || !minM || !maxH || !maxM) { setTipoAviso('erro'); setAviso('QA: Preencha todos os campos.'); return; }

    const minDecimal = parseInt(minH) + (parseInt(minM) / 60);
    const maxDecimal = parseInt(maxH) + (parseInt(maxM) / 60);
    if (minDecimal >= maxDecimal) { setTipoAviso('erro'); setAviso('QA: Mínimo maior/igual ao Máximo.'); return; }

    adicionarRecurso({ nome, tipo: categoriaSelecionada.id, minHoras: minDecimal, maxHoras: maxDecimal });
    setTipoAviso('sucesso'); setAviso(`SUCESSO: ${nome} cadastrado.`);
    setTimeout(() => { setModalCadastroVisivel(false); }, 1500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerAdmin}>
        <TouchableOpacity style={styles.btnSairHeader} onPress={() => router.replace('/')}><Text style={styles.txtSairHeader}>Sair</Text></TouchableOpacity>
        <Text style={styles.txtOlaAdmin}>Olá, usuário</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{flex: 1}} contentContainerStyle={{paddingBottom: 40}}>
        <Text style={styles.txtPerguntaAdmin}>Qual a categoria da Infraestrutura?</Text>
        
        {/* CARROSSEL DE CADASTRO (Rolagem Horizontal) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carrosselCategorias} contentContainerStyle={{paddingRight: 24}}>
          {categorias.map(cat => (
            <TouchableOpacity key={cat.id} style={styles.cardCategoriaAdmin} onPress={() => abrirModalCadastro(cat)} activeOpacity={0.8}>
              <Image source={cat.imagem} style={styles.imgCategoriaAdmin} />
              <Text style={styles.nomeCategoriaAdmin}>{cat.nome}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.rowEntreAdmin}>
          <Text style={styles.txtCadastradasAdmin}>Infraestruturas cadastradas</Text>
          <TouchableOpacity onPress={() => router.push('/admin-lista')}><Text style={styles.txtVerTodasAdmin}>Ver todas {'>'}</Text></TouchableOpacity>
        </View>
        
        {/* CARROSSEL DE CADASTRADAS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carrosselCadastradas} contentContainerStyle={{paddingRight: 24}}>
          {recursos.length === 0 ? <Text style={styles.textoVazioAdmin}>Nenhuma cadastrada.</Text> : recursos.slice(-5).map(r => (
            <View key={r.id} style={styles.cardCadastradaAdmin}>
              <Text style={styles.tipoCadastrada}>{r.tipo}</Text>
              <Text style={styles.nomeCadastradaAdmin}>{r.nome}</Text>
            </View>
          ))}
        </ScrollView>
      </ScrollView>

      {/* MODAL SOBREPOSTO DE CADASTRO */}
      {modalCadastroVisivel && (
        <View style={styles.modalOverlayAdminAbsoluto}>
          <View style={styles.modalContentAdmin}>
            <View style={styles.modalHeaderAdmin}>
              <Text style={styles.modalTitleAdmin}>Novo: {categoriaSelecionada.nome}</Text>
              <TouchableOpacity onPress={() => setModalCadastroVisivel(false)} style={styles.btnFecharModalAdmin}><Text style={styles.txtFecharModalAdmin}>X</Text></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.labelModalAdmin}>Nome do Recurso</Text>
              <TextInput style={styles.inputModalAdmin} placeholder="Ex: Sala Maker" placeholderTextColor="#A1A1AA" value={nome} onChangeText={setNome} />
              <View style={styles.blocoTempoAdmin}>
                <Text style={styles.labelTempoAdmin}>Tempo Mínimo (HH:MM)</Text>
                <View style={styles.relogioDigitalAdmin}>
                  <TextInput style={styles.inputRelogioAdmin} placeholder="00" placeholderTextColor="#A1A1AA" keyboardType="numeric" maxLength={2} value={minH} onChangeText={(v) => processarTempo(v, 48, setMinH)} />
                  <Text style={styles.separadorRelogioAdmin}>:</Text>
                  <TextInput style={styles.inputRelogioAdmin} placeholder="00" placeholderTextColor="#A1A1AA" keyboardType="numeric" maxLength={2} value={minM} onChangeText={(v) => processarTempo(v, 59, setMinM)} />
                </View>
              </View>
              <View style={styles.blocoTempoAdmin}>
                <Text style={styles.labelTempoAdmin}>Tempo Máximo (HH:MM)</Text>
                <View style={styles.relogioDigitalAdmin}>
                  <TextInput style={styles.inputRelogioAdmin} placeholder="00" placeholderTextColor="#A1A1AA" keyboardType="numeric" maxLength={2} value={maxH} onChangeText={(v) => processarTempo(v, 48, setMaxH)} />
                  <Text style={styles.separadorRelogioAdmin}>:</Text>
                  <TextInput style={styles.inputRelogioAdmin} placeholder="00" placeholderTextColor="#A1A1AA" keyboardType="numeric" maxLength={2} value={maxM} onChangeText={(v) => processarTempo(v, 59, setMaxM)} />
                </View>
              </View>
              {aviso ? <View style={[styles.caixaMensagemAdmin, tipoAviso === 'erro' ? styles.caixaErroAdmin : styles.caixaSucessoAdmin]}><Text style={styles.textoMensagemAdmin}>{aviso}</Text></View> : null}
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
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 24 },
  headerAdmin: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 24 },
  btnSairHeader: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  txtSairHeader: { color: '#EF4444', fontSize: 12, fontWeight: 'bold' },
  txtOlaAdmin: { fontSize: 24, fontWeight: 'bold', color: '#171717' },
  txtPerguntaAdmin: { fontSize: 16, color: '#171717', fontWeight: '500', marginBottom: 24 },
  carrosselCategorias: { marginBottom: 32 },
  cardCategoriaAdmin: { width: 140, height: 180, backgroundColor: '#0047AB', borderRadius: 20, padding: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16, shadowColor: '#0047AB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  imgCategoriaAdmin: { width: 80, height: 80, borderRadius: 40, marginBottom: 16, backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: '#FFFFFF' },
  nomeCategoriaAdmin: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 4 },
  rowEntreAdmin: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  txtCadastradasAdmin: { fontSize: 16, color: '#171717', fontWeight: 'bold' },
  txtVerTodasAdmin: { color: '#0047AB', fontSize: 12, fontWeight: 'bold' },
  carrosselCadastradas: { paddingVertical: 10 },
  cardCadastradaAdmin: { width: 160, backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, marginRight: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  tipoCadastrada: { fontSize: 10, color: '#0047AB', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 },
  nomeCadastradaAdmin: { fontSize: 14, color: '#171717', fontWeight: '600' },
  textoVazioAdmin: { color: '#A1A1AA', fontSize: 12 },
  modalOverlayAdminAbsoluto: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.9)', zIndex: 1000, justifyContent: 'center', padding: 20 },
  modalContentAdmin: { backgroundColor: '#FFFFFF', width: '100%', borderRadius: 24, padding: 24 },
  modalHeaderAdmin: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }, modalTitleAdmin: { fontSize: 18, fontWeight: 'bold', color: '#171717' },
  btnFecharModalAdmin: { backgroundColor: '#F8FAFC', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }, txtFecharModalAdmin: { color: '#171717', fontWeight: 'bold' },
  labelModalAdmin: { color: '#52525B', marginBottom: 8, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  inputModalAdmin: { backgroundColor: '#F8FAFC', color: '#171717', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  blocoTempoAdmin: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 }, labelTempoAdmin: { color: '#0047AB', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  relogioDigitalAdmin: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  inputRelogioAdmin: { backgroundColor: '#FFFFFF', color: '#0047AB', fontSize: 24, fontWeight: 'bold', textAlign: 'center', width: 70, height: 50, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1' }, separadorRelogioAdmin: { color: '#171717', fontSize: 24, fontWeight: 'bold', marginHorizontal: 12 },
  caixaMensagemAdmin: { padding: 12, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4 }, textoMensagemAdmin: { fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  caixaErroAdmin: { backgroundColor: '#FEF2F2', borderLeftColor: '#EF4444' }, caixaSucessoAdmin: { backgroundColor: '#ECFDF5', borderLeftColor: '#10B981' },
  btnConfirmarAdmin: { backgroundColor: '#0047AB', padding: 18, borderRadius: 12, alignItems: 'center' }, txtConfirmarAdmin: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
});