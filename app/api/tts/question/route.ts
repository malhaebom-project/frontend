import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const run = promisify(execFile);
const maxTextLength = 200;

export async function GET(request: Request) {
  const text = new URL(request.url).searchParams.get("text")?.trim() ?? "";

  if (!text || text.length > maxTextLength) {
    return Response.json(
      { success: false, message: `문장은 1자 이상 ${maxTextLength}자 이하여야 합니다.` },
      { status: 400 },
    );
  }

  if (process.env.NODE_ENV !== "development" || process.platform !== "darwin") {
    return Response.json(
      { success: false, message: "로컬 문제 음성은 macOS 개발 서버에서만 사용할 수 있습니다." },
      { status: 503 },
    );
  }

  const directory = await mkdtemp(join(tmpdir(), "malhaebom-question-tts-"));
  const aiffPath = join(directory, "question.aiff");
  const wavPath = join(directory, "question.wav");

  try {
    await run("/usr/bin/say", ["-v", "Samantha", "-r", "170", "-o", aiffPath, text]);
    await run("/usr/bin/afconvert", ["-f", "WAVE", "-d", "LEI16@22050", aiffPath, wavPath]);
    const audio = await readFile(wavPath);

    return new Response(new Uint8Array(audio), {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Local question TTS failed", error);
    return Response.json(
      { success: false, message: "로컬 문제 음성을 생성하지 못했습니다." },
      { status: 500 },
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
