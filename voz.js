// ===============================
// VOZ.GLOBAL.JS
// ===============================
const synth = window.speechSynthesis;

/**
 * Fala o texto fornecido em português (pt-BR)
 * @param {string} text - Texto a ser falado
 */
function speak(text) {
  if (!synth) return;
  if (synth.speaking) return;

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "pt-BR";
  synth.speak(utter);
}
