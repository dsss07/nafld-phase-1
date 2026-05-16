import * as tf from 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.12.0/dist/tf.min.js';

const form = document.getElementById('phase1-form');
const resultEl = document.getElementById('phase1-result');
const useApiBtn = document.getElementById('phase1-predict-api');

async function tryLoadModel(){
  try{
    const model = await tf.loadLayersModel('/models/phase1/model.json');
    return model;
  }catch(e){ console.warn('No local TFJS model found for phase1', e); return null; }
}

function getInputArray(){
  const el = document.getElementById('phase1-fields');
  const inputs = el.querySelectorAll('input');
  const arr = Array.from(inputs).map(i=> Number(i.value || 0));
  return arr;
}

async function predictWithModel(model){
  const input = tf.tensor([getInputArray()]);
  const out = model.predict(input);
  const data = await out.data();
  return Array.from(data);
}

async function predictWithAPI(){
  const payload = {};
  const inputs = document.getElementById('phase1-fields').querySelectorAll('input');
  inputs.forEach(i=> payload[i.name] = Number(i.value || 0));
  try{
    const res = await fetch('/predict-phase1', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
    const j = await res.json();
    return j;
  }catch(e){ throw e; }
}

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  resultEl.classList.remove('hidden');
  resultEl.textContent = 'Running prediction...';
  let model = await tryLoadModel();
  try{
    if(model){
      const out = await predictWithModel(model);
      resultEl.innerHTML = '<pre>'+JSON.stringify(out,null,2)+'</pre>';
    } else {
      const apiRes = await predictWithAPI();
      resultEl.innerHTML = '<pre>'+JSON.stringify(apiRes,null,2)+'</pre>';
    }
  }catch(err){ resultEl.innerHTML = '<div class="muted">Error: '+err.message+'</div>'; }
});

useApiBtn.addEventListener('click', async ()=>{
  resultEl.classList.remove('hidden');
  resultEl.textContent = 'Calling API...';
  try{ const r = await predictWithAPI(); resultEl.innerHTML = '<pre>'+JSON.stringify(r,null,2)+'</pre>'; }catch(e){ resultEl.innerHTML = '<div class="muted">API error: '+e.message+'</div>'; }
});

console.log('Loaded phase1 script');
