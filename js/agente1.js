// Importando dos outros arquivos js
import { clonarAmbiente, imprimirMatriz } from '../js/ambiente.js';
import { registrarAcao, adicionarPontuacao } from '../js/gerencia.js';

// Criando o agente
const agente = {
    x: 0,
    y: 0,
    movimento: true,
    pausado: false,
    ambienteOriginal: null,
    ambienteAtual: [],
    intervalo: null,
    pontuacao: 0,
    codigoColetado: false,
    jogoAtivo: true,
    balaDisponivel: true
};

// Controle daa quantidade de execuções
let execucoes = 0;
const TOTAL_EXECUCOES = 3;
let pontuacoes = [];

// Função de renderização da imagem do agente
export function renderizarAgente(x, y) {
    const celula = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
    if (celula) {
        celula.innerHTML += '<img src="../images/hacker.png" alt="Agente Hacker">';
        celula.classList.add('agente');
    }
}

// Função de tiro aleatório
function atirarNoMonstro() {
    if (!agente.balaDisponivel) return; // Verifica se a bala está disponível
    
    agente.balaDisponivel = false; // Gasta a única bala e passa a não poder atirar novamente
    agente.pontuacao -= 50; // Custo de 50 por atirar
    registrarAcao('Ação', 'Atirou (-50 pontos) ÚNICA bala usada!');

    // 50% de chance de acertar
    const acertou = Math.random() < 0.5;
    
    // Verificação de acerto para atualizar o ambiente
    if (acertou) {
        const direcoes = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (let [dx, dy] of direcoes) {
            const nx = agente.x + dx;
            const ny = agente.y + dy;
            
            if (nx >= 0 && nx < agente.ambienteAtual.length && 
                ny >= 0 && ny < agente.ambienteAtual[0].length) {
                if (agente.ambienteAtual[nx][ny].includes('M')) {
                    agente.ambienteAtual[nx][ny] = agente.ambienteAtual[nx][ny].replace('M', '');
                    agente.pontuacao += 1000;
                    registrarAcao('Sucesso', 'Máquina destruída (+1000 pontos)');
                    
                    // Efeito visual
                    const celula = document.querySelector(`.cell[data-x="${nx}"][data-y="${ny}"]`);
                    if (celula) celula.classList.add('maquina-destruida');
                }
            }
        }
    } else {
        registrarAcao('Tiro', 'O tiro falhou!');
    }

    atualizarPontuacao();
}


// Controle do jogo
export function iniciarJogo(ambiente) {
    if (execucoes === 0) {
        agente.ambienteOriginal = clonarAmbiente(ambiente);
        pontuacoes = [];
    }
    iniciarNovaExecucao();
}

// Inicia uma nova execução se ainda não atingiu o número de execuções definido
function iniciarNovaExecucao() {
    if (execucoes >= TOTAL_EXECUCOES) {
        registrarAcao('Final', `Todas as ${TOTAL_EXECUCOES} execuções concluídas`);
        return;
    }

    execucoes++;
    registrarAcao('Execução', `Iniciando execução ${execucoes}/${TOTAL_EXECUCOES}`);

    // Reseta o estado do agente e clona o ambiente original
    agente.ambienteAtual = clonarAmbiente(agente.ambienteOriginal);
    agente.x = 0;
    agente.y = 0;
    agente.pontuacao = 0;
    agente.codigoColetado = false;
    agente.jogoAtivo = true;
    agente.balaDisponivel = true; // Começa com uma bala novamente
    agente.movimento = true;
    agente.pausado = false;

    // Renderização inicial
    imprimirMatriz(agente.ambienteAtual, [{
        x: agente.x,
        y: agente.y,
        tipo: 'agente',
        classe: 'agente-ativo'
    }]);

    iniciarMovimentoAleatorio();
    atualizarPontuacao();
}

