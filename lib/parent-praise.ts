export type ParentPraiseKind = "progress" | "allStars";

type PraiseMessage = (childName: string) => string;

export function childWithSubject(childName: string) {
  const lastCharacter = childName.at(-1);
  if (!lastCharacter) return childName;
  const code = lastCharacter.charCodeAt(0);
  const hasFinalConsonant = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
  return `${childName}${hasFinalConsonant ? "이" : "가"}`;
}

export const PARENT_PRAISE_MESSAGES: Record<ParentPraiseKind, readonly PraiseMessage[]> = {
  progress: [
    (name) => `${name}의 오늘 도전이 영어 자신감을 키우고 있어요. “끝까지 해보려는 모습이 정말 멋져!”라고 말해 주세요.`,
    (name) => `${name}에게 정답보다 용기 있게 말한 과정이 더 소중해요. “영어로 말해 본 네가 자랑스러워!”라고 응원해 주세요.`,
    (name) => `${name}의 작은 시도가 차곡차곡 실력이 되고 있어요. “어제보다 한 걸음 더 나아갔어!”라고 말해 주세요.`,
    (name) => `${childWithSubject(name)} 어려운 문제에도 포기하지 않았어요. “끝까지 집중한 모습이 정말 대단해!”라고 칭찬해 주세요.`,
    (name) => `${name}의 틀린 답도 성장에 꼭 필요한 발자국이에요. “다시 도전한 용기가 최고야!”라고 말해 주세요.`,
    (name) => `${childWithSubject(name)} 오늘 새로운 영어 표현에 도전했어요. “모르는 것도 씩씩하게 말해 봐서 멋져!”라고 응원해 주세요.`,
    (name) => `${name}의 꾸준한 연습이 좋은 습관으로 자라고 있어요. “오늘도 약속을 지켜서 대단해!”라고 말해 주세요.`,
    (name) => `${childWithSubject(name)} 한 문제씩 차분하게 풀어냈어요. “서두르지 않고 끝까지 해낸 게 멋져!”라고 칭찬해 주세요.`,
    (name) => `${name}의 목소리에 영어 자신감이 조금씩 더해지고 있어요. “크게 말해 본 용기가 정말 멋져!”라고 말해 주세요.`,
    (name) => `${childWithSubject(name)} 실수해도 다시 말해 보며 성장했어요. “실수해도 포기하지 않은 네가 최고야!”라고 응원해 주세요.`,
    (name) => `${name}의 오늘 학습에는 멋진 노력이 가득했어요. “정답을 찾으려고 생각한 과정이 훌륭해!”라고 말해 주세요.`,
    (name) => `${childWithSubject(name)} 어려운 표현을 끝까지 따라 말했어요. “조금 어려워도 해낸 모습이 자랑스러워!”라고 칭찬해 주세요.`,
    (name) => `${name}의 영어 실력은 매일 한 뼘씩 자라고 있어요. “오늘 배운 만큼 더 성장했어!”라고 말해 주세요.`,
    (name) => `${childWithSubject(name)} 자신의 속도로 학습을 잘 마쳤어요. “천천히 끝까지 해내서 정말 멋져!”라고 응원해 주세요.`,
    (name) => `${name}의 도전하는 마음이 오늘의 가장 큰 성과예요. “용기 내서 말해 줘서 정말 기뻐!”라고 말해 주세요.`,
  ],
  allStars: [
    (name) => `${name}의 별이 모두 반짝였어요. “오늘 배운 문제를 모두 해낸 게 정말 대단해!”라고 말해 주세요.`,
    (name) => `${childWithSubject(name)} 모든 문제를 멋지게 완성했어요. “집중해서 끝까지 해낸 네가 자랑스러워!”라고 칭찬해 주세요.`,
    (name) => `${name}의 영어 자신감이 별처럼 빛났어요. “오늘 영어로 정말 멋지게 말했어!”라고 축하해 주세요.`,
    (name) => `${childWithSubject(name)} 오늘의 별을 전부 모았어요. “노력한 만큼 멋진 결과를 만들었구나!”라고 말해 주세요.`,
    (name) => `${name}의 꾸준한 연습이 빛나는 결과로 이어졌어요. “끝까지 집중한 힘이 정말 대단해!”라고 칭찬해 주세요.`,
    (name) => `${childWithSubject(name)} 정확하고 자신 있게 모든 문제를 풀었어요. “오늘 영어 선생님처럼 멋졌어!”라고 말해 주세요.`,
    (name) => `${name}의 멋진 발음과 집중력이 별 다섯 개를 만들었어요. “네 목소리가 정말 자신감 있었어!”라고 칭찬해 주세요.`,
    (name) => `${childWithSubject(name)} 오늘 학습을 완벽하게 마쳤어요. “배운 내용을 잘 기억해 낸 게 놀라워!”라고 말해 주세요.`,
    (name) => `${name}의 도전이 최고의 결과로 이어졌어요. “포기하지 않고 모두 해낸 네가 최고야!”라고 축하해 주세요.`,
    (name) => `${childWithSubject(name)} 모든 별의 주인공이 되었어요. “오늘 보여 준 집중력과 용기가 정말 멋져!”라고 말해 주세요.`,
    (name) => `${name}의 영어 실력이 오늘 한층 더 빛났어요. “문제를 모두 맞힌 것도, 끝까지 노력한 것도 대단해!”라고 칭찬해 주세요.`,
    (name) => `${childWithSubject(name)} 배운 표현을 자신 있게 말해 모든 별을 모았어요. “오늘의 영어 도전은 완벽했어!”라고 말해 주세요.`,
    (name) => `${name}의 노력으로 별 다섯 개가 환하게 빛났어요. “매일 연습한 힘이 이렇게 멋진 결과를 만들었네!”라고 축하해 주세요.`,
    (name) => `${childWithSubject(name)} 처음부터 마지막 문제까지 멋지게 해냈어요. “집중하는 모습이 정말 자랑스러웠어!”라고 말해 주세요.`,
    (name) => `${name}의 오늘 학습은 아주 특별했어요. “모든 별을 모은 네 실력이 정말 멋져!”라고 크게 칭찬해 주세요.`,
  ],
};

export function randomParentPraiseIndex() {
  return Math.floor(Math.random() * PARENT_PRAISE_MESSAGES.progress.length);
}

export function parentPraiseMessage(kind: ParentPraiseKind, index: number, childName: string) {
  const messages = PARENT_PRAISE_MESSAGES[kind];
  return messages[index % messages.length](childName);
}
