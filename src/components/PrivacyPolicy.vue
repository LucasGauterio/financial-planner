<template>
  <div class="card privacy-policy-container">
    <div class="privacy-header">
      <div class="shield-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      </div>
      <div>
        <h2 class="section-title">
          {{ locale === 'pt-BR' ? 'Política de Privacidade & LGPD' : 'Privacy Policy & LGPD' }}
        </h2>
        <p class="section-subtitle">
          {{ locale === 'pt-BR' ? 'Entenda como sua privacidade é protegida e por que seus dados estão 100% seguros.' : 'Understand how your privacy is protected and why your data is 100% secure.' }}
        </p>
      </div>
    </div>

    <!-- Status Banner -->
    <div class="status-banner">
      <div class="status-badge">
        <span class="pulse-dot"></span>
        <strong>STATUS:</strong> {{ locale === 'pt-BR' ? 'PRIVACIDADE POR DESIGN ATIVA' : 'PRIVACY BY DESIGN ACTIVE' }}
      </div>
      <p class="status-desc">
        {{ locale === 'pt-BR' ? 'Em total conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).' : 'In full compliance with the Brazilian General Data Protection Law (LGPD).' }}
      </p>
    </div>

    <!-- Grid 2x2 of Key Pillars -->
    <div class="grid-2" style="margin-top: 1.5rem; gap: 1.5rem;">
      
      <!-- Card 1: Local-First -->
      <div class="card subcard">
        <div class="card-icon blue">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
            <line x1="6" y1="6" x2="6.01" y2="6"></line>
            <line x1="6" y1="18" x2="6.01" y2="18"></line>
          </svg>
        </div>
        <h4>{{ locale === 'pt-BR' ? 'Armazenamento Local (Local-First)' : 'Local Storage (Local-First)' }}</h4>
        <p class="card-desc">
          {{ locale === 'pt-BR' 
            ? 'Todos os seus dados de investimentos, metas, linha do tempo e empréstimos permanecem salvos exclusivamente no seu dispositivo (banco de dados IndexedDB). Não possuímos servidores e nenhum dado é transmitido ou guardado em nuvens alheias.' 
            : 'All your investment, goal, timeline, and loan data remains saved exclusively on your own device (IndexedDB database). We do not have servers and no data is transmitted or kept in external clouds.' }}
        </p>
      </div>

      <!-- Card 2: Military Encryption -->
      <div class="card subcard">
        <div class="card-icon emerald">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h4>{{ locale === 'pt-BR' ? 'Criptografia Forte no Cliente' : 'Client-Side Cryptography' }}</h4>
        <p class="card-desc">
          {{ locale === 'pt-BR' 
            ? 'Seus dados financeiros são criptografados antes de serem gravados em disco usando AES-GCM de 256 bits (nível militar) e a Web Crypto API do navegador. A chave é gerada a partir do seu PIN pessoal via PBKDF2 e nunca sai da sua máquina.' 
            : 'Your financial data is encrypted before being written to disk using 256-bit AES-GCM (military grade) and the browser\'s native Web Crypto API. The key is derived from your personal PIN via PBKDF2 and never leaves your machine.' }}
        </p>
      </div>

      <!-- Card 3: Network Lockdown (CSP) -->
      <div class="card subcard">
        <div class="card-icon purple">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <circle cx="12" cy="11" r="3"></circle>
            <line x1="12" y1="14" x2="12.01" y2="14"></line>
          </svg>
        </div>
        <h4>{{ locale === 'pt-BR' ? 'Rede Bloqueada (CSP Estrita)' : 'Strict Network Lockdown' }}</h4>
        <p class="card-desc">
          {{ locale === 'pt-BR' 
            ? 'Possuímos uma Política de Segurança de Conteúdo (CSP) rígida que proíbe o aplicativo de realizar conexões com a internet aberta. Não há rastreadores (trackers), analíticos ou APIs de terceiros que possam capturar seu comportamento.' 
            : 'We implement a strict Content Security Policy (CSP) that prohibits the application from establishing outgoing internet connections. There are zero trackers, analytics, or third-party APIs that can capture your behavior.' }}
        </p>
      </div>

      <!-- Card 4: LGPD Rights -->
      <div class="card subcard">
        <div class="card-icon amber">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <h4>{{ locale === 'pt-BR' ? 'Seus Direitos Garantidos' : 'Your Rights Guaranteed' }}</h4>
        <p class="card-desc">
          {{ locale === 'pt-BR' 
            ? 'Exercite seus direitos da LGPD de forma imediata: Acesso e Retificação direta na interface, Portabilidade total por meio de Backups manuais (JSON criptografado) e Eliminação definitiva apagando seu Perfil local.' 
            : 'Exercise your rights immediately: direct Access and Rectification in the UI, full Portability through manual Backups (encrypted JSON), and permanent Deletion by erasing your local Profile.' }}
        </p>
      </div>

    </div>

    <!-- Summary Box -->
    <div class="privacy-summary-box">
      <div class="info-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      </div>
      <p>
        {{ locale === 'pt-BR' 
          ? 'Por operar de forma totalmente local, o desenvolvedor ou servidor não atuam como Controladores ou Operadores de dados no contexto da LGPD. Você é o único soberano e detentor das suas informações!' 
          : 'Because the application operates entirely locally, the developer or server does not act as a Controller or Processor of data. You are the sole sovereign owner and keeper of your information!' }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';

const { locale } = inject('i18n');
</script>

<style scoped>
.privacy-policy-container {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.privacy-header {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1.25rem;
}

.shield-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(16, 185, 129, 0.15));
  border-radius: 14px;
  color: var(--primary-accent);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.section-title {
  font-size: 1.75rem;
  margin: 0;
  background: linear-gradient(135deg, var(--primary-accent), var(--secondary-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.section-subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin: 0.25rem 0 0 0;
}

.status-banner {
  background: rgba(16, 185, 129, 0.05);
  border: 1px dashed rgba(16, 185, 129, 0.2);
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
  color: var(--primary-accent);
  letter-spacing: 0.02em;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background-color: var(--primary-accent);
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  animation: pulse 1.6s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.status-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
}

.subcard {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.subcard:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.08);
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  margin-bottom: 1rem;
}

.card-icon.blue { background: #172554; color: #60a5fa; }
.card-icon.emerald { background: #064e3b; color: #34d399; }
.card-icon.purple { background: #3b0764; color: #c084fc; }
.card-icon.amber { background: #78350f; color: #fbbf24; }

h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.card-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

.privacy-summary-box {
  background: rgba(255, 255, 255, 0.02);
  border-left: 4px solid var(--primary-accent);
  padding: 1rem 1.25rem;
  border-radius: 4px var(--radius-md) var(--radius-md) 4px;
  margin-top: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.info-icon {
  color: var(--primary-accent);
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.privacy-summary-box p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}
</style>
