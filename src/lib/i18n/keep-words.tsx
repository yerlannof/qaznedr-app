import { Fragment, type ReactNode } from 'react';

// Chinese headings may break between any two characters; a proper name or a
// term split across lines reads as an error (zh audit §3). Only headings use
// this: body text keeps normal CJK line breaking.
const ZH_UNBREAKABLE = [
  '哈萨克斯坦',
  '地质师',
  '许可证',
  '尽职调查',
  '矿业权',
  '承包商',
];
const PATTERN = new RegExp(`(${ZH_UNBREAKABLE.join('|')})`);

export function keepWords(text: string, locale: string): ReactNode {
  if (locale !== 'zh' || !PATTERN.test(text)) return text;
  return text.split(PATTERN).map((part, i) =>
    ZH_UNBREAKABLE.includes(part) ? (
      <span key={i} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}
