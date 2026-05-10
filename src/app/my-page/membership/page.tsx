'use client';

import { useSession } from 'next-auth/react';
import TopBar from '@/components/TopBar';
import SubNav from '@/components/SubNav';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

type Bilingual = { en: string; kr: string };
type CircleKey = 'carte' | 'cercle' | 'confidence' | 'cenacle';

type CircleSection = {
  heading: Bilingual;
  items: Bilingual[];
};

type Circle = {
  key: CircleKey;
  name: string;
  tagline: Bilingual;
  price: Bilingual;
  qualifying: Bilingual;
  sections: CircleSection[];
  emphasis: 'soft' | 'recommended' | 'private';
};

const CIRCLES: Circle[] = [
  {
    key: 'carte',
    name: 'Carte',
    tagline: { en: 'Your entry into TiP.', kr: '여정이 시작되는 곳' },
    price: { en: 'Free', kr: '무료' },
    qualifying: {
      en: 'Complimentary with your first TiP booking.',
      kr: '첫 TiP 예약과 함께 자동 가입 · 무료',
    },
    sections: [
      {
        heading: { en: 'Included benefits', kr: '포함 혜택' },
        items: [
          {
            en: 'Preferred hotel rates at 2,200+ partner hotels',
            kr: '전 세계 2,200개 이상 파트너 호텔 특별 요금',
          },
          { en: 'Daily breakfast for two', kr: '매일 조식 2인 포함' },
          { en: 'Stay Credit — $100 hotel credit per stay', kr: '스테이당 $100 호텔 크레딧' },
          { en: 'Room upgrade when available', kr: '객실 업그레이드 (가능 시)' },
          {
            en: 'Early check-in & late check-out when available',
            kr: '얼리 체크인 · 레이트 체크아웃 (가능 시)',
          },
          {
            en: 'Curated destination guides in the TiP app',
            kr: 'TiP 앱의 큐레이션된 도시 가이드',
          },
        ],
      },
    ],
    emphasis: 'soft',
  },
  {
    key: 'cercle',
    name: 'Cercle',
    tagline: {
      en: 'Where TiP learns your style.',
      kr: '당신의 취향이 스테이를 설계하기 시작하는 곳',
    },
    price: { en: 'Free', kr: '무료' },
    qualifying: {
      en: '$20,000 in annual TiP bookings, or application with member referral.',
      kr: '연간 $20,000 이상의 TiP 예약, 또는 기존 멤버 추천으로 신청',
    },
    sections: [
      {
        heading: { en: 'Cercle benefits', kr: 'Cercle 혜택' },
        items: [
          {
            en: 'Elevated Stay Credit — up to $200 per booking, for dining, spa, or experiences',
            kr: '엘리베이티드 스테이 크레딧 — 스테이당 최대 $200, 다이닝 · 스파 · 경험에 사용',
          },
          {
            en: 'Hotel Whisperer — the best room to request, told to you 24 hours before arrival',
            kr: '호텔 위스퍼러 — 체크인 24시간 전, 최적의 객실 번호 안내',
          },
          {
            en: 'Personalized Arrival — room prepared to your preferences (pillow, minibar, scent, flowers)',
            kr: '어라이벌 리추얼 — 베개 · 미니바 · 향 · 플라워 맞춤',
          },
          {
            en: 'Birthday Stay — dedicated credit and a private in-room welcome in your birthday month',
            kr: '버스데이 스테이 — 생일 달 전용 크레딧과 프라이빗 인룸 세레머니',
          },
          {
            en: 'Loyalty Night — one complimentary night after 15 nights with TiP partners',
            kr: '로열티 나이트 — TiP 파트너 호텔 누적 15박 시 1박 무료',
          },
          {
            en: 'Preference Profile — your style remembered across every booking',
            kr: '프리퍼런스 프로필 — 모든 예약에 걸쳐 기억되는 당신의 취향',
          },
          {
            en: 'Concierge Swap — skip the front desk; request through the TiP app, in Korean, day or night',
            kr: '콩시에르주 스왑 — 프런트 데스크 없이 TiP 앱에서 한국어로 24시간 요청',
          },
        ],
      },
    ],
    emphasis: 'soft',
  },
  {
    key: 'confidence',
    name: 'Confidence',
    tagline: { en: 'The hotel already knows you.', kr: '호텔이 이미 당신을 아는 곳' },
    price: { en: '₩3,500,000 / year (approx. $2,500)', kr: '연 ₩3,500,000' },
    qualifying: {
      en: '$60,000 in annual bookings, or 12+ months as a Cercle member with advisor referral. $500 welcome credit applied to your first qualifying stay.',
      kr: '연간 $60,000 이상의 TiP 예약, 또는 Cercle 멤버십 12개월 이상 + 어드바이저 추천. 가입 후 첫 스테이에 $500 웰컴 크레딧 자동 적용',
    },
    sections: [
      {
        heading: { en: 'Confidence benefits', kr: 'Confidence 혜택' },
        items: [
          {
            en: 'Enhanced Stay Credit — up to $300 per booking',
            kr: '인핸스드 스테이 크레딧 — 스테이당 최대 $300',
          },
          {
            en: 'The Morning After — guaranteed 4pm checkout at every TiP partner hotel',
            kr: '더 모닝 애프터 — 모든 TiP 파트너 호텔 오후 4시 체크아웃 보장',
          },
          {
            en: 'Two Rooms, One Rate — a second connecting room, free for up to 3 nights per year',
            kr: '투 룸즈, 원 레이트 — 커넥팅 룸 연 3박까지 무료',
          },
          {
            en: 'Pre-Stay Call — 15 minutes with your Travel Designer before every trip',
            kr: '프리 스테이 콜 — 여행 시작 전 트래블 디자이너와 15분 통화',
          },
          {
            en: 'Return Ritual — when you return to a hotel you have loved, they remember',
            kr: '리턴 리추얼 — 사랑했던 호텔로 돌아가면 와인, 조식, 객실 배치까지 기억',
          },
          {
            en: 'Signature Night — one complimentary night after 10 nights, annually',
            kr: '시그니처 나이트 — 연간 10박 이상 시 1박 무료',
          },
          {
            en: 'Priority Access — premium suites, peak dates, tasting menus, spa specialists',
            kr: '프라이어리티 액세스 — 프리미엄 스위트 · 성수기 · 테이스팅 메뉴 · 스파 우선 배정',
          },
          {
            en: 'Dedicated Travel Designer — one point of contact for every itinerary',
            kr: '데디케이티드 트래블 디자이너 — 단순 예약이 아닌 여정 설계 전담',
          },
          {
            en: 'Transfer Privilege — complimentary chauffeured arrival at select properties',
            kr: '트랜스퍼 프리빌리지 — 주요 파트너 호텔 무료 쇼퍼 어라이벌',
          },
          {
            en: 'Consortium Benefits — Virtuoso, Four Seasons Preferred, Rosewood Elite layered on top',
            kr: '컨소시엄 베네핏 — Virtuoso, Four Seasons Preferred, Rosewood Elite 추가 적용',
          },
        ],
      },
    ],
    emphasis: 'recommended',
  },
  {
    key: 'cenacle',
    name: 'Cénacle',
    tagline: { en: 'The inner circle.', kr: '초대로만 열리는 가장 안쪽의 원' },
    price: { en: '₩12,000,000 / year (approx. $8,500)', kr: '연 ₩12,000,000' },
    qualifying: {
      en: 'By invitation only. Limited to 10 new members per year.',
      kr: '초대로만. 연간 최대 10명에게만 초대',
    },
    sections: [
      {
        heading: { en: 'Access that cannot be bought', kr: '돈으로 살 수 없는 접근' },
        items: [
          {
            en: 'Private Stay Credit — up to $500 per booking, shaped to your preferences before arrival',
            kr: '프라이빗 스테이 크레딧 — 스테이당 최대 $500, 도착 전 취향 설계',
          },
          {
            en: 'The Empty Room Guarantee — twice a year, your room secured at any TiP partner hotel even when sold out',
            kr: '엠프티 룸 개런티 — 연 2회, 매진된 파트너 호텔도 객실 확보',
          },
          {
            en: 'First Night Privilege — pre-opening stays at Aman, Rosewood, Cheval Blanc, Six Senses',
            kr: '퍼스트 나이트 프리빌리지 — Aman · Rosewood · Cheval Blanc · Six Senses 프리오프닝 스테이',
          },
          {
            en: "The Editor's Room — once a year, access to a hotel's signature suite (Vogue, AD, Wallpaper)",
            kr: '더 에디터스 룸 — 연 1회, Vogue · AD · Wallpaper 촬영 시그니처 스위트',
          },
          {
            en: 'Anonymous Check-In — no name at the front desk, no ID scan visible to staff',
            kr: '어노니머스 체크인 — 익명 입실, 후문 · 전용 엘리베이터',
          },
          {
            en: 'Off-Market Stays — private villas, residences, and estates not listed publicly',
            kr: '오프마켓 스테이 — 비공개 빌라, 레지던스, 에스테이트',
          },
          {
            en: 'Unrestricted Access — rooms secured at fully committed properties through direct GM relationships',
            kr: '언리스트릭티드 액세스 — 완전 예약된 호텔에서도 GM 관계 기반 객실 확보',
          },
        ],
      },
      {
        heading: { en: 'Beyond the hotel', kr: '호텔 너머' },
        items: [
          {
            en: 'The Vault Collection — private buyer lounge access at Hermès Faubourg, Chanel Cambon, Cartier Place Vendôme',
            kr: '더 볼트 컬렉션 — Hermès · Chanel · Cartier 프라이빗 바이어 라운지 액세스',
          },
          {
            en: 'The Cénacle Table — once a year, an entire Michelin-starred restaurant for you and your guests',
            kr: '더 세나클 테이블 — 연 1회, 미슐랭 스타 레스토랑 통째 예약',
          },
          {
            en: 'Reservations Beyond the Hotel — tables at restaurants with no availability, private museum hours, closed-door ateliers',
            kr: '레저베이션 비욘드 더 호텔 — 예약 불가 레스토랑, 프라이빗 뮤지엄, 비공개 아틀리에',
          },
        ],
      },
      {
        heading: { en: 'Advisor & care', kr: 'Cénacle 어드바이저 & 케어' },
        items: [
          {
            en: '24/7 Dedicated Advisor — one person, every detail, end-to-end',
            kr: '24시간 전담 어드바이저 — 한 사람, 모든 디테일',
          },
          {
            en: 'Cénacle Cares — 24-hour crisis response anywhere in the world',
            kr: '세나클 케어스 — 전 세계 24시간 위기 대응',
          },
          {
            en: 'Private Jet Standby — once a year, a private jet held on 72-hour standby',
            kr: '프라이빗 제트 스탠바이 — 연 1회, 72시간 전 통보로 대기',
          },
        ],
      },
      {
        heading: { en: 'The circle & legacy', kr: '서클과 유산' },
        items: [
          {
            en: 'The Cénacle Soirée — private gatherings in Paris, Seoul, and beyond, three times a year',
            kr: '더 세나클 수와레 — 파리 · 서울 그리고 그 너머에서 연 3회 비공개 디너',
          },
          {
            en: 'Hotel Opening Invitations — seats at exclusive launch events',
            kr: '호텔 오프닝 인비테이션 — 비공개 런칭 이벤트 초대',
          },
          {
            en: 'Legacy Passport — Confidence membership extended to one family member, annual fee waived',
            kr: '레거시 패스포트 — 가족 1인에게 Confidence 멤버십, 연회비 면제',
          },
          {
            en: 'Jet & Yacht Coordination — discreetly arranged through trusted partners',
            kr: '제트 & 요트 코디네이션 — 신뢰 파트너를 통한 조용한 진행',
          },
          {
            en: 'Annual Maison Gift — a quiet gesture, chosen for you',
            kr: '어뉴얼 메종 기프트 — 당신을 위해 선택된 한 점',
          },
        ],
      },
    ],
    emphasis: 'private',
  },
];

