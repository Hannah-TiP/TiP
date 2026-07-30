'use client';

// Data-retention periods and account-deletion handling on this page mirror the
// canonical retention matrix committed at:
//   tip-backend/docs/business/account-deletion-retention-matrix.md (SMA-192)
// Any retention-policy change must update that doc and this page together.

import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

type Bilingual = { en: string; kr: string };

function L({ s, isEn }: { s: Bilingual; isEn: boolean }) {
  return <>{s[isEn ? 'en' : 'kr']}</>;
}

const COPY = {
  title: { en: 'Privacy Policy', kr: '개인정보처리방침' },
  lastUpdated: {
    en: 'Last updated: July 30, 2026',
    kr: '최종 수정일: 2026년 7월 30일',
  },
  intro: {
    en: 'Paris Class Co., Ltd. ("we," "us," or "our") operates the Travel in your Pocket platform (the "Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our Service. Please read this policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the Service.',
    kr: '주식회사 파리클래스(이하 "회사"라 합니다)는 Travel in your Pocket 플랫폼(이하 "서비스")을 운영합니다. 본 개인정보처리방침은 회원님이 서비스를 이용할 때 회사가 개인정보를 수집, 이용, 제공 및 보호하는 방법을 설명합니다. 본 방침을 주의 깊게 읽어 주시기 바라며, 본 개인정보처리방침에 동의하지 않으시는 경우 서비스 이용을 중단하여 주시기 바랍니다.',
  },
  sections: [
    {
      heading: {
        en: '1. Information We Collect',
        kr: '1. 수집하는 개인정보',
      },
      body: {
        en: 'We collect the following categories of information:\n\n- Account information: name, email address, password (stored in encrypted form), date of birth, city of residence, and language preference\n- Travel information: travel preferences and styles, trip requests, itineraries, booking history, wishlist, and reviews you submit\n- Concierge and support communications: messages you exchange with our AI concierge and customer support, including files you share\n- Payment records: amounts, currency, and transaction identifiers processed through our payment providers (we do not store card numbers or bank account details on our systems)\n- Social sign-in information: the account identifier and email address provided by Google, Kakao, or Naver when you sign in with a social account\n- Device and usage information: browser type, IP address, and pages visited\n- Cookies and similar tracking technologies (see Section 6)',
        kr: '회사는 다음과 같은 개인정보를 수집합니다:\n\n- 계정 정보: 이름, 이메일 주소, 비밀번호(암호화하여 저장), 생년월일, 거주 도시, 언어 설정\n- 여행 정보: 여행 선호도 및 스타일, 여행 요청, 일정, 예약 내역, 위시리스트, 작성하신 리뷰\n- 컨시어지 및 고객지원 대화: AI 컨시어지 및 고객센터와 주고받은 메시지와 첨부 파일\n- 결제 기록: 결제 대행사를 통해 처리된 금액, 통화, 거래 식별번호 (카드번호, 계좌번호 등 결제수단 정보는 회사 시스템에 저장하지 않습니다)\n- 소셜 로그인 정보: Google, Kakao, Naver 계정으로 로그인하실 때 제공되는 계정 식별자 및 이메일 주소\n- 기기 및 이용 정보: 브라우저 유형, IP 주소, 방문 페이지\n- 쿠키 및 유사 추적 기술 (제6조 참조)',
      },
    },
    {
      heading: {
        en: '2. How We Use Your Information',
        kr: '2. 개인정보의 이용 목적',
      },
      body: {
        en: 'We use the information we collect for the following purposes:\n\n- To provide, maintain, and improve our Service\n- To personalize your travel recommendations and concierge experience\n- To process bookings and payments\n- To communicate with you about your account and trips\n- To send promotional communications (with your consent)\n- To detect, prevent, and address technical issues and fraud',
        kr: '회사는 수집한 개인정보를 다음과 같은 목적으로 이용합니다:\n\n- 서비스 제공, 유지 및 개선\n- 맞춤형 여행 추천 및 컨시어지 경험 제공\n- 예약 및 결제 처리\n- 계정 및 여행 관련 안내\n- 프로모션 정보 발송 (동의하신 경우에 한함)\n- 기술적 문제 및 부정 이용의 탐지, 예방 및 해결',
      },
    },
    {
      heading: {
        en: '3. Information Sharing and Disclosure',
        kr: '3. 개인정보의 제공 및 처리위탁',
      },
      body: {
        en: 'We share your personal information only in the following circumstances:\n\n- With hotel partners and travel service providers, to the extent needed to fulfill your bookings\n- With service providers who process data on our behalf: cloud hosting and storage (Amazon Web Services), payment processing (Flywire), and email delivery (Brevo)\n- To comply with legal obligations or respond to lawful requests from public authorities\n- To protect our rights, privacy, safety, or property\n- In connection with a merger, acquisition, or sale of assets\n\nWe do not sell your personal information to third parties.',
        kr: '회사는 다음의 경우에 한하여 개인정보를 제공하거나 처리를 위탁합니다:\n\n- 예약 이행에 필요한 범위 내에서 호텔 파트너 및 여행 서비스 제공업체에 제공\n- 회사를 대신하여 개인정보를 처리하는 수탁업체: 클라우드 호스팅 및 저장(Amazon Web Services), 결제 처리(Flywire), 이메일 발송(Brevo)\n- 법적 의무의 이행 또는 공공기관의 적법한 요청에 대한 대응\n- 회사의 권리, 프라이버시, 안전 또는 재산의 보호\n- 합병, 인수 또는 자산 매각과 관련된 경우\n\n회사는 회원님의 개인정보를 제3자에게 판매하지 않습니다.',
      },
    },
    {
      heading: {
        en: '4. Data Retention',
        kr: '4. 개인정보의 보유 및 파기',
      },
      body: {
        en: 'We retain your personal information while your account is active. When you delete your account, or when information is no longer needed for the purpose it was collected for, we destroy it without delay — except for records that applicable law requires us to keep for a fixed period. Records kept under such a statutory duty are anonymized so they no longer identify you, stored separately from active user data, and permanently erased once the retention period ends.\n\nRetention periods by category:\n\n- Contract and withdrawal-of-subscription records: 5 years (Act on Consumer Protection in Electronic Commerce)\n- Payment and supply-of-services records, including bookings, invoices, travel credits, and promotional-code redemptions: 5 years (same Act)\n- Consumer complaint and dispute records: 3 years (same Act)\n- Display and advertising records: 6 months (same Act)\n- Personal-information-system access logs: at least 1 year (PIPA safeguard standards)\n- All other personal information — your profile, trips and itineraries, reviews, AI concierge conversations, wishlist, uploaded files, and sign-in details — is permanently deleted when your account is purged, 30 days after your deletion request (see Section 5.1)',
        kr: '회사는 회원의 계정이 유지되는 동안 개인정보를 보유합니다. 회원 탈퇴 시 또는 수집·이용 목적이 달성된 때에는, 관련 법령에 따라 일정 기간 보존이 요구되는 기록을 제외하고 해당 개인정보를 지체 없이 파기합니다. 법령에 따라 보존하는 기록은 회원님을 식별할 수 없도록 비식별 처리한 후 다른 개인정보와 분리하여 보관하며, 보존 기간이 경과하면 영구적으로 파기합니다.\n\n항목별 보유 기간:\n\n- 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)\n- 대금결제 및 재화 등의 공급에 관한 기록(예약, 청구서, 여행 크레딧, 프로모션 코드 사용 내역 포함): 5년 (동법)\n- 소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (동법)\n- 표시·광고에 관한 기록: 6개월 (동법)\n- 개인정보처리시스템 접속기록: 1년 이상 (개인정보의 안전성 확보조치 기준)\n- 그 밖의 모든 개인정보(프로필, 여행 및 일정, 리뷰, AI 컨시어지 대화, 위시리스트, 업로드한 파일, 로그인 정보 등): 탈퇴 신청 후 30일이 경과하여 탈퇴 처리가 완료되는 시점에 영구 삭제 (제5-1조 참조)',
      },
    },
    {
      heading: {
        en: '5. Your Rights',
        kr: '5. 이용자의 권리',
      },
      body: {
        en: 'You have the following rights regarding your personal information:\n\n- Right to access your personal information\n- Right to correct inaccurate information\n- Right to delete your personal information, including deleting your account\n- Right to request suspension of processing\n- Right to withdraw consent at any time\n\nUnder Korea\'s Personal Information Protection Act (PIPA), you may exercise these rights yourself or through an authorized representative, and we will act on verified requests without undue delay. Where a request cannot be honored — for example, where retention is required by law — we will explain the reason.\n\nIf you are located in the European Union, you additionally have your rights under the GDPR, including the right to erasure ("right to be forgotten"), the right to restrict or object to processing, and the right to data portability. Records we must keep under Korean retention law are irreversibly anonymized so that they can no longer be linked to you.\n\nHow to exercise your rights: you can request deletion of your account from your account settings in My Page, or contact us at travelmate@travelinyourpocket.com (phone: +82-2-6013-7775). For your protection, we verify your identity before acting on a deletion request. See Section 5.1 for what happens when you delete your account.',
        kr: '회원님은 자신의 개인정보에 대하여 다음과 같은 권리를 가집니다:\n\n- 개인정보 열람 요구권\n- 오류 등이 있을 경우 정정 요구권\n- 개인정보 삭제 요구권(계정 삭제 포함)\n- 처리정지 요구권\n- 동의 철회권\n\n개인정보 보호법에 따라 회원님은 이러한 권리를 본인 또는 적법한 대리인을 통해 행사하실 수 있으며, 회사는 본인 확인을 거친 요청에 대해 지체 없이 조치합니다. 법령상 보존 의무 등으로 요청을 이행할 수 없는 경우에는 그 사유를 안내해 드립니다.\n\n유럽연합(EU)에 거주하시는 경우 GDPR에 따른 권리, 즉 삭제권("잊힐 권리"), 처리 제한권 및 반대권, 데이터 이동권 등을 추가로 보장받습니다. 한국 법령에 따라 보존해야 하는 기록은 회원님과 다시 연결될 수 없도록 비가역적으로 비식별 처리됩니다.\n\n권리 행사 방법: 마이페이지의 계정 설정에서 직접 계정 삭제를 신청하시거나, travelmate@travelinyourpocket.com(전화: 02-6013-7775)으로 문의해 주시기 바랍니다. 회원님의 보호를 위해 계정 삭제 요청은 본인 확인 절차를 거친 후 처리됩니다. 계정 삭제 시의 구체적인 처리 내용은 제5-1조를 참조하시기 바랍니다.',
      },
    },
    {
      heading: {
        en: '5.1 Account Deletion',
        kr: '5-1. 회원 탈퇴(계정 삭제)',
      },
      body: {
        en: "When you delete your account:\n\n- Your account is deactivated immediately and you are signed out of all devices. Active sessions, sign-in tokens, and social-login links are removed right away.\n- A 30-day grace period follows. If you change your mind, contact us at travelmate@travelinyourpocket.com within 30 days and we will cancel the deletion and restore your account.\n- After 30 days, the deletion becomes irreversible. We permanently erase your profile, trips and itineraries, reviews, AI concierge conversations, wishlist, uploaded files, and sign-in details, and we instruct our service providers to do the same.\n\nWhat we keep, and why:\n\n- Payment, booking, and contract records are kept for 5 years, and customer complaint and dispute records for 3 years, as required by the Act on Consumer Protection in Electronic Commerce. These records are irreversibly anonymized — they no longer identify you — and stored separately until their retention period ends, then permanently erased.\n- Payment providers (such as Flywire) retain transaction records under their own legal obligations as independent controllers.\n- If you took part in a referral, only your side of the referral record is anonymized; the other member's record is unaffected.",
        kr: '계정을 삭제하시는 경우 다음과 같이 처리됩니다:\n\n- 탈퇴 신청 즉시 계정이 비활성화되고 모든 기기에서 로그아웃됩니다. 로그인 세션, 인증 토큰 및 소셜 로그인 연동 정보는 즉시 삭제됩니다.\n- 이후 30일의 유예 기간이 적용됩니다. 마음이 바뀌신 경우 30일 이내에 travelmate@travelinyourpocket.com으로 연락해 주시면 탈퇴를 취소하고 계정을 복구해 드립니다.\n- 30일이 경과하면 탈퇴를 취소할 수 없습니다. 프로필, 여행 및 일정, 리뷰, AI 컨시어지 대화, 위시리스트, 업로드한 파일, 로그인 정보가 영구적으로 파기되며, 수탁업체에도 동일한 파기를 지시합니다.\n\n보존하는 기록과 그 사유:\n\n- 전자상거래 등에서의 소비자보호에 관한 법률에 따라 대금결제·예약·계약에 관한 기록은 5년간, 소비자 불만 및 분쟁처리에 관한 기록은 3년간 보존합니다. 해당 기록은 회원님을 식별할 수 없도록 비가역적으로 비식별 처리한 후 다른 정보와 분리하여 보관하며, 보존 기간이 경과하면 영구적으로 파기합니다.\n- 결제 대행사(Flywire 등)는 독립적인 개인정보처리자로서 자체 법적 의무에 따라 거래 기록을 보관할 수 있습니다.\n- 추천인 관계가 있는 경우 탈퇴하시는 회원 측의 기록만 비식별 처리되며, 상대방 회원의 기록에는 영향이 없습니다.',
      },
    },
    {
      heading: {
        en: '6. Cookies and Tracking Technologies',
        kr: '6. 쿠키 및 추적 기술',
      },
      body: {
        en: 'We use the following categories of cookies:\n\n- Necessary cookies: Required for core functionality (session management, security). These cannot be disabled.\n- Analytics cookies: Help us understand how visitors interact with our website. These are only activated with your consent.\n- Marketing cookies: Used to deliver relevant advertisements. These are only activated with your consent.\n\nYou can manage your cookie preferences at any time using the "Cookie Settings" link in the footer of our website.\n\n{TODO: List specific cookies and their purposes when analytics/marketing tools are implemented}',
        kr: '당사는 다음과 같은 카테고리의 쿠키를 사용합니다:\n\n- 필수 쿠키: 핵심 기능(세션 관리, 보안)에 필요합니다. 비활성화할 수 없습니다.\n- 분석 쿠키: 방문자가 웹사이트와 상호작용하는 방식을 이해하는 데 도움이 됩니다. 귀하의 동의가 있을 때만 활성화됩니다.\n- 마케팅 쿠키: 관련 광고를 전달하는 데 사용됩니다. 귀하의 동의가 있을 때만 활성화됩니다.\n\n웹사이트 하단의 "쿠키 설정" 링크를 통해 언제든지 쿠키 환경설정을 관리할 수 있습니다.\n\n{TODO: 분석/마케팅 도구 도입 시 구체적인 쿠키 목록 및 용도 추가}',
      },
    },
    {
      heading: {
        en: '7. International Data Transfers',
        kr: '7. 국외 개인정보 이전',
      },
      body: {
        en: 'Your information may be transferred to and processed in countries other than your country of residence. We host our Service on Amazon Web Services infrastructure, and some of our service providers — including Flywire (payment processing) and Brevo (email delivery) — process data in the United States and the European Union.\n\nWhere personal information is transferred abroad, we disclose the transfer and obtain any consent required under PIPA, and we put contractual safeguards in place with our providers, such as data-processing agreements and, for EU users, standard contractual clauses.',
        kr: '회원님의 정보는 거주 국가 이외의 국가로 이전되어 처리될 수 있습니다. 회사는 Amazon Web Services 인프라에서 서비스를 운영하며, 결제 처리(Flywire), 이메일 발송(Brevo) 등 일부 수탁업체는 미국 및 유럽연합에서 데이터를 처리합니다.\n\n개인정보를 국외로 이전하는 경우 회사는 개인정보 보호법에 따라 이전 사실을 고지하고 필요한 동의를 받으며, 수탁업체와 개인정보 처리 위탁 계약 및 (EU 이용자의 경우) 표준계약조항 등 계약적 보호조치를 마련합니다.',
      },
    },
    {
      heading: {
        en: "8. Children's Privacy",
        kr: '8. 아동의 개인정보',
      },
      body: {
        en: 'Our Service is not directed to children. We do not knowingly collect personal information from children under the age of 16, and we do not collect personal information from children under 14 without the consent of a legal guardian, as required by PIPA. If you are a parent or guardian and believe your child has provided us with personal information, please contact us and we will delete it.',
        kr: '회사의 서비스는 아동을 대상으로 하지 않습니다. 회사는 16세 미만 아동의 개인정보를 의도적으로 수집하지 않으며, 개인정보 보호법에 따라 만 14세 미만 아동의 개인정보는 법정대리인의 동의 없이 수집하지 않습니다. 보호자로서 자녀가 회사에 개인정보를 제공한 사실을 알게 되신 경우 회사에 연락해 주시면 해당 정보를 삭제하겠습니다.',
      },
    },
    {
      heading: {
        en: '9. Changes to This Policy',
        kr: '9. 방침 변경',
      },
      body: {
        en: 'We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.',
        kr: '당사는 본 개인정보처리방침을 수시로 업데이트할 수 있습니다. 중요한 변경 사항이 있는 경우 이 페이지에 새 방침을 게시하고 "최종 수정일"을 업데이트하여 알려드리겠습니다. 변경 사항이 있는지 본 방침을 정기적으로 확인하시기 바랍니다.',
      },
    },
    {
      heading: {
        en: '10. Contact Us',
        kr: '10. 문의처',
      },
      body: {
        en: 'If you have any questions about this Privacy Policy or our handling of your personal information, please contact us:\n\nParis Class Co., Ltd.\n59, Seocho-daero 77-gil, Seoul (06611), Republic of Korea\nBusiness registration no.: 887-86-03126 · E-commerce registration no.: 2023-Seoul Jung-gu-1031\nEmail: travelmate@travelinyourpocket.com\nPhone: +82-2-6013-7775\nPrivacy Officer: the Representative Director (contact via the email above)',
        kr: '본 개인정보처리방침 또는 개인정보 처리에 관하여 궁금하신 사항은 아래로 문의해 주시기 바랍니다:\n\n주식회사 파리클래스\n서울특별시 서초대로 77길 59 (06611)\n사업자등록번호: 887-86-03126 · 통신판매업신고: 2023-서울중구-1031\n이메일: travelmate@travelinyourpocket.com\n전화: 02-6013-7775\n개인정보 보호책임자: 대표이사 (문의는 위 이메일로 접수해 주시기 바랍니다)',
      },
    },
  ],
};

