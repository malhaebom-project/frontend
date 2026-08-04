import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const defaultVoice = "ko-KR-SunHi:DragonHDLatestNeural";
const maxTextLength = 600;

type VisemeCue = {
  offsetMs: number;
  visemeId: number;
};

function synthesizeFeedback(text: string, key: string, region: string, voice: string) {
  return new Promise<{ audioBase64: string; visemes: VisemeCue[] }>((resolve, reject) => {
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(key, region);
    speechConfig.speechSynthesisLanguage = "ko-KR";
    speechConfig.speechSynthesisVoiceName = voice;
    speechConfig.speechSynthesisOutputFormat =
      SpeechSDK.SpeechSynthesisOutputFormat.Audio24Khz96KBitRateMonoMp3;

    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null);
    const visemes: VisemeCue[] = [];

    synthesizer.visemeReceived = (_sender, event) => {
      visemes.push({
        offsetMs: Math.round(event.audioOffset / 10_000),
        visemeId: event.visemeId,
      });
    };

    synthesizer.speakTextAsync(
      text,
      result => {
        synthesizer.close();

        if (result.reason !== SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
          reject(new Error(result.errorDetails || "Azure 음성 합성이 완료되지 않았습니다."));
          return;
        }

        resolve({
          audioBase64: Buffer.from(result.audioData).toString("base64"),
          visemes,
        });
      },
      error => {
        synthesizer.close();
        reject(new Error(String(error)));
      },
    );
  });
}

export async function POST(request: Request) {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  const voice = process.env.AZURE_KOREAN_FEEDBACK_VOICE || defaultVoice;

  if (!key || !region) {
    return Response.json(
      {
        success: false,
        errorCode: "AZURE_SPEECH_NOT_CONFIGURED",
        message: "Azure Speech 환경변수가 설정되지 않았습니다.",
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null) as { text?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!text || text.length > maxTextLength) {
    return Response.json(
      {
        success: false,
        errorCode: "INVALID_TTS_TEXT",
        message: `피드백 문장은 1자 이상 ${maxTextLength}자 이하여야 합니다.`,
      },
      { status: 400 },
    );
  }

  try {
    const speech = await synthesizeFeedback(text, key, region, voice);
    return Response.json({
      success: true,
      data: {
        audioDataUrl: `data:audio/mpeg;base64,${speech.audioBase64}`,
        visemes: speech.visemes,
        voice,
      },
      message: null,
    }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Azure Korean feedback TTS failed", error);
    return Response.json(
      {
        success: false,
        errorCode: "AZURE_SPEECH_SYNTHESIS_FAILED",
        message: "한국어 피드백 음성을 생성하지 못했습니다.",
      },
      { status: 502 },
    );
  }
}
