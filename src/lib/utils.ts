/**
 * 한국 시간(KST, UTC+9)을 ISO 형식 문자열로 반환
 */
export function getKoreanTimeISO(): string {
  const now = new Date();
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  return koreaTime.toISOString();
}
