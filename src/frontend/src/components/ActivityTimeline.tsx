import { Activity, Baby, Droplets, Milk, UtensilsCrossed } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  useGetBreastfeedingSessionsForChild,
  useGetDiaperLogsForChild,
  useGetFeedingSessionsForChild,
  useGetMilkPumpingSessionsForChild,
  useGetTummyTimeSessionsForChild,
} from "../hooks/useQueries";

interface ActivityTimelineProps {
  childId: string | null;
}

const HOUR_WIDTH = 80;
const VISIBLE_HOURS = 12;

function nsToDate(ns: bigint): Date {
  return new Date(Number(ns) / 1_000_000);
}

type ActivityType =
  | "diaper"
  | "breastfeeding"
  | "pumping"
  | "tummy"
  | "feeding";

interface TimelineEvent {
  type: ActivityType;
  time: Date;
}

const ACTIVITY_CONFIG: Record<
  ActivityType,
  { Icon: React.ElementType; color: string; label: string }
> = {
  diaper: { Icon: Baby, color: "#f472b6", label: "Pampersas" },
  breastfeeding: { Icon: Milk, color: "#a78bfa", label: "Žindymas" },
  pumping: { Icon: Droplets, color: "#60a5fa", label: "Pieno traukimas" },
  tummy: { Icon: Activity, color: "#34d399", label: "Pilvo laikas" },
  feeding: { Icon: UtensilsCrossed, color: "#fb923c", label: "Maitinimas" },
};

export default function ActivityTimeline({ childId }: ActivityTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());
  const [activeLabel, setActiveLabel] = useState<{
    key: string;
    label: string;
  } | null>(null);

  const { data: diaperLogs = [] } = useGetDiaperLogsForChild(childId);
  const { data: breastfeedingSessions = [] } =
    useGetBreastfeedingSessionsForChild(childId);
  const { data: pumpingSessions = [] } =
    useGetMilkPumpingSessionsForChild(childId);
  const { data: tummySessions = [] } = useGetTummyTimeSessionsForChild(childId);
  const { data: feedingSessions = [] } = useGetFeedingSessionsForChild(childId);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  // Hide label when clicking outside
  useEffect(() => {
    const handler = () => setActiveLabel(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const currentHour = new Date(now);
  currentHour.setMinutes(0, 0, 0);

  const hours: Date[] = [];
  for (let i = VISIBLE_HOURS - 1; i >= 0; i--) {
    const h = new Date(currentHour);
    h.setHours(h.getHours() - i);
    hours.push(h);
  }

  const rangeStart = hours[0];
  const rangeEnd = new Date(currentHour);
  rangeEnd.setHours(rangeEnd.getHours() + 1);

  const events: TimelineEvent[] = [
    ...diaperLogs.map((d) => ({
      type: "diaper" as ActivityType,
      time: nsToDate(d.timestamp),
    })),
    ...breastfeedingSessions.map((s) => ({
      type: "breastfeeding" as ActivityType,
      time: nsToDate(s.startTime),
    })),
    ...pumpingSessions.map((s) => ({
      type: "pumping" as ActivityType,
      time: nsToDate(s.timestamp),
    })),
    ...tummySessions.map((s) => ({
      type: "tummy" as ActivityType,
      time: nsToDate(s.startTime),
    })),
    ...feedingSessions.map((s) => ({
      type: "feeding" as ActivityType,
      time: nsToDate(s.timestamp),
    })),
  ];

  const visibleEvents = events.filter(
    (e) => e.time >= rangeStart && e.time < rangeEnd,
  );

  const eventsByHour: Record<number, TimelineEvent[]> = {};
  for (const event of visibleEvents) {
    const eventHour = new Date(event.time);
    eventHour.setMinutes(0, 0, 0);
    const idx = hours.findIndex((h) => h.getTime() === eventHour.getTime());
    if (idx !== -1) {
      if (!eventsByHour[idx]) eventsByHour[idx] = [];
      eventsByHour[idx].push(event);
    }
  }

  const totalWidth = HOUR_WIDTH * VISIBLE_HOURS;
  const minuteOffset = now.getMinutes() / 60;
  const markerLeft =
    (VISIBLE_HOURS - 1 + minuteOffset) * HOUR_WIDTH + HOUR_WIDTH / 2;

  return (
    <div
      data-ocid="timeline.panel"
      className="rounded-xl border border-white/10 bg-card/60 backdrop-blur-sm px-3 pt-3 pb-2"
    >
      <p className="mb-2 text-xs font-medium text-muted-foreground tracking-wide uppercase">
        Veiklos chronologija
      </p>
      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-hidden"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        <div className="relative" style={{ width: totalWidth, height: 84 }}>
          {/* Horizontal center line */}
          <div
            className="absolute bg-white/10"
            style={{ top: 36, left: 0, width: totalWidth, height: 1 }}
          />

          {/* Current time marker */}
          <div
            className="absolute rounded-sm"
            style={{
              left: markerLeft,
              top: 0,
              height: 68,
              width: 2,
              background:
                "linear-gradient(to bottom, transparent 0%, rgba(244,114,182,0.7) 40%, rgba(244,114,182,0.7) 60%, transparent 100%)",
            }}
          />

          {/* Hour columns */}
          {hours.map((hour, idx) => {
            const colLeft = idx * HOUR_WIDTH;
            const colEvents = eventsByHour[idx] || [];
            const isCurrentHour = idx === hours.length - 1;
            const label = hour.toLocaleTimeString("lt-LT", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={hour.getTime()}
                style={{
                  position: "absolute",
                  left: colLeft,
                  top: 0,
                  width: HOUR_WIDTH,
                  height: 84,
                }}
              >
                {/* Tick mark */}
                <div
                  className="absolute bg-white/20"
                  style={{
                    left: "50%",
                    top: 33,
                    width: 1,
                    height: 7,
                    transform: "translateX(-50%)",
                  }}
                />

                {/* Hour label */}
                <div
                  className={`absolute bottom-0 left-0 right-0 text-center select-none ${
                    isCurrentHour
                      ? "text-pink-400 font-semibold"
                      : "text-muted-foreground/50"
                  }`}
                  style={{ fontSize: 10, lineHeight: "14px" }}
                >
                  {label}
                </div>

                {/* Events area above line */}
                <div
                  className="absolute flex flex-wrap gap-0.5 content-end justify-center"
                  style={{ left: 2, right: 2, top: 2, bottom: 50 }}
                >
                  {colEvents.map((ev, evIdx) => {
                    const cfg = ACTIVITY_CONFIG[ev.type];
                    const eventKey = `${idx}-${evIdx}-${ev.type}`;
                    const isActive = activeLabel?.key === eventKey;
                    return (
                      <div key={eventKey} className="relative">
                        <button
                          type="button"
                          title={cfg.label}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveLabel(
                              isActive
                                ? null
                                : { key: eventKey, label: cfg.label },
                            );
                          }}
                          className="flex items-center justify-center rounded-full flex-shrink-0 transition-transform hover:scale-110"
                          style={{
                            width: 20,
                            height: 20,
                            background: `${cfg.color}20`,
                            border: `1px solid ${cfg.color}${isActive ? "cc" : "50"}`,
                            outline: isActive
                              ? `2px solid ${cfg.color}60`
                              : undefined,
                          }}
                        >
                          <cfg.Icon
                            size={11}
                            style={{ color: cfg.color }}
                            strokeWidth={2}
                          />
                        </button>
                        {isActive && (
                          <div
                            className="absolute z-50 bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-medium text-white shadow-lg pointer-events-none"
                            style={{ background: cfg.color }}
                          >
                            {cfg.label}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
