import type { Locale } from '@/lib/seo/site';

export interface FaqItem {
  q: string;
  a: string;
}

const RU: readonly FaqItem[] = [
  {
    q: 'Что делает QAZNEDR HOLDING?',
    a: 'Готовим сделки по свободным рудным участкам Казахстана: наши геологи изучают участок по фондовым отчётам, мы проверяем его статус, оформляем лицензию под сделку и сопровождаем инвестора. Архивные отчёты мы не продаём — мы продаём экспертизу и сопровождение.',
  },
  {
    q: 'Кому принадлежат участки на сайте?',
    a: 'Никому: это свободные площади, по нашей проверке на дату в карточке. Лицензии на них пока нет ни у кого, в том числе у нас. Лицензию оформляем под конкретную сделку.',
  },
  {
    q: 'Какие форматы сделки возможны?',
    a: 'Лицензия на инвестора с нашим сопровождением; лицензия на холдинг с последующей передачей; совместное предприятие или earn-in; только аналитика. Формат выбираем на встрече.',
  },
  {
    q: 'Откуда геологические данные?',
    a: 'Из советских и казахстанских фондовых геологических отчётов и публикаций; их изучают наши геологи. Запасы указываем только по категориям ГКЗ СССР (A, B, C1, C2) или как историческую оценку. Прогнозные ресурсы P1–P3 — прогноз, а не запасы.',
  },
  {
    q: 'Что я увижу после встречи?',
    a: 'После подписания NDA — название и координаты участка, оценку наших геологов, правовой статус и план оформления.',
  },
  {
    q: 'Какие ограничения есть у сделки?',
    a: 'Передача права недропользования и долей требует разрешения компетентного органа (ст. 44–45 Кодекса о недрах), кроме случаев из ст. 44 п. 2 — например, покупки, после которой у покупателя менее 25% в компании-недропользователе. Лицензию на разведку твёрдых полезных ископаемых нельзя передать в первый год её действия. Мы учитываем это при выборе формата.',
  },
  {
    q: 'Что вы гарантируете?',
    a: 'Качество нашей экспертизы и то, что статус участка проверен на указанную дату. Мы не гарантируем доходность, результат разведки и решения государственных органов.',
  },
  {
    q: 'Как связаться?',
    a: 'Напишите в WeChat или WhatsApp и укажите код участка, либо оставьте заявку на странице контактов. Отвечаем в течение рабочего дня.',
  },
];

const KZ: readonly FaqItem[] = [
  {
    q: 'QAZNEDR HOLDING немен айналысады?',
    a: 'Қазақстандағы кен учаскелері бойынша мәмілелерді дайындаймыз: геологтарымыз учаскені геологиялық қор есептері бойынша зерттейді, біз оның мәртебесін тексереміз, нақты мәмілеге лицензия рәсімдейміз және инвесторға қолдау көрсетеміз. Мұрағат есептерін сатпаймыз — сараптама мен мәмілені сүйемелдеу қызметін ұсынамыз.',
  },
  {
    q: 'Сайттағы учаскелер кімге тиесілі?',
    a: 'Ешкімге: карточкада көрсетілген күнгі тексеруіміз бойынша, бұл бос учаскелер. Әзірге оларға ешкімнің, соның ішінде біздің де лицензиямыз жоқ. Лицензия нақты мәміле үшін рәсімделеді.',
  },
  {
    q: 'Мәміленің қандай түрлері болуы мүмкін?',
    a: 'Инвестордың атына лицензия алып, оған қолдау көрсету; кейіннен беру шартымен лицензияны холдингтің атына алу; бірлескен кәсіпорын немесе earn-in; тек талдау қызметі. Форматты кездесуде таңдаймыз.',
  },
  {
    q: 'Геологиялық деректер қайдан алынады?',
    a: 'Кеңес Одағы мен Қазақстанның геологиялық қор есептері мен жарияланымдарынан; оларды геологтарымыз зерттейді. Қорларды тек КСРО Қор жөніндегі мемлекеттік комиссиясының (ГКЗ) A, B, C1, C2 санаттарымен немесе тарихи бағалау ретінде көрсетеміз. P1–P3 болжамды ресурстары — болжам, қор емес.',
  },
  {
    q: 'Кездесуден кейін не көремін?',
    a: 'Құпиялылық туралы келісімге (NDA) қол қойылғаннан кейін учаскенің атауы мен координаттарын, геологтарымыздың бағасын, құқықтық мәртебесін және рәсімдеу жоспарын көресіз.',
  },
  {
    q: 'Мәміледе қандай шектеулер бар?',
    a: 'Жер қойнауын пайдалану құқығын және үлестерді беру үшін Жер қойнауы туралы кодекстің 44–45-баптарына сәйкес құзыретті органның рұқсаты қажет. 44-баптың 2-тармағындағы жағдайлар, мысалы сатып алушының жер қойнауын пайдаланушы компаниядағы үлесі 25%-дан аз болатын сатып алу, бұған кірмейді. Қатты пайдалы қазбаларды барлау лицензиясын оның қолданылуының бірінші жылында беруге болмайды. Форматты таңдағанда осыны ескереміз.',
  },
  {
    q: 'Сіздер нені кепілдендіресіздер?',
    a: 'Сараптамамыздың сапасын және учаске мәртебесінің көрсетілген күні тексерілгенін. Табыстылықты, барлау нәтижесін немесе мемлекеттік органдардың шешімдерін кепілдендірмейміз.',
  },
  {
    q: 'Қалай байланысуға болады?',
    a: 'WeChat немесе WhatsApp арқылы жазып, учаске кодын көрсетіңіз немесе байланыс бетіндегі өтінімді қалдырыңыз. Жұмыс күні ішінде жауап береміз.',
  },
];

