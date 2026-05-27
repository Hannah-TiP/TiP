'use client';

import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

type Bilingual = { en: string; kr: string };

function L({ s, isEn }: { s: Bilingual; isEn: boolean }) {
  return <>{s[isEn ? 'en' : 'kr']}</>;
}

const COPY = {
  title: { en: 'Terms of Service', kr: '이용약관' },
  lastUpdated: {
    en: 'Last updated: {TODO: insert date}',
    kr: '최종 수정일: {TODO: 날짜 입력}',
  },
  intro: {
    en: 'Welcome to Travel in your Pocket. These Terms of Service ("Terms") govern your access to and use of the Travel in your Pocket platform and services (the "Service") operated by {TODO: Company Legal Name} ("we," "us," or "our"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access the Service.',
    kr: 'Travel in your Pocket에 오신 것을 환영합니다. 본 이용약관(이하 "약관")은 {TODO: 회사 법적 명칭}(이하 "회사")이 운영하는 Travel in your Pocket 플랫폼 및 서비스(이하 "서비스")에 대한 귀하의 접근 및 이용을 규정합니다. 서비스에 접근하거나 이용함으로써 귀하는 본 약관에 동의하는 것으로 간주됩니다. 본 약관에 동의하지 않으시면 서비스에 접근하지 마시기 바랍니다.',
  },
  sections: [
    {
      heading: { en: '1. Eligibility', kr: '1. 이용 자격' },
      body: {
        en: 'You must be at least 16 years of age to use the Service. By using the Service, you represent and warrant that you meet this eligibility requirement.\n\n{TODO: Verify minimum age requirement with legal counsel}',
        kr: '서비스를 이용하려면 만 16세 이상이어야 합니다. 서비스를 이용함으로써 귀하는 이 자격 요건을 충족함을 표명하고 보증합니다.\n\n{TODO: 법률 자문을 받아 최소 연령 요건 확인}',
      },
    },
    {
      heading: {
        en: '2. Account Registration',
        kr: '2. 계정 등록',
      },
      body: {
        en: 'To access certain features of the Service, you must create an account. You agree to:\n\n- Provide accurate and complete registration information\n- Maintain the security of your account credentials\n- Notify us immediately of any unauthorized use of your account\n- Accept responsibility for all activities that occur under your account\n\n{TODO: Review account requirements with legal counsel}',
        kr: '서비스의 특정 기능에 접근하려면 계정을 생성해야 합니다. 귀하는 다음 사항에 동의합니다:\n\n- 정확하고 완전한 등록 정보 제공\n- 계정 자격 증명의 보안 유지\n- 계정의 무단 사용을 즉시 통보\n- 계정에서 발생하는 모든 활동에 대한 책임 수용\n\n{TODO: 법률 자문을 받아 계정 요건 검토}',
      },
    },
    {
      heading: {
        en: '3. Service Description',
        kr: '3. 서비스 설명',
      },
      body: {
        en: 'Travel in your Pocket is a luxury travel concierge platform that provides:\n\n- AI-powered travel recommendations and planning\n- Access to curated luxury hotel partnerships\n- Personalized itinerary creation\n- Concierge assistance for bookings and travel arrangements\n\nWe reserve the right to modify, suspend, or discontinue any part of the Service at any time.\n\n{TODO: Expand service description based on current offerings}',
        kr: 'Travel in your Pocket은 다음을 제공하는 럭셔리 여행 컨시어지 플랫폼입니다:\n\n- AI 기반 여행 추천 및 계획\n- 선별된 럭셔리 호텔 파트너십 이용\n- 맞춤형 여행 일정 제작\n- 예약 및 여행 준비를 위한 컨시어지 지원\n\n당사는 서비스의 일부를 언제든지 수정, 중단 또는 중지할 권리를 보유합니다.\n\n{TODO: 현재 제공 서비스에 따라 서비스 설명 확대}',
      },
    },
    {
      heading: {
        en: '4. Bookings and Payments',
        kr: '4. 예약 및 결제',
      },
      body: {
        en: 'When you make a booking through our Service:\n\n- All prices are displayed in the indicated currency and may be subject to additional taxes and fees\n- Payment is processed through our secure payment partners\n- Cancellation and refund policies vary by hotel and service provider\n- We act as an intermediary between you and the service providers\n\n{TODO: Add specific cancellation policy details}\n{TODO: Add payment processor information}\n{TODO: Add currency conversion terms}',
        kr: '서비스를 통해 예약할 때:\n\n- 모든 가격은 표시된 통화로 표시되며 추가 세금 및 수수료가 부과될 수 있습니다\n- 결제는 안전한 결제 파트너를 통해 처리됩니다\n- 취소 및 환불 정책은 호텔 및 서비스 제공업체에 따라 다릅니다\n- 당사는 귀하와 서비스 제공업체 간의 중개자 역할을 합니다\n\n{TODO: 구체적인 취소 정책 세부사항 추가}\n{TODO: 결제 처리업체 정보 추가}\n{TODO: 환율 전환 조건 추가}',
      },
    },
    {
      heading: {
        en: '5. Membership Tiers',
        kr: '5. 멤버십 등급',
      },
      body: {
        en: 'Our Service offers membership tiers with varying levels of benefits and access. Membership tier placement is determined at the sole discretion of {TODO: Company Legal Name} based on booking history, engagement, and other factors.\n\n{TODO: Detail membership tier structure, benefits, and upgrade/downgrade criteria}',
        kr: '당사 서비스는 다양한 혜택과 접근 수준의 멤버십 등급을 제공합니다. 멤버십 등급 배치는 예약 내역, 참여도 및 기타 요소를 기반으로 {TODO: 회사 법적 명칭}의 단독 재량에 따라 결정됩니다.\n\n{TODO: 멤버십 등급 구조, 혜택 및 업그레이드/다운그레이드 기준 상세 설명}',
      },
    },
    {
      heading: {
        en: '6. Intellectual Property',
        kr: '6. 지적 재산권',
      },
      body: {
        en: 'The Service and its contents, including but not limited to text, graphics, logos, images, and software, are the property of {TODO: Company Legal Name} and are protected by applicable intellectual property laws. You may not reproduce, distribute, modify, or create derivative works of any content without our prior written consent.\n\n{TODO: Add specific trademark and copyright notices}',
        kr: '텍스트, 그래픽, 로고, 이미지 및 소프트웨어를 포함하되 이에 국한되지 않는 서비스 및 그 콘텐츠는 {TODO: 회사 법적 명칭}의 자산이며 관련 지적 재산권법에 의해 보호됩니다. 당사의 사전 서면 동의 없이 콘텐츠를 복제, 배포, 수정하거나 파생 저작물을 만들 수 없습니다.\n\n{TODO: 구체적인 상표 및 저작권 고지 추가}',
      },
    },
    {
      heading: {
        en: '7. User Conduct',
        kr: '7. 이용자 행위 규정',
      },
      body: {
        en: 'You agree not to:\n\n- Use the Service for any unlawful purpose\n- Attempt to gain unauthorized access to any part of the Service\n- Interfere with or disrupt the Service or servers\n- Upload malicious content or engage in harmful activities\n- Impersonate any person or entity\n- Scrape, mine, or extract data from the Service without permission\n\nWe reserve the right to suspend or terminate accounts that violate these terms.',
        kr: '귀하는 다음 행위를 하지 않을 것에 동의합니다:\n\n- 불법적인 목적으로 서비스 이용\n- 서비스의 어떤 부분에 대한 무단 접근 시도\n- 서비스 또는 서버 방해 또는 중단\n- 악성 콘텐츠 업로드 또는 유해한 활동 참여\n- 타인 또는 단체 사칭\n- 허가 없이 서비스에서 데이터 스크래핑, 마이닝 또는 추출\n\n당사는 본 약관을 위반하는 계정을 정지하거나 해지할 권리를 보유합니다.',
      },
    },
    {
      heading: {
        en: '8. Limitation of Liability',
        kr: '8. 책임의 제한',
      },
      body: {
        en: 'To the maximum extent permitted by applicable law, {TODO: Company Legal Name} shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or other intangible losses, resulting from your use of or inability to use the Service.\n\n{TODO: Review liability limitations with legal counsel for applicable jurisdictions}',
        kr: '관련 법률이 허용하는 최대 범위 내에서, {TODO: 회사 법적 명칭}은 서비스 이용 또는 이용 불능으로 인한 이익 손실, 데이터 손실 또는 기타 무형 손실을 포함하되 이에 국한되지 않는 간접적, 부수적, 특별, 결과적 또는 징벌적 손해에 대해 책임을 지지 않습니다.\n\n{TODO: 해당 관할 지역에 대한 책임 제한 사항을 법률 자문과 함께 검토}',
      },
    },
    {
      heading: {
        en: '9. Governing Law',
        kr: '9. 준거법',
      },
      body: {
        en: 'These Terms shall be governed by and construed in accordance with the laws of {TODO: jurisdiction}, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be resolved in the courts of {TODO: jurisdiction}.\n\n{TODO: Determine applicable jurisdiction with legal counsel}',
        kr: '본 약관은 {TODO: 관할 지역}의 법률에 따라 규율되고 해석됩니다. 본 약관에서 발생하는 모든 분쟁은 {TODO: 관할 지역}의 법원에서 해결됩니다.\n\n{TODO: 법률 자문과 함께 적용 관할 지역 결정}',
      },
    },
    {
      heading: {
        en: '10. Changes to These Terms',
        kr: '10. 약관 변경',
      },
      body: {
        en: 'We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on this page and updating the "Last updated" date. Your continued use of the Service after any changes constitutes your acceptance of the new Terms.',
        kr: '당사는 언제든지 본 약관을 수정할 권리를 보유합니다. 중요한 변경 사항이 있는 경우 이 페이지에 업데이트된 약관을 게시하고 "최종 수정일"을 업데이트하여 알려드리겠습니다. 변경 후 서비스를 계속 이용하시면 새 약관에 동의하는 것으로 간주됩니다.',
      },
    },
    {
      heading: { en: '11. Contact Us', kr: '11. 문의처' },
      body: {
        en: 'If you have any questions about these Terms, please contact us:\n\n{TODO: Company Legal Name}\n{TODO: Street Address}\n{TODO: City, Country, Postal Code}\nEmail: {TODO: legal@example.com}',
        kr: '본 이용약관에 대해 궁금한 점이 있으시면 아래로 연락해 주시기 바랍니다:\n\n{TODO: 회사 법적 명칭}\n{TODO: 주소}\n{TODO: 시, 국가, 우편번호}\n이메일: {TODO: legal@example.com}',
      },
    },
  ],
};

export default function TermsOfServicePage() {
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
