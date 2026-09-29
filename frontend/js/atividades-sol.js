// 1. CAPTURAR O ID DA URL COM SEGURANÇA
const urlParams = new URLSearchParams(window.location.search);
const licaoId = parseInt(urlParams.get('id')) || 1; // Fallback automático para a lição 1

// 2. EXTRAIR OS DADOS DA LIÇÃO CORRESPONDENTE (CLAVE DE SOL)
const licaoAtual = licoesDeNotasSol.find(licao => licao.id === licaoId);

// Variáveis de estado globais e persistentes no LocalStorage (Exclusivas para Clave de Sol)
let correctCount = parseInt(localStorage.getItem('musical_sol_correctCount')) || 0;
let wrongCount = parseInt(localStorage.getItem('musical_sol_wrongCount')) || 0;
let answered = false;

// Variável local para controlar se a lição atual foi resolvida sem nenhum erro prévio
let acertouDePrimeira = true;

// 3. EXECUÇÃO INICIAL
if (licaoAtual) {
    carregarEstruturaDinamica();
    atualizarProgressoGeral();
} else {
    document.body.innerHTML = "<h1 style='text-align:center; margin-top:50px; font-family:sans-serif;'>⚠️ Lição não encontrada!</h1>";
}

function carregarEstruturaDinamica() {
    document.getElementById("lessonNumber").innerText = `Lição ${licaoAtual.id}`;
    document.getElementById("lessonTitle").innerText = licaoAtual.titulo;
    document.getElementById("helpText").innerText = licaoAtual.dica;

    const audioTrack = document.getElementById("audioTrack");
    audioTrack.src = licaoAtual.audioSrc;

    const noteElement = document.getElementById("noteElement");
    noteElement.className = "note " + licaoAtual.classePosicao;

    document.getElementById('correctCount').innerText = correctCount;
    document.getElementById('wrongCount').innerText = wrongCount;

    const btnHelp = document.getElementById("btnHelp");
    const helpBox = document.getElementById("helpBox");

    btnHelp.onclick = () => {
        helpBox.style.display = helpBox.style.display === "none" ? "block" : "none";
    };

    const playBtn = document.getElementById("playBtn");
    const audioTime = document.getElementById("audioTime");

    playBtn.onclick = () => {
        if (audioTrack.paused) {
            audioTrack.play();
            playBtn.innerHTML = "<span class='play-icon'>⏸</span>";
        } else {
            audioTrack.pause();
            playBtn.innerHTML = "<span class='play-icon'>▶</span>";
        }
    };

    audioTrack.onloadedmetadata = () => {
        const total = formatarTempo(audioTrack.duration);
        audioTime.innerText = `0:00 / ${total}`;
    };

    audioTrack.ontimeupdate = () => {
        if (!isNaN(audioTrack.duration)) {
            const atual = formatarTempo(audioTrack.currentTime);
            const total = formatarTempo(audioTrack.duration);
            audioTime.innerText = `${atual} / ${total}`;
        }
    };

    audioTrack.onended = () => {
        playBtn.innerHTML = "<span class='play-icon'>▶</span>";
    };

    const botoesDoHtml = document.querySelectorAll(".option-btn");
    botoesDoHtml.forEach((botao, index) => {
        if (licaoAtual.opcoes[index]) {
            botao.innerText = licaoAtual.opcoes[index];
            botao.onclick = () => computarEscolha(botao, licaoAtual.opcoes[index]);
        }
    });

    document.getElementById("resetBtn").onclick = reiniciarTodoOProgresso;
}