// Map legacy MembershipTier values to the new circle keys.
// After tip-backend PR #4 lands the rename, this collapses to identity for
// circle keys; the legacy strings remain here for backward compatibility
// during rollout.
function tierFromMembership(membership: string | undefined): CircleKey {
  if (!membership) return 'carte';
  const m = membership.toLowerCase();
  if (m === 'cercle' || m === 'blue') return 'cercle';
  if (m === 'confidence' || m === 'silver' || m === 'gold') return 'confidence';
  if (m === 'cenacle' || m === 'cénacle' || m === 'black' || m === 'diamond') return 'cenacle';
  return 'carte';
}

export default function Membership() {
  const { lang } = useLanguage();
  const { data: session } = useSession();
  const en = lang === 'en';
  const currentTier = tierFromMembership(session?.user?.membership);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar activeLink="My Page" />
      <SubNav activeTab="Membership" />

      <section className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="text-center">
          <span className="text-[11px] font-semibold tracking-[4px] text-gold">
            {en ? 'TIP MEMBERSHIP' : 'TIP 멤버십'}
          </span>
          <h1 className="mt-3 font-primary text-[44px] italic leading-tight text-green-dark md:text-[56px]">
            Les Quatre Cercles
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-gray-text">
            {en
              ? 'Four circles. Each opens differently. Every stay is recognized, every preference remembered.'
              : '네 개의 원, 각기 다른 방식으로 열립니다. 모든 스테이는 특별하게 기억되고, 모든 취향은 섬세하게 반영됩니다.'}
          </p>
        </div>

        {/* Current tier banner */}
        <div className="mt-12 rounded-2xl bg-green-dark p-8 text-white shadow-md md:p-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[3px] text-gold">
                {en ? 'Your circle' : '현재 서클'}
              </p>
              <h2 className="mt-2 font-primary text-[36px] italic leading-tight">
                ◆ {CIRCLES.find((c) => c.key === currentTier)?.name}
              </h2>
              <p className="mt-2 text-[14px] text-white/80">
                {CIRCLES.find((c) => c.key === currentTier)?.tagline[en ? 'en' : 'kr']}
              </p>
            </div>
            <div className="md:max-w-md md:text-right">
              <p className="text-[12px] leading-relaxed text-white/70">
                {en
                  ? 'Below: every benefit available to TiP members, by circle. Your circle and the ones above show the benefits you enjoy today; the others are the path forward.'
                  : '아래는 각 서클의 모든 혜택입니다. 현재 서클과 그 이전 서클의 혜택을 누리고 계시며, 다음 서클은 앞으로의 여정을 보여드립니다.'}
              </p>
            </div>
          </div>
        </div>

        {/* Circles */}
        <div className="mt-12 space-y-8">
          {CIRCLES.map((circle) => {
            const isCurrent = circle.key === currentTier;
            const isPrivate = circle.emphasis === 'private';
            return (
              <div
                key={circle.key}
                className={`rounded-2xl p-8 md:p-10 ${
                  isPrivate
                    ? 'bg-green-dark text-white shadow-md'
                    : 'bg-white shadow-sm ring-1 ring-gray-border'
                } ${isCurrent && !isPrivate ? 'ring-2 ring-gold' : ''}`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-gold">◆</span>
                      <h3
                        className={`font-primary text-[34px] italic leading-tight ${
                          isPrivate ? 'text-white' : 'text-green-dark'
                        }`}
                      >
                        {circle.name}
                      </h3>
                      {isCurrent && (
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[2px] ${
                            isPrivate ? 'bg-gold text-green-dark' : 'bg-gold text-white'
                          }`}
                        >
                          {en ? 'Your Circle' : '현재 서클'}
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-2 text-[15px] ${
                        isPrivate ? 'text-white/70' : 'text-gray-text'
                      }`}
                    >
                      {circle.tagline[en ? 'en' : 'kr']}
                    </p>
                  </div>
                  <div className="md:text-right">
                    <p
                      className={`text-[20px] font-semibold ${
                        isPrivate ? 'text-white' : 'text-green-dark'
                      }`}
                    >
                      {circle.price[en ? 'en' : 'kr']}
                    </p>
                    <p
                      className={`mt-1 max-w-md text-[12px] leading-relaxed ${
                        isPrivate ? 'text-white/60' : 'text-gray-text'
                      }`}
                    >
                      {circle.qualifying[en ? 'en' : 'kr']}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  {circle.sections.map((section) => (
                    <div key={section.heading.en}>
                      <h4
                        className={`text-[11px] font-semibold uppercase tracking-[3px] ${
                          isPrivate ? 'text-gold' : 'text-gold'
                        }`}
                      >
                        {section.heading[en ? 'en' : 'kr']}
                      </h4>
                      <ul className="mt-3 space-y-2.5">
                        {section.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span
                              className={`mt-1.5 inline-block h-1 w-1 flex-shrink-0 rounded-full ${
                                isPrivate ? 'bg-gold' : 'bg-green-dark/60'
                              }`}
                            />
                            <span
                              className={`text-[13px] leading-relaxed ${
                                isPrivate ? 'text-white/85' : 'text-gray-text'
                              }`}
                            >
                              {item[en ? 'en' : 'kr']}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* How membership works table */}
        <div className="mt-16 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-border md:p-10">
          <h2 className="font-primary text-[28px] italic text-green-dark">
            {en ? 'How membership works' : '멤버십이 열리는 방식'}
          </h2>
          <p className="mt-2 text-[14px] text-gray-text">
            {en ? 'Four circles. Each opens differently.' : '서클 · 가입 기준 · 연회비'}
          </p>
          <div className="mt-6 overflow-hidden rounded-lg ring-1 ring-gray-border">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-gray-light text-[11px] uppercase tracking-[2px] text-gray-text">
                <tr>
                  <th className="px-5 py-3">{en ? 'Circle' : '서클'}</th>
                  <th className="px-5 py-3">{en ? 'Qualifying criteria' : '가입 기준'}</th>
                  <th className="px-5 py-3 text-right">{en ? 'Annual fee' : '연회비'}</th>
                </tr>
              </thead>
              <tbody>
                {CIRCLES.map((circle) => (
                  <tr key={circle.key} className="border-t border-gray-border">
                    <td className="px-5 py-3 font-primary text-[18px] italic text-green-dark">
                      ◆ {circle.name}
                    </td>
                    <td className="px-5 py-3 text-gray-text">
                      {circle.qualifying[en ? 'en' : 'kr']}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-green-dark">
                      {circle.price[en ? 'en' : 'kr']}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-center font-primary text-[18px] italic text-green-dark/70">
            {en ? 'Every circle brings you closer.' : '모든 서클은 당신을 더 가까이 불러옵니다.'}
          </p>
        </div>

        {/* Footnote */}
        <p className="mt-8 text-center text-[11px] leading-relaxed text-gray-text">
          {en
            ? 'Stay credits are applied to qualifying stays at TiP partner hotels and are not redeemable for cash. Benefits vary by property. Membership qualifications, annual fees, and benefits are reviewed annually and subject to change. Cénacle membership is by invitation, reviewed annually, and subject to community standards. TiP is a membership platform by Paris Class.'
            : '스테이 크레딧은 TiP 파트너 호텔의 자격 스테이에 적용되며 현금으로 교환되지 않습니다. 혜택은 호텔에 따라 다를 수 있습니다. 멤버십 가입 기준, 연회비, 혜택은 연간 검토되며 변경될 수 있습니다. Cénacle 멤버십은 초대 기반이며 연간 검토됩니다. TiP는 Paris Class의 멤버십 플랫폼입니다.'}
        </p>
      </section>

      <Footer />
    </div>
  );
}