export default function PrivacyPolicyPage() {
  const { lang } = useLanguage();
  const isEn = lang === 'en';

  return (
    <main className="bg-gray-light text-[#1A1A18]">
      {/* Hero */}
      <section className="bg-green-dark px-6 pb-16 pt-32 sm:px-10 lg:px-[100px]">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
            <span className="block h-px w-8 bg-gold" />
            {isEn ? 'Legal' : '법률'}
          </div>
          <h1 className="mt-4 font-primary text-[clamp(2rem,4vw,3.5rem)] font-normal leading-[1.1] text-white">
            <L s={COPY.title} isEn={isEn} />
          </h1>
          <p className="mt-4 text-[13px] text-white/50">
            <L s={COPY.lastUpdated} isEn={isEn} />
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="px-6 py-16 sm:px-10 lg:px-[100px]">
        <div className="mx-auto max-w-3xl">
          <p className="text-[15px] leading-[1.9] text-gray-text">
            <L s={COPY.intro} isEn={isEn} />
          </p>

          <div className="mt-12 space-y-10">
            {COPY.sections.map((section) => (
              <div key={section.heading.en}>
                <h2 className="font-primary text-[1.3rem] font-normal text-green-dark">
                  <L s={section.heading} isEn={isEn} />
                </h2>
                <p className="mt-3 whitespace-pre-line text-[14px] leading-[1.9] text-gray-text">
                  <L s={section.body} isEn={isEn} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
