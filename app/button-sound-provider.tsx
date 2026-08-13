"use client";

import { useEffect } from "react";

let audioContext: AudioContext | null = null;
let clickBuffer: AudioBuffer | null = null;

function context(){
  audioContext??=new AudioContext();
  return audioContext;
}

function noiseBuffer(audio:AudioContext){
  if(clickBuffer?.sampleRate===audio.sampleRate)return clickBuffer;
  const length=Math.round(audio.sampleRate*.018);
  const buffer=audio.createBuffer(1,length,audio.sampleRate);
  const samples=buffer.getChannelData(0);
  for(let index=0;index<length;index++){
    const envelope=Math.pow(1-index/length,3.6);
    samples[index]=(Math.random()*2-1)*envelope;
  }
  clickBuffer=buffer;
  return buffer;
}

function clickTransient(audio:AudioContext,startedAt:number,volume:number,frequency:number){
  const source=audio.createBufferSource();
  const filter=audio.createBiquadFilter();
  const gain=audio.createGain();
  source.buffer=noiseBuffer(audio);
  filter.type="bandpass";
  filter.frequency.setValueAtTime(frequency,startedAt);
  filter.Q.setValueAtTime(1.4,startedAt);
  gain.gain.setValueAtTime(volume,startedAt);
  gain.gain.exponentialRampToValueAtTime(.0001,startedAt+.022);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  source.start(startedAt);
}

function playButtonClick(){
  try {
    const audio=context();
    void audio.resume();
    const startedAt=audio.currentTime+.003;
    clickTransient(audio,startedAt,.055,2300);
    clickTransient(audio,startedAt+.032,.032,1750);
  } catch {
    // Web Audio를 사용할 수 없는 환경에서는 버튼 동작만 유지합니다.
  }
}

export function ButtonSoundProvider(){
  useEffect(()=>{
    function click(event:MouseEvent){
      if(!event.isTrusted)return;
      const target=event.target instanceof Element?event.target.closest<HTMLElement>("button, a.btn, [role='button']"):null;
      if(!target||target.matches(":disabled")||target.dataset.uiSound==="off"||target.classList.contains("record-button"))return;
      playButtonClick();
    }
    window.addEventListener("click",click);
    return()=>window.removeEventListener("click",click);
  },[]);
  return null;
}