const EN: readonly FaqItem[] = [
  {
    q: 'What does QAZNEDR HOLDING do?',
    a: 'We prepare deals on free ore areas in Kazakhstan: our geologists study an area using geological fund reports, we check its status, prepare the licensing for the specific deal and support the investor. We do not sell archive reports — we sell expertise and deal support.',
  },
  {
    q: 'Who owns the areas on the site?',
    a: 'No one: these are free areas, per our check on the date shown on each card. No one holds a licence for them yet, including us. The licence is applied for under a specific deal.',
  },
  {
    q: 'What deal formats are possible?',
    a: "A licence in the investor's name with our support; a licence on the holding with a later transfer; a joint venture or earn-in; analytics only. We choose the format at a meeting.",
  },
  {
    q: 'Where does the geological data come from?',
    a: 'From Soviet and Kazakh geological fund reports and publications, studied by our geologists. We state reserves only in the categories of the USSR State Reserves Committee (GKZ: A, B, C1, C2) or as a historical estimate. P1–P3 prognostic resources are a forecast, not reserves.',
  },
  {
    q: 'What will I see after the meeting?',
    a: "Once an NDA is signed: the area's name and coordinates, our geologists' assessment, its legal status and a licensing plan.",
  },
  {
    q: 'What restrictions apply to a deal?',
    a: 'A transfer of a subsoil use right or of shares requires permission from the competent authority (Articles 44–45 of the Subsoil Code), except in the cases listed in Article 44(2) — for example, a purchase after which the buyer holds less than 25% of the subsoil user company. A solid-minerals exploration licence cannot be transferred in its first year. We take this into account when choosing the format.',
  },
  {
    q: 'What do you guarantee?',
    a: "The quality of our expertise and that the area's status was checked on the stated date. We do not guarantee returns, exploration results or decisions of government bodies.",
  },
  {
    q: 'How do I get in touch?',
    a: 'Message us on WeChat or WhatsApp with the area code, or leave a request on the contact page. We reply within one business day.',
  },
];

const ZH: readonly FaqItem[] = [
  {
    q: 'QAZNEDR HOLDING 做什么？',
    a: '我们为哈萨克斯坦的空白矿区筹备交易：我们的地质师依据地质资料馆藏报告研究矿区，我们核查其状态，围绕具体交易办理许可证申请，并全程协助投资者。我们不出售档案报告，我们提供的是专业评估与交易服务。',
  },
  {
    q: '网站上的矿区归谁所有？',
    a: '不归任何人所有：根据我们截至卡片所示日期的核查，这些是空白矿区。目前任何人（包括我们）都未持有其许可证。许可证将针对具体交易申请办理。',
  },
  {
    q: '可以采用哪些交易形式？',
    a: '以投资者名义申请许可证，由我们全程协助；许可证先登记在控股公司名下，之后再转让；合资或分阶段投入取得权益（earn-in）；仅提供分析服务。具体形式在会面时商定。',
  },
  {
    q: '地质数据从何而来？',
    a: '来自苏联及哈萨克斯坦的地质资料馆藏报告和公开出版物，由我们的地质师研究整理。储量仅按苏联国家储量委员会（GKZ）类别（A、B、C1、C2）标注，或注明为历史估算。P1–P3预测资源量属于预测，并非储量。',
  },
  {
    q: '会面后我能看到什么？',
    a: '签署保密协议（NDA）后：矿区名称和坐标、我们地质师的评估意见、法律状态以及许可证办理计划。',
  },
  {
    q: '交易有哪些限制？',
    a: '矿业权及股权的转让须经主管机关许可（《底土法》第44–45条），第44条第2款规定的情形除外，例如收购后买方在底土利用人公司中的持股不足25%。固体矿产勘查许可证在有效期第一年内不得转让。我们在选择交易形式时会考虑这些规定。',
  },
  {
    q: '你们保证什么？',
    a: '我们保证专业评估的质量，并保证矿区状态已于所注明日期核查。我们不保证收益、勘查结果或政府机关的决定。',
  },
  {
    q: '如何联系？',
    a: '请通过微信或 WhatsApp 联系我们并注明矿区编号，或在联系页面留言。我们在一个工作日内回复。',
  },
];

export const FAQ: Record<'ru' | 'kz' | 'en' | 'zh', readonly FaqItem[]> = {
  ru: RU,
  kz: KZ,
  en: EN,
  zh: ZH,
};

export function faqFor(locale: Locale): readonly FaqItem[] {
  return FAQ[locale];
}

export function faqJsonLd(items: readonly FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}