// Movimento aleatório do agente
function moverAleatorio() {
    if (!agente.movimento || agente.pausado || !agente.jogoAtivo) return;

    const direcoes = ['up', 'down', 'left', 'right'];
    const direcaoEscolhida = direcoes[Math.floor(Math.random() * direcoes.length)];

    let novoX = agente.x;
    let novoY = agente.y;

    switch (direcaoEscolhida) {
        case 'up': novoX = Math.max(0, agente.x - 1); break;
        case 'down': novoX = Math.min(agente.ambienteAtual.length - 1, agente.x + 1); break;
        case 'left': novoY = Math.max(0, agente.y - 1); break;
        case 'right': novoY = Math.min(agente.ambienteAtual[0].length - 1, agente.y + 1); break;
    }

    // Atualiza posição do agente
    const celulaAnterior = document.querySelector(`.cell[data-x="${agente.x}"][data-y="${agente.y}"]`);
    if (celulaAnterior) {
        celulaAnterior.classList.remove('agente');
        const imagemAgente = celulaAnterior.querySelector('img[alt="Agente Hacker"]');
        if (imagemAgente) celulaAnterior.removeChild(imagemAgente);
    }

    agente.x = novoX;
    agente.y = novoY;
    registrarAcao('Movimento', `Para (${novoX}, ${novoY})`);

    // Verifica conteúdo da célula em que o agente está
    const conteudoCelula = agente.ambienteAtual[novoX][novoY];
    if (conteudoCelula.includes('E')) {
        agente.pontuacao -= 10;
        registrarAcao('Percepção', 'Escombros encontrados (-10 pontos)');
    }
    if (conteudoCelula.includes('M')) {
        agente.pontuacao -= 2000;
        registrarAcao('Fim de Jogo', 'Máquina assassina encontrada (-2000 pontos)');
        
        const celulaMaquina = document.querySelector(`.cell[data-x="${novoX}"][data-y="${novoY}"]`);
        if (celulaMaquina) {
            celulaMaquina.classList.add('maquina-ativa');
            setTimeout(() => celulaMaquina.classList.remove('maquina-ativa'), 1000);
        }
        
        // Finaliza execução
        clearInterval(agente.intervalo);
        agente.jogoAtivo = false;
        
        imprimirMatriz(agente.ambienteAtual, [{
            x: novoX,
            y: novoY,
            tipo: 'agente',
            classe: 'agente-destruido'
        }]);
        
        finalizarExecucao('Destruído por máquina assassina');
        return;
    }
    if (conteudoCelula.includes('C') && !agente.codigoColetado) {
        agente.pontuacao += 2000;
        agente.codigoColetado = true;
        registrarAcao('Sucesso', 'Código coletado (+2000 pontos)');
    }
    if (agente.codigoColetado && novoX === 0 && novoY === 0) {
        finalizarExecucao('Missão cumprida!');
        return;
    }
    if (conteudoCelula.includes('R') && agente.balaDisponivel) {
        atirarNoMonstro(); // só atira se tiver bala
    }

    atualizarPontuacao();
    
    // Renderiza nova posição
    imprimirMatriz(agente.ambienteAtual, [{
        x: agente.x,
        y: agente.y,
        tipo: 'agente',
        classe: 'agente-ativo'
    }]);
}

//===============================================
// Funções auxiliares
//===============================================

function iniciarMovimentoAleatorio() {
    if (agente.intervalo) clearInterval(agente.intervalo);
    agente.intervalo = setInterval(moverAleatorio, 200); // Velocidade de uma execução para outra
}

function atualizarPontuacao() {
    const elementoPontuacao = document.getElementById('pontuacao');
    if (elementoPontuacao) {
        const balaStatus = agente.balaDisponivel ? '[BALA ✔]' : '[BALA ✖]';
        elementoPontuacao.textContent = `Pontuação: ${agente.pontuacao} ${balaStatus} [Execução ${execucoes}/${TOTAL_EXECUCOES}]`;
    }
}

function finalizarExecucao(mensagem) {
    clearInterval(agente.intervalo);
    agente.jogoAtivo = false;
    agente.movimento = false;
    
    pontuacoes.push(agente.pontuacao);
    adicionarPontuacao(execucoes, agente.pontuacao);
    
    registrarAcao('Resultado', `${mensagem} Pontuação: ${agente.pontuacao}`);
    
    if (execucoes < TOTAL_EXECUCOES) {
        setTimeout(iniciarNovaExecucao, 2000);
    } else {
        registrarAcao('Relatório', `Pontuações finais: ${pontuacoes.join(', ')}`);
    }
}

// ==============================================
// Exportação
// ==============================================

export default {
    iniciarJogo,
    pausarJogo: function() {
        agente.pausado = true;
        clearInterval(agente.intervalo);
        registrarAcao('Jogo', 'Pausado');
    },
    retomarJogo: function() {
        agente.pausado = false;
        iniciarMovimentoAleatorio();
        registrarAcao('Jogo', 'Retomado');
    },
    pararJogo: function() {
        agente.jogoAtivo = false;
        clearInterval(agente.intervalo);
        registrarAcao('Jogo', 'Parado');
    }
};