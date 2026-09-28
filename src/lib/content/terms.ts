import type { Locale } from '@/lib/seo/site';

export interface TermsSection {
  heading: string;
  body: readonly string[];
}

export interface TermsContent {
  eyebrow: string;
  heading: string;
  updated: string;
  contactHeading: string;
  contactBeforeLink: string;
  contactLink: string;
  contactAfterLink: string;
  sections: readonly TermsSection[];
}

const TERMS: Record<Locale, TermsContent> = {
  ru: {
    eyebrow: 'Правовая информация',
    heading: 'Условия использования',
    updated: 'Последнее обновление: сентябрь 2026',
    contactHeading: 'Контакты',
    contactBeforeLink: 'Вопросы по этим условиям задавайте через ',
    contactLink: 'страницу контактов',
    contactAfterLink: '.',
    sections: [
      {
        heading: 'Общие положения',
        body: [
          'Сайт qaznedr.kz принадлежит ТОО «QAZNEDR HOLDING» (далее — «Компания»). Используя сайт, вы соглашаетесь с этими условиями.',
        ],
      },
      {
        heading: 'Информация на сайте',
        body: [
          'Сведения об участках носят ознакомительный характер и не являются публичной офертой. Условия сделки определяются отдельным договором.',
        ],
      },
      {
        heading: 'Статус участков',
        body: [
          'Свободность участка указана по проверке Компании на дату, указанную в карточке; статус может измениться. Компания не заявляет права на участки, по которым у неё нет лицензии.',
        ],
      },
      {
        heading: 'Геологические данные',
        body: [
          'Оценки приводятся с указанием стандарта (категории ГКЗ СССР или историческая оценка). Прогнозные ресурсы не являются запасами. Компания не гарантирует доходность и результат работ.',
        ],
      },
      {
        heading: 'Конфиденциальность',
        body: [
          'Материалы, переданные после подписания NDA, используются только для оценки сделки.',
          'Персональные данные из заявок обрабатываются только для ответа на обращение и не передаются третьим лицам, кроме случаев, предусмотренных законом.',
        ],
      },
    ],
  },
  kz: {
    eyebrow: 'Құқықтық ақпарат',
    heading: 'Пайдалану шарттары',
    updated: 'Соңғы жаңарту: 2026 жылғы қыркүйек',
    contactHeading: 'Байланыс',
    contactBeforeLink: 'Осы шарттарға қатысты сұрақтарды ',
    contactLink: 'байланыс беті арқылы',
    contactAfterLink: ' қойыңыз.',
    sections: [
      {
        heading: 'Жалпы ережелер',
        body: [
          'qaznedr.kz сайты «QAZNEDR HOLDING» ЖШС-не (бұдан әрі — «Компания») тиесілі. Сайтты пайдалану арқылы сіз осы шарттармен келісесіз.',
        ],
      },
      {
        heading: 'Сайттағы ақпарат',
        body: [
          'Учаскелер туралы мәліметтер таныстыру сипатында болады және жария оферта болып табылмайды. Мәміле шарттары жеке шартпен айқындалады.',
        ],
      },
      {
        heading: 'Учаскелердің мәртебесі',
        body: [
          'Учаскенің бос екені карточкада көрсетілген күнгі Компанияның тексеруі бойынша беріледі; мәртебе өзгеруі мүмкін. Компания лицензиясы жоқ учаскелерге құқық талап етпейді.',
        ],
      },
      {
        heading: 'Геологиялық деректер',
        body: [
          'Бағалар стандартын көрсете отырып беріледі (КСРО ГКЗ санаттары немесе тарихи бағалау). Болжамды ресурстар қор болып саналмайды. Компания табыстылыққа және жұмыстардың нәтижесіне кепілдік бермейді.',
        ],
      },
      {
        heading: 'Құпиялылық',
        body: [
          'NDA-ға қол қойылғаннан кейін берілген материалдар тек мәмілені бағалау үшін пайдаланылады.',
          'Өтінімдердегі дербес деректер тек өтінішке жауап беру үшін өңделеді және заңда көзделген жағдайлардан басқа кезде үшінші тұлғаларға берілмейді.',
        ],
      },
    ],
  },
  en: {
    eyebrow: 'Legal information',
    heading: 'Terms of Use',
    updated: 'Last updated: September 2026',
    contactHeading: 'Contact',
    contactBeforeLink: 'Please send questions about these terms through the ',
    contactLink: 'contact page',
    contactAfterLink: '.',
    sections: [
      {
        heading: 'General provisions',
        body: [
          'The qaznedr.kz website belongs to QAZNEDR HOLDING LLP (the “Company”). By using the website, you agree to these terms.',
        ],
      },
      {
        heading: 'Information on the website',
        body: [
          'Information about areas is provided for reference and is not a public offer. The terms of a transaction are set out in a separate agreement.',
        ],
      },
      {
        heading: 'Area status',
        body: [
          'An area is shown as free based on the Company’s check on the date stated on its card; its status may change. The Company does not claim rights to areas for which it has no licence.',
        ],
      },
      {
        heading: 'Geological data',
        body: [
          'Estimates state the applicable standard (USSR GKZ categories or a historical estimate). Prognostic resources are not reserves. The Company does not guarantee returns or the results of work.',
        ],
      },
      {
        heading: 'Confidentiality',
        body: [
          'Materials provided after an NDA is signed are used only to assess a transaction.',
          'Personal data from inquiries is processed only to respond to the inquiry and is not shared with third parties except in cases provided for by law.',
        ],
      },
    ],
  },
  zh: {
    eyebrow: '法律信息',
    heading: '使用条款',
    updated: '最后更新：2026年9月',
    contactHeading: '联系方式',
    contactBeforeLink: '如对本条款有疑问，请通过',
    contactLink: '联系页面',
    contactAfterLink: '提出。',
    sections: [
      {
        heading: '一般规定',
        body: [
          'qaznedr.kz 网站归 QAZNEDR HOLDING 有限责任合伙企业（以下简称“公司”）所有。使用本网站即表示您同意本条款。',
        ],
      },
      {
        heading: '网站信息',
        body: ['矿区信息仅供参考，不构成公开要约。交易条件由单独协议确定。'],
      },
      {
        heading: '矿区状态',
        body: [
          '矿区是否空白以公司在卡片所示日期进行的核查为准；状态可能发生变化。对于公司未持有许可证的矿区，公司不主张权利。',
        ],
      },
      {
        heading: '地质数据',
        body: [
          '估算结果注明所采用的标准（苏联国家储量委员会 GKZ 类别或历史估算）。预测资源量不属于储量。公司不保证收益或工作结果。',
        ],
      },
      {
        heading: '保密',
        body: [
          '签署 NDA 后提供的材料仅用于评估交易。',
          '咨询表单中的个人数据仅用于回复咨询；除法律规定的情形外，不会提供给第三方。',
        ],
      },
    ],
  },
};

export function termsFor(locale: Locale): TermsContent {
  return TERMS[locale];
}