// 4. LÓGICA DE VALIDAÇÃO COM FILTRO DE ACERTO DE PRIMEIRA
function computarEscolha(botaoClicado, respostaSelecionada) {
    if (answered) return; 

    const feedbackPanel = document.getElementById("feedbackPanel");
    const feedbackIcon = feedbackPanel.querySelector(".feedback-icon");
    const feedbackTitle = document.getElementById("feedbackTitle");
    const feedbackMessage = document.getElementById("feedbackMessage");
    const actionBtn = document.getElementById("actionBtn");
    const todosOsBotoes = document.querySelectorAll(".option-btn");

    feedbackPanel.style.display = "flex";

    if (respostaSelecionada === licaoAtual.notaCorreta) {
        answered = true; // Trava novos cliques nesta tentativa após achar a resposta certa

        // SÓ ENTRA NO PROGRESSO GERAL E NOS ACERTOS SE NUNCA ERROU NESSA LIÇÃO ANTES
        if (acertouDePrimeira && !localStorage.getItem(`status_sol_concluido_licao_${licaoId}`)) {
            correctCount++;
            localStorage.setItem('musical_sol_correctCount', correctCount);
            localStorage.setItem(`status_sol_concluido_licao_${licaoId}`, 'true');
        }

        document.getElementById('correctCount').innerText = correctCount;

        botaoClicado.id = 'correct-choice';
        botaoClicado.style.backgroundColor = "#2ecc71";
        botaoClicado.style.color = "#ffffff";
        botaoClicado.style.opacity = "1";

        // Desabilita os outros botões para finalizar o exercício
        todosOsBotoes.forEach(btn => {
            if (btn !== botaoClicado) {
                btn.disabled = true;
                btn.style.opacity = "0.5";
                btn.style.cursor = "not-allowed";
            }
        });

        feedbackPanel.className = "feedback-panel success";
        feedbackIcon.innerText = "✓";
        feedbackTitle.innerText = "Parabéns, você acertou! 🎉";
        
        // Personaliza a mensagem se ele precisou tentar mais de uma vez
        if (acertouDePrimeira) {
            feedbackMessage.innerText = `Excelente! Você acertou de primeira a nota ${licaoAtual.notaCorreta}! Seu progresso subiu.`;
        } else {
            feedbackMessage.innerText = `Você encontrou a nota ${licaoAtual.notaCorreta}. Como precisou de mais tentativas, seu progresso geral não subiu nesta lição.`;
        }

        actionBtn.innerText = "Próxima Lição";
        
        actionBtn.onclick = () => {
            const proximoId = licaoId + 1;
            const proximaExiste = licoesDeNotasSol.some(l => l.id === proximoId);
            if (proximaExiste) {
                window.location.href = `atividades_sol.html?id=${proximoId}`;
            } else {
                alert("Parabéns! Você concluiu com excelência toda a trilha de Clave de Sol!");
                feedbackPanel.style.display = "none";
            }
        };
        
        // Atualiza a barra/anel de aproveitamento
        atualizarProgressoGeral();

    } else {
        // Marcador muda para falso: ele não vai pontuar no progresso geral ao acertar depois
        acertouDePrimeira = false;

        wrongCount++;
        localStorage.setItem('musical_sol_wrongCount', wrongCount);
        document.getElementById('wrongCount').innerText = wrongCount;

        // Pinta e bloqueia apenas o botão que ele errou
        botaoClicado.disabled = true;
        botaoClicado.style.backgroundColor = "#e74c3c";
        botaoClicado.style.color = "#ffffff";
        botaoClicado.style.opacity = "0.7";
        botaoClicado.style.cursor = "not-allowed";

        feedbackPanel.className = "feedback-panel danger";
        feedbackIcon.innerText = "❌";
        feedbackTitle.innerText = "Resposta incorreta! 🤔";
        feedbackMessage.innerText = "Essa não é a nota certa. Analise a pauta novamente e tente outra alternativa!";
        actionBtn.innerText = "Tentar novamente";

        actionBtn.onclick = () => {
            feedbackPanel.style.display = "none";
        };
    }
}

// 5. CÁLCULO DINÂMICO DE PROGRESSO (Apenas lições salvas como acerto de primeira)
function atualizarProgressoGeral() {
    const totalDeQuestoesDoCurso = licoesDeNotasSol.length;
    let questoesConcluidas = 0;

    for (let i = 1; i <= totalDeQuestoesDoCurso; i++) {
        if (localStorage.getItem(`status_sol_concluido_licao_${i}`)) {
            questoesConcluidas++;
        }
    }

    const progressoCalculado = Math.round((questoesConcluidas / totalDeQuestoesDoCurso) * 100) || 0;

    document.getElementById('percentageValue').innerText = `${progressoCalculado}%`;
    document.getElementById('progressRing').style.setProperty('--percent', progressoCalculado);
}

// 6. REINICIAR PROGRESSO SEGURO
function reiniciarTodoOProgresso() {
    if (confirm("Deseja realmente zerar todo o seu histórico e desempenho da Clave de Sol?")) {
        localStorage.removeItem('musical_sol_correctCount');
        localStorage.removeItem('musical_sol_wrongCount');

        licoesDeNotasSol.forEach(licao => {
            localStorage.removeItem(`status_sol_concluido_licao_${licao.id}`);
        });

        correctCount = 0;
        wrongCount = 0;
        window.location.href = "atividades_sol.html?id=1"; 
    }
}

// 7. FORMATADOR DE TEMPO
function formatarTempo(segundos) {
    if (isNaN(segundos)) return "0:00";
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min}:${seg < 10 ? '0' : ''}${seg}`;
}
