/* Moteur de quiz EYA — une question à la fois, feedback immédiat + explication.
   Les ordres de réponses sont IDENTIQUES aux quiz papier (même mélange déterministe). */
(async function () {
  const key = document.body.dataset.quiz;
  const res = await fetch("../assets/quiz_data.json");
  const all = await res.json();
  const quiz = all[key];
  const L = "abcd";

  const $ = (s) => document.querySelector(s);
  // Contenu 100 % interne (JSON généré au build), mais on échappe systématiquement.
  const esc = (t) => String(t).replace(/[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const main = $("#quiz");
  let i = 0;
  let score = 0;
  let answered = false;

  $("#titre").textContent = quiz.titre;
  $("#sous").textContent = quiz.sous;

  function pct() {
    return Math.round((i / quiz.questions.length) * 100);
  }

  function renderQuestion() {
    answered = false;
    const q = quiz.questions[i];
    main.innerHTML = `
      <div class="progress"><i style="width:${pct()}%"></i></div>
      <div class="qnum">Question ${i + 1} / ${quiz.questions.length}</div>
      <div class="qtext">${esc(q.q)}</div>
      <div id="opts">
        ${q.opts.map((o, j) => `
          <button class="opt" data-j="${j}"><span class="l">${L[j]})</span>${esc(o)}</button>
        `).join("")}
      </div>
      <div id="after"></div>
    `;
    document.querySelectorAll(".opt").forEach((b) => {
      b.addEventListener("click", () => answer(parseInt(b.dataset.j, 10)));
    });
  }

  function answer(j) {
    if (answered) return;
    answered = true;
    const q = quiz.questions[i];
    const good = j === q.bonne;
    if (good) score++;
    document.querySelectorAll(".opt").forEach((b) => {
      const k = parseInt(b.dataset.j, 10);
      if (k === q.bonne) b.classList.add("good");
      else if (k === j) b.classList.add("bad");
      else b.classList.add("dim");
      b.disabled = true;
    });
    const last = i === quiz.questions.length - 1;
    $("#after").innerHTML = `
      <div class="explain"><b>${good ? "✔ Bonne réponse." : "✘ La bonne réponse était " + L[q.bonne] + ")."}</b>
      ${esc(q.explication)}</div>
      <button class="btn" id="next">${last ? "Voir mon score" : "Question suivante"}</button>
    `;
    $("#next").addEventListener("click", () => {
      i++;
      if (i < quiz.questions.length) renderQuestion();
      else renderScore();
    });
    $("#next").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function renderScore() {
    const n = quiz.questions.length;
    const p = Math.round((score / n) * 100);
    const seuil = key === "final" ? 70 : null;
    let msg;
    if (p >= 90) msg = "Excellent. Vous maîtrisez — aidez un collègue qui bloque, c'est le meilleur moyen d'ancrer.";
    else if (p >= 70) msg = "Solide. Relisez les explications des questions manquées : elles font partie des points clés.";
    else msg = "C'est le moment d'en reparler avec le formateur — plusieurs notions méritent un second passage. Ce quiz n'est pas une sanction : refaites-le après.";
    main.innerHTML = `
      <div class="progress"><i style="width:100%"></i></div>
      <div class="qnum">Résultat</div>
      <div class="score-big">${score}<span>/${n}</span></div>
      <div class="qtext">${p} % de bonnes réponses${seuil ? " — seuil indicatif : " + seuil + " %" : ""}</div>
      ${seuil ? `<div class="explain"><b>${p >= seuil ? "Seuil atteint." : "Seuil non atteint."}</b>
        Le passage officiel du questionnaire se fait sur papier en séance : cette version en ligne
        sert à s'entraîner. ${p >= seuil ? "" : "Un retour individualisé est prévu — parlez-en au formateur."}</div>` : ""}
      <div class="explain">${msg}</div>
      <button class="btn" onclick="location.reload()">Recommencer</button>
      <a class="btn ghost" style="margin-left:10px" href="../index.html">Accueil</a>
    `;
  }

  renderQuestion();
})();
