# 📄 Product Requirements Document (PRD) - ElectroLoulé Workshop Timer

## 1. Visão Geral do Projeto
O **ElectroLoulé Workshop Timer** é uma Progressive Web App (PWA) de alta performance desenhada especificamente para mecânicos. O objetivo principal é automatizar o registo de tempos de reparação por veículo, eliminando a burocracia manual e garantindo uma faturação precisa das horas de mão-de-obra.

## 2. O Problema (Contexto)
*   **Ineficiência Operacional:** O registo manual de matrículas e tempos em papel ou sistemas complexos consome tempo produtivo.
*   **Imprecisão de Dados:** Esquecimentos em pausar ou finalizar cronómetros levavam a perdas financeiras ou cobranças indevidas.
*   **Barreira Tecnológica:** Softwares de gestão de oficina costumam ser complexos para uso rápido "no chão" da oficina com mãos sujas ou ocupadas.

## 3. A Solução
Uma interface móvel minimalista e ultra-rápida que utiliza **Inteligência Artificial (IA)** para ler matrículas e gerir cronómetros inteligentes com um único toque.

---

## 4. Requisitos Funcionais (Core Features)

### 4.1. Gestão de Identidade (Multi-User)
*   **Ecrã de Boas-Vindas Obrigatório:** Ao iniciar a app, o utilizador deve obrigatoriamente selecionar o seu nome de uma lista pré-definida.
*   **Sessão Ativa:** A app não faz login automático para permitir que múltiplos mecânicos usem o mesmo dispositivo (tablet/telemóvel da oficina) sem misturar registos.

### 4.2. Captura Inteligente (AI Scanner)
*   **Scanner Gemini Pro:** Integração com a API Gemini 3 Flash para extração de texto de imagens.
*   **Mecanismo de Mira:** Overlay visual para alinhar a matrícula, garantindo fotos de alta qualidade para a IA.
*   **Deteção Automática:** A app tenta detetar a matrícula automaticamente a cada 3.5 segundos enquanto a câmara está aberta.

### 4.3. Painel de Controlo (Dashboard)
*   **Estatísticas Rápidas:** Exibição do número total de veículos trabalhados no dia e o somatório de horas acumuladas.
*   **Cronómetros em Tempo Real:** Listagem de veículos em curso com atualização de segundos ao vivo.
*   **Estados de Trabalho:** Suporte para estados `Ativo`, `Pausado` (tempo não contabilizado) e `Concluído`.

### 4.4. Histórico e Auditoria
*   **Registo Visual:** Cada trabalho iniciado via scanner guarda uma fotografia da matrícula para fins de prova e auditoria.
*   **Edição de Dados:** Possibilidade de apagar registos incorretos e visualizar o tempo total gasto em cada intervenção.

---

## 5. Requisitos de UI/UX (Design & Estética)

### 5.1. Filosofia de Design "No-Scroll"
*   **Acesso Imediato:** O Dashboard foi otimizado para que as funções críticas (estatísticas e botão de inserção manual) estejam visíveis acima da "dobra" do ecrã, eliminando a necessidade de scroll em ecrãs de smartphones comuns.
*   **Hierarquia Visual:** Uso de fontes "Black" (pesadas) e maiúsculas para facilitar a leitura em ambientes de oficina com reflexos de luz.

### 5.2. Paleta de Cores e Tipografia
*   **Fundo:** `Slate-950` (Dark Mode profundo).
*   **Destaque:** `Yellow-500` (Amarelo industrial para botões de ação e branding).
*   **Estados:** Verde para progresso e Laranja para pausas.

---

## 6. Stack Tecnológica
*   **Frontend:** React 19 com TypeScript.
*   **Estilização:** Tailwind CSS (Utility-first).
*   **Ícones:** Lucide React.
*   **Motor de IA:** Google Gemini API (`gemini-3-flash-preview`).
*   **Persistência:** LocalStorage (Offline-first).

---

## 7. Roadmap Futuro (Próximos Passos)
*   **Sincronização Cloud:** Exportação automática dos tempos para um Google Sheets ou base de dados centralizada.
*   **Relatórios Semanais:** Envio de resumo de produtividade por email para a gerência.
*   **Reconhecimento de Marca/Modelo:** Identificação automática do modelo do carro via IA.
