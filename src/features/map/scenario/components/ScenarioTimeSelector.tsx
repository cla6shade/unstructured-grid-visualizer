import { useEffect, useMemo } from 'react';
import { useScenario } from '@/features/map/scenario/hooks/useScenario';
import { useNextTimestep } from '@/features/map/scenario/hooks/useNextTimestep';
import { usePlaybackStore } from '@/features/map/scenario/store/playbackStore';
import { formatKstIso, parseKstNaive } from '@/lib/timeUtils';
import { AmPmPicker } from './AmPmPicker';
import { DatePicker } from './DatePicker';
import { PlayButton } from './PlayButton';
import { TimeDotTrack } from './TimeDotTrack';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const HALF_DAY_SLOTS = 12;
const PLAY_INTERVAL_MS = 3000;

function startOfDayKst(ms: number) {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function ScenarioTimeSelector() {
  const catalog = useScenario((s) => s.catalog);
  const typhoonId = useScenario((s) => s.typhoonId);
  const scenarioId = useScenario((s) => s.scenarioId);
  const timestamp = useScenario((s) => s.timestamp);
  const setTimestamp = useScenario((s) => s.setTimestamp);

  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const setIsPlaying = usePlaybackStore((s) => s.setIsPlaying);
  const nextTimestamp = useNextTimestep();

  const scenarioTimes = useMemo(
    () =>
      catalog.scenario_times.find(
        (t) => t.typhoon_id === typhoonId && t.scenario_id === scenarioId,
      ),
    [catalog, typhoonId, scenarioId],
  );

  const range = useMemo(() => {
    if (!scenarioTimes) return null;
    return {
      first: parseKstNaive(scenarioTimes.first_time),
      last: parseKstNaive(scenarioTimes.last_time),
    };
  }, [scenarioTimes]);

  const selectedTime = useMemo(() => new Date(timestamp), [timestamp]);

  const dateOptions = useMemo(() => {
    if (!range) return [];
    const startDay = startOfDayKst(range.first);
    const endDay = startOfDayKst(range.last);
    const days: Date[] = [];
    for (let t = startDay; t <= endDay; t += DAY_MS) {
      days.push(new Date(t));
    }
    return days;
  }, [range]);

  const selectedDate = useMemo(() => {
    const t = startOfDayKst(selectedTime.getTime());
    return new Date(t);
  }, [selectedTime]);

  const ampmDerived = useMemo(
    () => (selectedTime.getHours() < 12 ? ('오전' as const) : ('오후' as const)),
    [selectedTime],
  );

  const slots = useMemo(() => {
    const baseHour = ampmDerived === '오전' ? 0 : 12;
    return Array.from(
      { length: HALF_DAY_SLOTS },
      (_, i) => new Date(selectedDate.getTime() + (baseHour + i) * HOUR_MS),
    );
  }, [selectedDate, ampmDerived]);

  const commitTime = (ms: number) => {
    if (!range) return;
    const clamped = Math.max(range.first, Math.min(range.last, ms));
    setTimestamp(formatKstIso(clamped));
  };

  const handleDateChange = (date: Date) => {
    if (!range) return;
    const target = Math.max(date.getTime(), range.first);
    commitTime(target);
  };

  const handleAmPmChange = (value: '오전' | '오후') => {
    const baseHour = value === '오전' ? 0 : 12;
    commitTime(selectedDate.getTime() + baseHour * HOUR_MS);
  };

  // 재생: nextTimestamp(다음 스텝, 범위 밖이면 null)를 단일 출처로 쓴다.
  // timestamp가 바뀌면 nextTimestamp가 갱신돼 다음 스텝이 다시 예약되고,
  // 마지막 스텝(nextTimestamp == null)에 도달하면 자동 정지한다.
  useEffect(() => {
    if (!isPlaying) return;
    if (nextTimestamp == null) {
      setIsPlaying(false);
      return;
    }
    const id = setTimeout(
      () => setTimestamp(nextTimestamp),
      PLAY_INTERVAL_MS,
    );
    return () => clearTimeout(id);
  }, [isPlaying, nextTimestamp, setTimestamp, setIsPlaying]);

  if (!range) return null;

  return (
    <div className="absolute bottom-[16px] left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 bg-surface rounded-[12px] px-3 py-3 w-200 h-15 select-none">
      <DatePicker
        value={selectedDate}
        options={dateOptions}
        onChange={handleDateChange}
      />
      <AmPmPicker value={ampmDerived} onChange={handleAmPmChange} />
      <PlayButton
        playing={isPlaying}
        onToggle={() => setIsPlaying(!isPlaying)}
      />
      <TimeDotTrack
        slots={slots}
        selectedTime={selectedTime}
        disabledBefore={range.first}
        disabledAfter={range.last}
        onSelect={(slot) => commitTime(slot.getTime())}
      />
    </div>
  );
}
