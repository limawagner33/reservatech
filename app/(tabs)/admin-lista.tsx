import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecursos } from '../../src/context/RecursosContext';

// As mesmas categorias para o filtro
const categoriasFiltro = [
  { id: 'SALA', nome: 'Salas' },
  { id: 'EQUIPAMENTO', nome: 'Equipamentos' },
  { id: 'VEICULO', nome: 'Veículos' },
  { id: 'LABORATORIO', nome: 'Laboratórios' },
];

export default function AdminListaScreen() {
  const router = useRouter();
  const { recursos, excluirRecurso, tema, alternarTema } = useRecursos();
  
  // ESTADO DO FILTRO
  const [filtroAtivo, setFiltroAtivo] = useState<string | null>(null);

  const isDark = tema === 'dark';
  const c = {
    bg: isDark ? '#09090B' : '#FFFFFF',
    card: isDark ? '#18181B' : '#F8FAFC',
    textoPri: isDark ? '#FAFAFA' : '#171717',
    textoSec: isDark ? '#A1A1AA' : '#52525B',
    borda: isDark ? '#27272A' : '#E2E8F0',
    destaque: '#0047AB',
    perigo: isDark ? '#EF4444' : '#DC2626'
  };

  // pega a lista inteira e filtra apenas se o usuário tiver clicado em alguma categoria
  const recursosVisiveis = filtroAtivo ? recursos.filter(r => r.tipo === filtroAtivo) : recursos;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.btnVoltar, { borderColor: c.borda, backgroundColor: c.card }]} onPress={() => router.back()}>
          <Text style={{ color: c.textoPri, fontWeight: 'bold' }}>{'< Voltar'}</Text>
        </TouchableOpacity>
        <Text style={[styles.titulo, { color: c.textoPri }]}>Gestão de Recursos</Text>
        <TouchableOpacity onPress={alternarTema} style={[styles.btnTema, { backgroundColor: c.card, borderColor: c.borda }]}>
          <Text style={{ fontSize: 16 }}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* O NOVO FILTRO DE CATEGORIAS AQUI */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.areaFiltro} contentContainerStyle={{ paddingRight: 24, paddingLeft: 24 }}>
        <TouchableOpacity 
          style={[styles.chipFiltro, { backgroundColor: filtroAtivo === null ? c.destaque : c.card, borderColor: filtroAtivo === null ? c.destaque : c.borda }]} 
          onPress={() => setFiltroAtivo(null)}>
          <Text style={{ color: filtroAtivo === null ? '#FFF' : c.textoSec, fontSize: 12, fontWeight: 'bold' }}>Todos</Text>
        </TouchableOpacity>
        
        {categoriasFiltro.map(cat => (
          <TouchableOpacity 
            key={cat.id} 
            style={[styles.chipFiltro, { backgroundColor: filtroAtivo === cat.id ? c.destaque : c.card, borderColor: filtroAtivo === cat.id ? c.destaque : c.borda }]} 
            onPress={() => setFiltroAtivo(cat.id)}>
            <Text style={{ color: filtroAtivo === cat.id ? '#FFF' : c.textoSec, fontSize: 12, fontWeight: 'bold' }}>{cat.nome}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* LISTA DE RECURSOS FILTRADOS */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        {recursosVisiveis.length === 0 ? (
          <Text style={{ color: c.textoSec, textAlign: 'center', marginTop: 40 }}>Nenhum recurso encontrado nessa categoria.</Text>
        ) : (
          recursosVisiveis.map(recurso => (
            <View key={recurso.id} style={[styles.cardRecurso, { backgroundColor: c.card, borderColor: c.borda }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.txtTipo, { color: c.destaque }]}>{recurso.tipo}</Text>
                <Text style={[styles.txtNome, { color: c.textoPri }]}>{recurso.nome}</Text>
                <Text style={[styles.txtDetalhe, { color: c.textoSec }]}>Limites: {recurso.minHoras}h a {recurso.maxHoras}h</Text>
              </View>
              
              <TouchableOpacity style={[styles.btnExcluir, { borderColor: c.perigo }]} onPress={() => {
                if (Platform.OS === 'web') {
                  if (window.confirm(`Tem certeza que deseja excluir ${recurso.nome}?`)) excluirRecurso(recurso.id);
                } else {
                  excluirRecurso(recurso.id);
                }
              }}>
                <Text style={{ color: c.perigo, fontWeight: 'bold', fontSize: 12 }}>Excluir</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
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
  btnExcluir: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, marginLeft: 16 }
});