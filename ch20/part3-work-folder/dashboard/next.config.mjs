/** @type {import('next').NextConfig} */
const nextConfig = {
  // 화면에 쓸 데이터는 dashboard/ 바깥의 wiki/data/dashboard.json에 있고,
  // 앱이 실행될 때 그 파일을 직접 읽는다. 그래서 빌드할 때 필요한 파일을 찾는
  // 기준 폴더를 dashboard/의 한 단계 위로 잡아 둔다.
  // 데이터 사본을 dashboard/ 안에 두지 않는 것은 이 폴더의 규칙이다.
  // 사본은 원본이 바뀌어도 따라 바뀌지 않아 어느새 낡기 때문이다.
  outputFileTracingRoot: new URL('..', import.meta.url).pathname,
}

export default nextConfig
