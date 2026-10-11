import { formatDms, type Corner } from '@/lib/prospecting/coords';
import { plotGeometry, type Plot } from '@/lib/prospecting/plots';
import { translate } from '@/lib/i18n/translations';
import type { Locale } from '@/lib/seo/site';

const cell = 'border-t border-brand-line py-2.5 pr-3 text-left align-top';

/** Corner points as printed in the licence plus decimal degrees. */
export default function CoordinatesTable({
  plot,
  locale,
}: {
  plot: Plot;
  locale: Locale;
}) {
  const t = (key: string) => translate(locale, key);
  const { points } = plotGeometry(plot);
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm tabular-nums">
        <thead>
          <tr className="text-brand-muted">
            <th scope="col" className={`${cell} font-normal`}>
              {t('prospecting.colPoint')}
            </th>
            <th scope="col" className={`${cell} font-normal`}>
              {t('prospecting.colAsWritten')}
            </th>
            <th
              scope="col"
              className={`${cell} hidden font-normal sm:table-cell`}
            >
              {t('prospecting.colDecimal')}
            </th>
          </tr>
        </thead>
        <tbody>
          {(plot.corners_dms as Corner[]).map((c, i) => (
            <tr key={i}>
              <th scope="row" className={`${cell} font-semibold`}>
                {i + 1}
                {plot.corrected_corners.includes(i + 1) && (
                  <span aria-hidden>*</span>
                )}
              </th>
              <td className={`${cell} whitespace-nowrap`}>
                {formatDms(c[0], c[1], c[2])} / {formatDms(c[3], c[4], c[5])}
              </td>
              <td className={`${cell} hidden whitespace-nowrap sm:table-cell`}>
                {points[i].lat.toFixed(6)}, {points[i].lon.toFixed(6)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
