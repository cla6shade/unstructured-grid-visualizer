import { useEffect, useMemo, useState } from 'react';
import { useScenario } from '@/features/map/scenario/hooks/useScenario';
import {
  formatKstIso,
  nearestHourlyTimestamp,
  parseKstNaive,
} from '@/lib/timeUtils';
import { AmPmPicker } from './AmPmPicker';
import { DatePicker } from './DatePicker';
import { PlayButton } from './PlayButton';
import { ScenarioIdPicker } from './ScenarioIdPicker';
import { TimeDotTrack } from './TimeDotTrack';
import { TyphoonIdPicker } from './TyphoonIdPicker';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const HALF_DAY_SLOTS = 12;
const PLAY_INTERVAL_MS = 1500;

function startOfDayKst(ms: number) {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function ScenarioTimeSelector() {
  const catalog = useScenario((s) => s.catalog);
  const typhoonId = useScenario((s) => s.typhoonId);
  const scenarioId = useScenario((s) => s.scenarioId);
  const timestamp = useScenario((s) => s.timestamp);
  const setScenarioId = useScenario((s) => s.setScenarioId);
  const setTyphoonId = useScenario((s) => s.setTyphoonId);
  const setTimestamp = useScenario((s) => s.setTimestamp);

  const [isPlaying, setIsPlaying] = useState(false);

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

  const scenarioOptions = useMemo(
    () =>
      catalog.typhoons.find((t) => t.typhoon_id === typhoonId)?.scenario_ids ??
      [],
    [catalog, typhoonId],
  );

  const typhoonOptions = useMemo(
    () => catalog.typhoons.map((t) => t.typhoon_id),
    [catalog],
  );

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

  const handleTyphoonChange = (nextTyphoonId: string) => {
    const nextTyphoon = catalog.typhoons.find(
      (t) => t.typhoon_id === nextTyphoonId,
    );
    if (!nextTyphoon) return;
    const nextScenarioId = nextTyphoon.scenario_ids.at(-1);
    if (!nextScenarioId) return;
    setTyphoonId(nextTyphoonId);
    setScenarioId(nextScenarioId);
    const times = catalog.scenario_times.find(
      (t) => t.typhoon_id === nextTyphoonId && t.scenario_id === nextScenarioId,
    );
    if (times) {
      setTimestamp(nearestHourlyTimestamp(times.first_time, times.last_time));
    }
  };

  const handleScenarioChange = (nextScenarioId: string) => {
    setScenarioId(nextScenarioId);
    const times = catalog.scenario_times.find(
      (t) => t.typhoon_id === typhoonId && t.scenario_id === nextScenarioId,
    );
    if (times) {
      setTimestamp(nearestHourlyTimestamp(times.first_time, times.last_time));
    }
  };

  useEffect(() => {
    if (!isPlaying || !range) return;
    const id = setInterval(() => {
      const next = selectedTime.getTime() + HOUR_MS;
      if (next > range.last) {
        setIsPlaying(false);
        return;
      }
      setTimestamp(formatKstIso(next));
    }, PLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isPlaying, selectedTime, range, setTimestamp]);

  if (!range) return null;

  return (
    <div className="absolute bottom-[16px] left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 bg-[rgba(44,46,52,0.8)] rounded-[12px] px-3 py-3 w-[1040px] h-[59px] select-none">
      <TyphoonIdPicker
        value={typhoonId}
        options={typhoonOptions}
        onChange={handleTyphoonChange}
      />
      <ScenarioIdPicker
        value={scenarioId}
        options={scenarioOptions}
        onChange={handleScenarioChange}
      />
      <DatePicker
        value={selectedDate}
        options={dateOptions}
        onChange={handleDateChange}
      />
      <AmPmPicker value={ampmDerived} onChange={handleAmPmChange} />
      <PlayButton
        playing={isPlaying}
        onToggle={() => setIsPlaying((p) => !p)}
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
