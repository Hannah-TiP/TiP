'use client';

import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

type Bilingual = { en: string; kr: string };

function L({ s, isEn }: { s: Bilingual; isEn: boolean }) {
  return <>{s[isEn ? 'en' : 'kr']}</>;
}

const COPY = {
  title: { en: 'Privacy Policy', kr: '개인정보처리방침' },
  lastUpdated: {
    en: 'Last updated: {TODO: insert date}',
    kr: '최종 수정일: {TODO: 날짜 입력}',
  },
  intro: {
    en: '{TODO: Company Legal Name} ("we," "us," or "our") operates the Travel in your Pocket platform (the "Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our Service. Please read this policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the Service.',
    kr: '{TODO: 회사 법적 명칭} (이하 "회사")은 Travel in your Pocket 플랫폼(이하 "서비스")을 운영합니다. 본 개인정보처리방침은 귀하가 서비스를 이용할 때 당사가 귀하의 개인정보를 수집, 사용, 공개 및 보호하는 방법에 대해 설명합니다. 본 방침을 주의 깊게 읽어주시기 바랍니다. 본 개인정보처리방침의 조건에 동의하지 않으시면 서비스에 접근하지 마시기 바랍니다.',
  },
  sections: [
    {
      heading: {
        en: '1. Information We Collect',
        kr: '1. 수집하는 개인정보',
      },
      body: {
        en: 'We may collect the following categories of information:\n\n- Personal identification information (name, email address, date of birth)\n- Travel preferences and booking history\n- Device and usage information (browser type, IP address, pages visited)\n- Cookies and similar tracking technologies (see Section 6)\n\n{TODO: Review and update based on actual data collection practices}',
        kr: '당사는 다음과 같은 카테고리의 정보를 수집할 수 있습니다:\n\n- 개인 식별 정보 (이름, 이메일 주소, 생년월일)\n- 여행 선호도 및 예약 내역\n- 기기 및 사용 정보 (브라우저 유형, IP 주소, 방문 페이지)\n- 쿠키 및 유사 추적 기술 (제6조 참조)\n\n{TODO: 실제 데이터 수집 관행에 따라 검토 및 업데이트}',
      },
    },
    {
      heading: {
        en: '2. How We Use Your Information',
        kr: '2. 개인정보의 이용 목적',
      },
      body: {
        en: 'We use the information we collect for the following purposes:\n\n- To provide, maintain, and improve our Service\n- To personalize your travel recommendations and concierge experience\n- To process bookings and payments\n- To communicate with you about your account and trips\n- To send promotional communications (with your consent)\n- To detect, prevent, and address technical issues and fraud\n\n{TODO: Review and finalize based on actual data usage}',
        kr: '당사는 수집한 정보를 다음과 같은 목적으로 사용합니다:\n\n- 서비스 제공, 유지 및 개선\n- 맞춤형 여행 추천 및 컨시어지 경험 제공\n- 예약 및 결제 처리\n- 계정 및 여행 관련 커뮤니케이션\n- 프로모션 커뮤니케이션 발송 (동의한 경우)\n- 기술적 문제 및 사기 탐지, 예방 및 해결\n\n{TODO: 실제 데이터 사용에 따라 검토 및 확정}',
      },
    },
    {
      heading: {
        en: '3. Information Sharing and Disclosure',
        kr: '3. 개인정보의 공유 및 공개',
      },
      body: {
        en: 'We may share your personal information in the following circumstances:\n\n- With hotel partners and service providers to fulfill your bookings\n- With third-party service providers who assist in operating our Service\n- To comply with legal obligations or respond to lawful requests\n- To protect our rights, privacy, safety, or property\n- In connection with a merger, acquisition, or sale of assets\n\nWe do not sell your personal information to third parties.\n\n{TODO: Review and update based on actual data sharing practices}',
        kr: '당사는 다음과 같은 상황에서 귀하의 개인정보를 공유할 수 있습니다:\n\n- 예약 이행을 위해 호텔 파트너 및 서비스 제공업체와 공유\n- 서비스 운영을 지원하는 제3자 서비스 제공업체와 공유\n- 법적 의무 이행 또는 적법한 요청에 대응\n- 당사의 권리, 개인정보, 안전 또는 재산 보호\n- 합병, 인수 또는 자산 매각과 관련하여\n\n당사는 귀하의 개인정보를 제3자에게 판매하지 않습니다.\n\n{TODO: 실제 데이터 공유 관행에 따라 검토 및 업데이트}',
      },
    },
    {
      heading: {
        en: '4. Data Retention',
        kr: '4. 개인정보의 보유 및 파기',
      },
      body: {
        en: 'We retain your personal information for as long as your account is active or as needed to provide you with our Service. We will also retain and use your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements.\n\n{TODO: Specify retention periods for each data category}',
        kr: '당사는 귀하의 계정이 활성화된 동안 또는 서비스 제공에 필요한 기간 동안 귀하의 개인정보를 보유합니다. 또한 법적 의무 이행, 분쟁 해결 및 계약 이행에 필요한 범위에서 귀하의 정보를 보유하고 사용합니다.\n\n{TODO: 각 데이터 카테고리별 보유 기간 명시}',
      },
    },
    {
      heading: {
        en: '5. Your Rights',
        kr: '5. 이용자의 권리',
      },
      body: {
        en: 'Depending on your jurisdiction, you may have the following rights regarding your personal data:\n\n- Right to access your personal information\n- Right to correct inaccurate information\n- Right to delete your personal information\n- Right to restrict or object to processing\n- Right to data portability\n- Right to withdraw consent\n\nTo exercise any of these rights, please contact us at {TODO: privacy contact email}.\n\n{TODO: Add CCPA-specific rights section if applicable}\n{TODO: Add GDPR-specific rights section if applicable}',
        kr: '귀하의 관할 지역에 따라 귀하의 개인정보에 대해 다음과 같은 권리를 가질 수 있습니다:\n\n- 개인정보 열람권\n- 부정확한 정보 정정권\n- 개인정보 삭제권\n- 처리 제한 또는 이의 제기권\n- 데이터 이동권\n- 동의 철회권\n\n이러한 권리를 행사하려면 {TODO: 개인정보 보호 담당자 이메일}로 연락해 주시기 바랍니다.\n\n{TODO: 해당되는 경우 개인정보보호법(PIPA) 관련 권리 섹션 추가}',
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
        en: 'Your information may be transferred to and processed in countries other than the country in which you are resident. These countries may have data protection laws that are different from the laws of your country.\n\n{TODO: Specify data transfer mechanisms (e.g., Standard Contractual Clauses) and list countries where data is processed}',
        kr: '귀하의 정보는 귀하가 거주하는 국가 이외의 국가로 이전되어 처리될 수 있습니다. 해당 국가의 데이터 보호법은 귀하의 국가와 다를 수 있습니다.\n\n{TODO: 데이터 이전 메커니즘(예: 표준 계약 조항) 및 데이터가 처리되는 국가 명시}',
      },
    },
    {
      heading: {
        en: "8. Children's Privacy",
        kr: '8. 아동의 개인정보',
      },
      body: {
        en: 'Our Service is not directed to children under the age of 16. We do not knowingly collect personal information from children under 16. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.\n\n{TODO: Verify minimum age requirement with legal counsel}',
        kr: '당사의 서비스는 16세 미만의 아동을 대상으로 하지 않습니다. 당사는 16세 미만 아동의 개인정보를 의도적으로 수집하지 않습니다. 보호자로서 귀하의 자녀가 당사에 개인정보를 제공했다고 판단되면 당사에 연락해 주시기 바랍니다.\n\n{TODO: 법률 자문을 받아 최소 연령 요건 확인}',
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
        en: 'If you have any questions about this Privacy Policy, please contact us:\n\n{TODO: Company Legal Name}\n{TODO: Street Address}\n{TODO: City, Country, Postal Code}\nEmail: {TODO: privacy@example.com}\nData Protection Officer: {TODO: DPO name and contact}',
        kr: '본 개인정보처리방침에 대해 궁금한 점이 있으시면 아래로 연락해 주시기 바랍니다:\n\n{TODO: 회사 법적 명칭}\n{TODO: 주소}\n{TODO: 시, 국가, 우편번호}\n이메일: {TODO: privacy@example.com}\n개인정보 보호책임자: {TODO: 보호책임자 이름 및 연락처}',
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
