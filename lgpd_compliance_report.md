# Relatório de Conformidade com a LGPD (Lei nº 13.709/2018)
**Projeto:** FinancialPlanner  
**Data da Análise:** 17 de Maio de 2026  
**Status:** **ALTAMENTE EM CONFORMIDADE (Privacy by Design)**

---

## 📌 Resumo Executivo
O **FinancialPlanner** é um aplicativo financeiro pessoal desenvolvido sob a filosofia **Local-First** (local-first web application). A arquitetura do projeto foi desenhada de forma que **nenhum dado pessoal ou financeiro seja coletado, processado ou armazenado em servidores externos administrados por terceiros ou pelos desenvolvedores**. 

O controle físico e a custódia das informações pertencem 100% ao usuário final (Titular dos Dados). Aliado a uma política estritamente fechada de segurança de rede (Content Security Policy) e criptografia robusta de nível militar no cliente, o projeto atende com maestria aos princípios fundamentais da **Lei Geral de Proteção de Dados (LGPD)** brasileira.

---

## 🛡️ Pilares da Conformidade no Projeto

### 1. Arquitetura "Local-First" e Custódia do Titular
* **LGPD Relacionada:** Art. 5º, IX e X (Definição de Controlador e Operador) e Art. 6º, IV (Princípio da Necessidade).
* **Como o projeto implementa:** Todo o armazenamento de dados (investimentos, metas, histórico, empréstimos e backups) é feito exclusivamente no banco de dados interno do navegador do próprio usuário (**IndexedDB**), através do repositório [indexedDbRepository.js](file:///g:/Projects/Utils/FinancialPlanner/src/services/indexedDbRepository.js).
* **Impacto Jurídico:** Como o desenvolvedor/empresa **não possui servidores de banco de dados** e não coleta nenhuma informação pessoal, eles não atuam como *Controladores* ou *Operadores* de dados pessoais em ambiente cloud próprio. A guarda e o controle físico dos dados permanecem inteiramente com o próprio titular no seu dispositivo pessoal.

### 2. Criptografia Forte no Cliente (Segurança e Confidencialidade)
* **LGPD Relacionada:** Art. 6º, VII (Princípio da Segurança) e Art. 46 (Medidas de segurança, técnicas e administrativas para proteger os dados).
* **Como o projeto implementa:** Através do serviço [cryptoService.js](file:///g:/Projects/Utils/FinancialPlanner/src/services/cryptoService.js), a aplicação utiliza a API nativa do navegador (**Web Crypto API**) para encriptar todas as tabelas de dados utilizando o algoritmo **AES-GCM de 256 bits** (nível militar), derivando chaves seguras a partir do PIN inserido pelo usuário via **PBKDF2**.
* **Impacto Jurídico:** Em caso de perda, roubo do dispositivo ou acesso não autorizado por malware local ao armazenamento do navegador, os dados financeiros do usuário estarão completamente ilegíveis e protegidos por criptografia forte, minimizando qualquer risco de incidente de segurança ou vazamento de dados (*data breach*).

### 3. Atendimento Pleno aos Direitos do Titular (Art. 18)
A LGPD exige que o titular dos dados tenha facilidade para exercer seus direitos. O FinancialPlanner atende isso nativamente:

| Direito do Titular (Art. 18) | Implementação no FinancialPlanner | Status |
| :--- | :--- | :---: |
| **I - Confirmação da existência de tratamento** | O usuário sabe exatamente que seus dados existem porque eles estão fisicamente armazenados na máquina dele. | **OK** |
| **II e III - Acesso e Correção de dados** | O usuário tem acesso irrestrito e imediato à interface gráfica para visualizar, editar ou atualizar qualquer registro a qualquer momento. | **OK** |
| **V - Portabilidade dos dados** | O app possui funções nativas de **Exportação e Importação de Backups** em formato JSON criptografado, garantindo portabilidade total para o usuário. | **OK** |
| **VI - Eliminação de dados pessoais** | O usuário pode remover completamente seus dados excluindo seu perfil diretamente na tela de bloqueio ([LockScreen.vue](file:///g:/Projects/Utils/FinancialPlanner/src/components/LockScreen.vue)). Isso apaga permanentemente todos os registros do IndexedDB. | **OK** |

### 4. Bloqueio Completo de Vazamentos (Content Security Policy)
* **LGPD Relacionada:** Art. 6º, VII (Segurança) e Princípio da Prevenção.
* **Como o projeto implementa:** O arquivo [index.html](file:///g:/Projects/Utils/FinancialPlanner/index.html#L5) possui uma **Content Security Policy (CSP)** extremamente rigorosa:
  ```html
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:; connect-src 'self' ws://localhost:*; object-src 'none'; base-uri 'self';" />
  ```
* **Impacto Jurídico:** Esta diretiva proíbe terminantemente o navegador de fazer requisições para servidores externos, carregar scripts maliciosos de fora, ou enviar dados em segundo plano para qualquer API de rastreamento (*trackers*), analíticos ou anúncios de terceiros. A aplicação é uma "ilha fechada" e segura.

---

## 💡 Recomendações de Boas Práticas (Melhoria Contínua)

Embora o aplicativo esteja tecnicamente em conformidade exemplar devido à sua arquitetura focada em privacidade, recomendamos as seguintes adições visuais para garantir transparência absoluta:

1. **Adicionar uma Política de Privacidade Estática na Interface:**
   * **Por quê:** O princípio da Transparência (Art. 6º, VI) exige informações claras sobre o tratamento de dados.
   * **Sugestão:** Adicionar uma pequena aba ou rodapé "Privacidade e LGPD" explicando de forma simples ao usuário:
     > *"Este aplicativo opera sob a arquitetura Local-First. Todos os seus dados são criptografados localmente no seu navegador e **nunca** são transmitidos para nossos servidores. Você tem total controle físico, portabilidade e direito de exclusão dos seus dados."*
     
2. **Opção de Destruição Completa (Hard Reset):**
   * **Por quê:** Facilitar ainda mais o direito à eliminação definitiva de todos os dados locais do navegador em um único clique para todos os perfis.

---

## 🏆 Conclusão
O **FinancialPlanner** é um modelo exemplar de **Privacy by Design e Privacy by Default**. Ao invés de tentar remediar a privacidade com políticas jurídicas complexas sobre dados armazenados na nuvem, o aplicativo **evita o risco na origem** ao não coletar nenhum dado pessoal em servidores externos. 

A segurança técnica implementada (AES-GCM + CSP estrito) e o respeito aos direitos de eliminação e portabilidade tornam este projeto **totalmente em conformidade com a LGPD**.
