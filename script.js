// Write JavaScript here
const BASE_URL = "https://nlpgroup.unior.it/api/marianna_head";
const USERNAME = "utenteuniornlp";
const PASSWORD = "prova_asr_unior";

// --- TESTO → RISPOSTA TESTUALE ---
async function getTextResponse() {
  const text = document.getElementById("textInput").value;
  const output = document.getElementById("textOutput");

  if (!text.trim()) {
    output.textContent = "⚠️ Inserisci una domanda prima di inviare.";
    return;
  }

  output.textContent = "⏳ Marianna sta cercando la risposta...";
  
  const res = await fetch(`${BASE_URL}/text_response`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic " + btoa(`${USERNAME}:${PASSWORD}`)
    },
    body: JSON.stringify({ text })
  });

  const data = await res.json();
  output.textContent = data.response || JSON.stringify(data, null, 2);
}

// --- REGISTRAZIONE AUDIO ---
let mediaRecorder;
let audioChunks = [];

async function toggleRecording() {
  const recordButton = document.getElementById("recordButton");
  const sendButton = document.getElementById("sendRecording");
  const audioElement = document.getElementById("recordedAudio");

  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: "audio/wav" });
      audioElement.src = URL.createObjectURL(blob);
      sendButton.disabled = false;
    };

    mediaRecorder.start();
    recordButton.textContent = "⏹️ Ferma registrazione";
    recordButton.style.background = "var(--napoli-red)";
  } else {
    mediaRecorder.stop();
    recordButton.textContent = "🎙️ Avvia registrazione";
    recordButton.style.background = "var(--napoli-blue)";
  }
}

// --- INVIO AUDIO A MARIANNA ---
async function sendRecordedAudio() {
  const audioElement = document.getElementById("recordedAudio");
  const responseAudio = document.getElementById("responseAudio");
  const responseHeaders = document.getElementById("responseHeaders");
  const sendButton = document.getElementById("sendRecording");

  sendButton.disabled = true;
  responseHeaders.textContent = "⏳ Marianna sta elaborando la tua voce...";

  const blob = await fetch(audioElement.src).then(r => r.blob());
  const formData = new FormData();
  formData.append("file", blob, "recording.wav");

  const res = await fetch(`${BASE_URL}/pipeline_audio`, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(`${USERNAME}:${PASSWORD}`)
    },
    body: formData
  });

  const audioBlob = await res.blob();
  responseAudio.src = URL.createObjectURL(audioBlob);

  const transcription = res.headers.get("X-Transcription") || "—";
  const summary = res.headers.get("X-Summary") || "—";

  responseHeaders.textContent = `🎤 Trascrizione: ${transcription}\n📜 Riassunto: ${summary}`;
}
