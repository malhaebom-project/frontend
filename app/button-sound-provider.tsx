"use client";

import { useEffect } from "react";

let audioContext: AudioContext | null = null;
let clickBuffer: AudioBuffer | null = null;
const assetBuffers=new Map<string,Promise<AudioBuffer>>();
const BUTTON_CLICK_URL="/audio/ui/button-click.ogg";
const STAR_EARNED_URL="/audio/ui/star-earned.ogg";
const ALL_STARS_FANFARE_URL="/audio/ui/all-stars-fanfare.ogg";
const ALL_STARS_CONGRATULATIONS_URL="/audio/ui/all-stars-congratulations.ogg";

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

function assetBuffer(url:string){
  const cached=assetBuffers.get(url);
  if(cached)return cached;
  const audio=context();
  const pending=fetch(url)
    .then(response=>{
      if(!response.ok)throw new Error(`Sound asset unavailable: ${response.status}`);
      return response.arrayBuffer();
    })
    .then(data=>audio.decodeAudioData(data));
  assetBuffers.set(url,pending);
  pending.catch(()=>assetBuffers.delete(url));
  return pending;
}

async function playAssetSound(url:string,boost:number,delaySeconds=0){
  const audio=context();
  await audio.resume();
  if(audio.state!=="running")throw new Error("Audio context is not running.");
  const buffer=await assetBuffer(url);
  return new Promise<void>(resolve=>{
    const source=audio.createBufferSource();
    const gain=audio.createGain();
    const compressor=audio.createDynamicsCompressor();
    source.buffer=buffer;
    gain.gain.value=boost;
    compressor.threshold.value=-10;
    compressor.knee.value=8;
    compressor.ratio.value=3;
    compressor.attack.value=.003;
    compressor.release.value=.12;
    source.connect(gain);
    gain.connect(compressor);
    compressor.connect(audio.destination);
    source.addEventListener("ended",()=>{
      source.disconnect();
      gain.disconnect();
      compressor.disconnect();
      resolve();
    },{once:true});
    source.start(audio.currentTime+delaySeconds);
  });
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

function playSyntheticButtonClick(){
  try {
    const audio=context();
    void audio.resume();
    const startedAt=audio.currentTime+.003;
    clickTransient(audio,startedAt,.085,2300);
    clickTransient(audio,startedAt+.032,.05,1750);
  } catch {
    // Web Audio를 사용할 수 없는 환경에서는 버튼 동작만 유지합니다.
  }
}

function playButtonClick(){
  void playAssetSound(BUTTON_CLICK_URL,2.25).catch(playSyntheticButtonClick);
}

function chimeNote(audio:AudioContext,startedAt:number,frequency:number,duration:number,volume:number){
  const oscillator=audio.createOscillator();
  const shimmer=audio.createOscillator();
  const gain=audio.createGain();
  const shimmerGain=audio.createGain();
  oscillator.type="sine";
  oscillator.frequency.setValueAtTime(frequency,startedAt);
  shimmer.type="sine";
  shimmer.frequency.setValueAtTime(frequency*2.01,startedAt);
  gain.gain.setValueAtTime(.0001,startedAt);
  gain.gain.exponentialRampToValueAtTime(volume,startedAt+.018);
  gain.gain.exponentialRampToValueAtTime(.0001,startedAt+duration);
  shimmerGain.gain.setValueAtTime(.0001,startedAt);
  shimmerGain.gain.exponentialRampToValueAtTime(volume*.24,startedAt+.012);
  shimmerGain.gain.exponentialRampToValueAtTime(.0001,startedAt+duration*.72);
  oscillator.connect(gain);
  shimmer.connect(shimmerGain);
  gain.connect(audio.destination);
  shimmerGain.connect(audio.destination);
  oscillator.start(startedAt);
  shimmer.start(startedAt);
  oscillator.stop(startedAt+duration+.02);
  shimmer.stop(startedAt+duration+.02);
}

function playSyntheticQuestionIntroChime(){
  try {
    const audio=context();
    void audio.resume();
    const startedAt=audio.currentTime+.02;
    [659.25,880,1174.66,1567.98].forEach((frequency,index)=>{
      chimeNote(audio,startedAt+index*.1,frequency,.34-index*.015,.085-index*.005);
    });
    return new Promise<void>(resolve=>window.setTimeout(resolve,700));
  } catch {
    return Promise.resolve();
  }
}

export function playQuestionIntroChime(){
  return playSyntheticQuestionIntroChime();
}

export function playStarEarned(){
  return playAssetSound(STAR_EARNED_URL,1.6).catch(()=>undefined);
}

export function playAllStarsCelebration(){
  return Promise.all([
    playAssetSound(ALL_STARS_FANFARE_URL,1.45).catch(()=>undefined),
    playAssetSound(ALL_STARS_CONGRATULATIONS_URL,1.6,.22).catch(()=>undefined),
  ]).then(()=>undefined);
}

export function ButtonSoundProvider(){
  useEffect(()=>{
    void assetBuffer(BUTTON_CLICK_URL).catch(()=>undefined);
    void assetBuffer(STAR_EARNED_URL).catch(()=>undefined);
    void assetBuffer(ALL_STARS_FANFARE_URL).catch(()=>undefined);
    void assetBuffer(ALL_STARS_CONGRATULATIONS_URL).catch(()=>undefined);
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
