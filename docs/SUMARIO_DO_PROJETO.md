# SP Engenharia 360° — Sumário Executivo & Documentação do Projeto

**Data de Conclusão da Etapa:** 11 de Agosto de 2026  
**Status do Projeto:** Base Unificada + Motor de Matching Multi-Critério + Ferramenta Web 100% Funcionais  

---

## 1. Visão Geral dos Arquivos & Entregas

Todos os arquivos estão salvos e organizados no diretório do projeto:

### 📊 Bases de Dados & Planilhas Unificadas
1. **[obras_sp_ecossistema_unificado_360.csv](file:///C:/Users/kbadmin/Documents/Projetos/SP%20Engenharia/obras_sp_ecossistema_unificado_360.csv)**  
   * **Planilha Mestre Unificada (5.938 obras $\times$ 95 colunas)** em `UTF-8 com BOM` (compatível com Excel).
   * Consolida: Obra, Escopo, CAPEX Real Ajustado, Decisores (Líder + Contatos 'Verde' com LinkedIn/Tel), Top Matches de Mão de Obra e Insumos, e Status B2B.
2. **[fornecedores_sp_matches_todos_obras_completo.csv](file:///C:/Users/kbadmin/Documents/Projetos/SP%20Engenharia/fornecedores_sp_matches_todos_obras_completo.csv)**  
   * **Base Relacional de Matches (47.504 linhas)** cruzando 100% das 5.938 obras com fornecedores de SP, pontuados de 0 a 100 com contatos e especialidades.
3. **[data/obras_data.json](file:///C:/Users/kbadmin/Documents/Projetos/SP%20Engenharia/data/obras_data.json)**  
   * Base JSON estruturada e otimizada que alimenta a ferramenta web no navegador.

### 🌐 Ferramenta Web Interativa (SP Engenharia 360°)
* **[index.html](file:///C:/Users/kbadmin/Documents/Projetos/SP%20Engenharia/index.html)** — Estrutura HTML5 moderna com 5 abas (KPIs, Explorador, Sweet Spot, Polos Regionais, Fornecedores).
* **[style.css](file:///C:/Users/kbadmin/Documents/Projetos/SP%20Engenharia/style.css)** — Design system *Dark Glassmorphism* responsivo com tipografia Inter/Outfit.
* **[app.js](file:///C:/Users/kbadmin/Documents/Projetos/SP%20Engenharia/app.js)** — Lógica client-side com busca instantânea, multi-filtros, paginação, gráficos Chart.js e modais de Dossiê da Obra.

---

## 2. Como Rodar a Aplicação Web a Qualquer Momento

Para reabrir ou executar a ferramenta web no futuro, basta executar no terminal:

```bash
cd "C:\Users\kbadmin\Documents\Projetos\SP Engenharia"
python -m http.server 8080
```

E acessar no navegador:  
👉 **http://localhost:8080/**

---

## 3. Resumo dos Números do Ecossistema (Pós-Enriquecimento)

* **Investimento Total Monitorado (CAPEX):** **R$ 1,031 Trilhões** em 5.930 obras válidas (mediana de R$ 1,80 Mi).
* **Universo de Obras:** **5.938 projetos** em 458 municípios de São Paulo.
* **Decisores Mapeados:** **5.549 obras (93,5% de cobertura)** com liderança executiva e técnica identificada.
* **Leads 'Verde' com Contato Direto:** **5.549 obras** com e-mail institucional/direto, telefone corporativo e URL de LinkedIn.
* **Catálogo de Fornecedores de SP:** **76.244 empresas** (13.159 de Insumos/Equipamentos e 63.085 de Mão de Obra/Serviços), somando R$ 6,06 Trilhões em capital social.
* **Matches Homologados & Pontuados:** **47.504 cruzamentos** com scores de 0 a 100 calculados por aderência técnica, logística, porte e contato.
* **Sweet Spot Comercial Ouro:** **5.549 oportunidades comerciais prontas** com alto score de match e canal de contato direto pronto para abordagem.

---

## 4. Arquivos Gerados & Atualizados

1. **[obras_sp_ecossistema_unificado_360.csv](file:///C:/Users/kbadmin/Documents/Projetos/SP%20Engenharia/obras_sp_ecossistema_unificado_360.csv)** — Base mestre unificada e 100% enriquecida.
2. **[obras_sp_para_enriquecimento_priorizado.csv](file:///C:/Users/kbadmin/Documents/Projetos/SP%20Engenharia/obras_sp_para_enriquecimento_priorizado.csv)** — Lista de monitoramento cadastral e gaps residuais.
3. **[data/obras_data.json](file:///C:/Users/kbadmin/Documents/Projetos/SP%20Engenharia/data/obras_data.json)** — Base JSON atualizada em tempo real para a ferramenta web.

